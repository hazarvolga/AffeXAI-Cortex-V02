/**
 * F3.5+ acceptance sweep: tenant admin routes have their own title, one h1, no
 * horizontal overflow at 375/768/1280 px, no serious axe violations, a skip link
 * into <main> and no console errors.
 *
 *   TENANT_ROUTES_ACCEPTANCE_ISOLATED=1 BASE_URL=http://localhost:19003 \
 *   [ROUTE_SET=email|support|cms] [ONLY=email/campaigns] [CHROME_PATH=...] \
 *   node apps/frontend/scripts/acceptance/tenant-routes.cjs
 *
 * Same harness as tenant-crud.cjs. Each route is loaded once and re-checked by
 * resizing, and routes are paced, because the harness backend counts every API
 * call against one IP.
 */
const path = require("node:path");
const { createRequire } = require("node:module");
const { AXE_PATH, repo, tenantFixture } = require("./lib/tenant-fixture.cjs");

if (process.env.TENANT_ROUTES_ACCEPTANCE_ISOLATED !== "1") {
  throw new Error(
    "Isolated acceptance marker required (TENANT_ROUTES_ACCEPTANCE_ISOLATED=1)",
  );
}

const { chromium } = createRequire(path.join(repo, "package.json"))(
  "playwright",
);

const BASE_URL = process.env.BASE_URL || "http://localhost:19003";
const TENANT = "routes-accept-a";
const fixture = tenantFixture({
  tenant: TENANT,
  email: "admin@routes.test",
  password: "Fixture-Routes-2026!",
  roleId: "da000000-0000-4000-8000-000000000001",
  userId: "db000000-0000-4000-8000-000000000001",
});
const WIDTHS = [375, 768, 1280];
const PACE_MS = Number(process.env.PACE_MS || 3_000);
const MISSING = "00000000-0000-4000-8000-00000000dead";
const DEFAULT_TITLES = new Set([
  "",
  "AffeXAI Cortex",
  "Yönetim · AffeXAI Cortex",
]);

const ROUTE_SETS = {
  email: [
    "email",
    "email/analytics",
    "email/automations",
    `email/automations/${MISSING}`,
    "email/automations/builder",
    "email/automations/new",
    "email/campaigns",
    `email/campaigns/${MISSING}`,
    "email/campaigns/new",
    "email/email-templates",
    "email/groups",
    "email/segments",
    "email/subscribers",
    "email/subscribers/import",
    "email/subscribers/new",
    "email/templates",
    "email/validation",
    "email/validator",
  ],
  support: [
    "support",
    `support/${MISSING}`,
    "support/ai-insights",
    "support/analytics",
    "support/categories",
    "support/email-templates",
    "support/faq-learning",
    "support/faq-learning/providers",
    "support/faq-learning/review",
    "support/faq-learning/settings",
    "support/knowledge-base",
    "support/knowledge-base/new",
    "support/knowledge-sources",
    "support/macros",
    "support/macros/new",
    "support/new",
    "support/templates",
  ],
  cms: [
    "cms",
    "cms/analytics",
    "cms/analytics/ab-tests",
    "cms/analytics/heatmaps",
    "cms/categories",
    "cms/components",
    "cms/editor",
    "cms/favorites",
    "cms/media",
    "cms/menus",
    "cms/pages",
    "cms/reusable-components",
    `cms/reusable-components/${MISSING}`,
    "cms/reusable-sections",
    "cms/reusable-sections/new",
    `cms/reusable-sections/${MISSING}`,
    "cms/templates",
    "design",
    "email/templates/builder",
  ],
};
const ROUTES = (
  ROUTE_SETS[process.env.ROUTE_SET] ?? Object.values(ROUTE_SETS).flat()
).filter((route) => !process.env.ONLY || route.startsWith(process.env.ONLY));

async function inspect(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(300);
  const result = await page.evaluate(async () => {
    const run = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
    });
    return {
      title: document.title,
      // Headings inside aria-hidden samples (block previews) are not part of the page outline.
      h1: [...document.querySelectorAll("h1")].filter(
        (h) => !h.closest('[aria-hidden="true"]'),
      ).length,
      mains: document.querySelectorAll("main").length,
      overflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      serious: run.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${v.id}@${v.nodes[0].target}`),
    };
  });
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() =>
    document.activeElement?.textContent?.trim(),
  );
  if (first === "Ana içeriğe geç") await page.keyboard.press("Enter");
  const reachesMain = await page.evaluate(() =>
    Boolean(document.activeElement?.closest("main")),
  );
  await page.evaluate(() => document.body.removeAttribute("tabindex"));
  return { ...result, reachesMain };
}

(async () => {
  fixture.cleanup();
  fixture.seed();
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
  });
  const failures = [];
  try {
    const page = await (await browser.newContext()).newPage();
    page.on("dialog", (dialog) => {
      failures.push({
        route: page.url(),
        width: 0,
        problems: [`native-dialog:${dialog.type()}`],
      });
      void dialog.dismiss();
    });
    await fixture.login(page, BASE_URL);

    for (const route of ROUTES) {
      const consoleErrors = [];
      const onConsole = (message) =>
        message.type() === "error" && consoleErrors.push(message.text());
      page.on("console", onConsole);
      try {
        await page.setViewportSize({ width: WIDTHS[0], height: 900 });
        await page.goto(`${BASE_URL}/${TENANT}/admin/${route}`, {
          waitUntil: "load",
        });
        await page
          .waitForLoadState("networkidle", { timeout: 5_000 })
          .catch(() => {});
        await page.waitForTimeout(800);
        await page.addScriptTag({ path: AXE_PATH });
      } catch (error) {
        console.log(
          `FAIL ${route} did not load: ${error.message.split("\n")[0]}`,
        );
        failures.push({ route, width: 0, problems: ["load"] });
        page.off("console", onConsole);
        continue;
      }
      page.off("console", onConsole);
      for (const width of WIDTHS) {
        let r;
        try {
          r = await inspect(page, width);
        } catch (error) {
          console.log(
            `FAIL ${width}px ${route} crashed: ${error.message.split("\n")[0]}`,
          );
          failures.push({ route, width, problems: ["crashed"] });
          continue;
        }
        const problems = [];
        // UX-CONTRACT: "[Sayfa] · AffeXAI Cortex".
        if (
          DEFAULT_TITLES.has(r.title) ||
          !r.title.endsWith(" · AffeXAI Cortex")
        )
          problems.push(`title="${r.title}"`);
        if (r.h1 !== 1) problems.push(`h1=${r.h1}`);
        if (r.mains !== 1) problems.push(`main=${r.mains}`);
        if (r.overflow > 0) problems.push(`overflow=${r.overflow}`);
        if (r.serious.length) problems.push(`axe=${r.serious.join(",")}`);
        if (!r.reachesMain) problems.push("keyboard");
        // A missing record is expected to log its 404; its page states are judged instead.
        if (
          width === WIDTHS[0] &&
          consoleErrors.length &&
          !route.includes(MISSING)
        )
          problems.push(`console=${consoleErrors.length}`);
        console.log(
          `${problems.length ? "FAIL" : "PASS"} ${width}px ${route} ${problems.join(" ")}`,
        );
        if (problems.length)
          failures.push({ route, width, problems, consoleErrors });
      }
      await page.waitForTimeout(PACE_MS);
    }
  } finally {
    await browser.close();
    if (process.env.KEEP_FIXTURES !== "1") fixture.cleanup();
  }
  const total = ROUTES.length * WIDTHS.length;
  console.log(`${total - failures.length}/${total} route×width checks passed`);
  if (process.env.VERBOSE === "1") {
    for (const f of failures)
      for (const e of f.consoleErrors ?? [])
        console.log(`  console ${f.route}: ${e.slice(0, 180)}`);
  }
  process.exitCode = failures.length ? 1 : 0;
})();
