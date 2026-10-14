/**
 * F3.5+ acceptance sweep: tenant admin routes have their own title, one h1, no
 * horizontal overflow at 375/768/1280 px, no serious axe violations, a skip link
 * into <main> and no console errors.
 *
 *   TENANT_ROUTES_ACCEPTANCE_ISOLATED=1 BASE_URL=http://localhost:19003 \
 *   [ROUTE_SET=email|support] [ONLY=email/campaigns] [CHROME_PATH=...] \
 *   node apps/frontend/scripts/acceptance/tenant-routes.cjs
 *
 * Same harness as tenant-crud.cjs. Each route is loaded once and re-checked by
 * resizing, and routes are paced, because the harness backend counts every API
 * call against one IP.
 */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");

if (process.env.TENANT_ROUTES_ACCEPTANCE_ISOLATED !== "1") {
  throw new Error(
    "Isolated acceptance marker required (TENANT_ROUTES_ACCEPTANCE_ISOLATED=1)",
  );
}

const repo = path.resolve(__dirname, "../../../..");
const { chromium } = createRequire(path.join(repo, "package.json"))(
  "playwright",
);
const bcrypt = createRequire(path.join(repo, "apps/backend/package.json"))(
  "bcryptjs",
);
const pnpmStore = path.join(repo, "node_modules/.pnpm");
const AXE_PATH = path.join(
  pnpmStore,
  fs.readdirSync(pnpmStore).find((name) => name.startsWith("axe-core@")),
  "node_modules/axe-core/axe.min.js",
);

const BASE_URL = process.env.BASE_URL || "http://localhost:19003";
const DB_CONTAINER = "affexai-g0-isolated-postgres-test-1";
const PASSWORD = "Fixture-Routes-2026!";
const TENANT = "routes-accept-a";
const ROLE_ID = "da000000-0000-4000-8000-000000000001";
const USER_ID = "db000000-0000-4000-8000-000000000001";
const WIDTHS = [375, 768, 1280];
const PACE_MS = Number(process.env.PACE_MS || 3_000);
const MISSING = "00000000-0000-4000-8000-00000000dead";
// The real tenant administrator permission set (there is no wildcard permission).
const TENANT_ADMIN_PERMISSIONS = (() => {
  const migration = fs.readFileSync(
    path.join(
      repo,
      "apps/backend/src/core/database/migrations/1791417600000-TenantAdminPermissions.ts",
    ),
    "utf8",
  );
  const block = migration.match(
    /TENANT_PERMISSION_SNAPSHOT = Object\.freeze\(\[([\s\S]*?)\]\)/,
  );
  if (!block) throw new Error("Tenant permission snapshot not found");
  return [...block[1].matchAll(/['"]([a-z0-9_.:-]+)['"]/g)].map((m) => m[1]);
})();
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
};
const ROUTES = (
  ROUTE_SETS[process.env.ROUTE_SET] ?? [
    ...ROUTE_SETS.email,
    ...ROUTE_SETS.support,
  ]
).filter((route) => !process.env.ONLY || route.startsWith(process.env.ONLY));

function sql(statement) {
  return execFileSync(
    "docker",
    [
      "exec",
      "-i",
      DB_CONTAINER,
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "g0_test",
      "-d",
      "affexai_g0_ephemeral",
      "-At",
    ],
    { input: statement, encoding: "utf8" },
  ).trim();
}

function cleanup() {
  sql(`DELETE FROM user_roles WHERE tenant_id='${TENANT}';
       DELETE FROM users WHERE tenant_id='${TENANT}';
       DELETE FROM roles WHERE tenant_id='${TENANT}';
       DELETE FROM organizations WHERE slug='${TENANT}';`);
}

function seed() {
  const hash = bcrypt.hashSync(PASSWORD, 10);
  sql(`INSERT INTO organizations(name,slug) VALUES('Rota Kabul','${TENANT}');
    INSERT INTO roles(id,tenant_id,name,"displayName",description,permissions,is_active,is_custom)
      VALUES('${ROLE_ID}','${TENANT}','admin','Yönetici','Route sweep','${JSON.stringify(TENANT_ADMIN_PERMISSIONS)}'::jsonb,true,false);
    INSERT INTO users(id,tenant_id,email,password,"firstName","lastName","isActive","emailVerified","tokenVersion","isSubscribedToNewsletter","organizationId","roleId")
      VALUES('${USER_ID}','${TENANT}','admin@routes.test','${hash}','Rota','Yönetici',true,true,1,false,(SELECT id FROM organizations WHERE slug='${TENANT}'),'${ROLE_ID}');
    INSERT INTO user_roles(tenant_id,"userId","roleId","isPrimary") VALUES('${TENANT}','${USER_ID}','${ROLE_ID}',true);`);
}

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
      h1: document.querySelectorAll("h1").length,
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
  cleanup();
  seed();
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
    await page.goto(`${BASE_URL}/${TENANT}/admin/login`);
    await page.fill("#login-email", "admin@routes.test");
    await page.fill("input[type=password]", PASSWORD);
    await page.keyboard.press("Enter");
    await page.waitForURL((url) => !url.pathname.endsWith("/login"), {
      timeout: 20_000,
    });

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
        if (DEFAULT_TITLES.has(r.title)) problems.push(`title="${r.title}"`);
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
    if (process.env.KEEP_FIXTURES !== "1") cleanup();
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
