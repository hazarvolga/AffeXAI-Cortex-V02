/**
 * F3.3 acceptance: every portal route has its own title, one h1, no horizontal
 * overflow at 375/768/1280 px, no serious axe violations and a keyboard path
 * into the content.
 *
 *   PORTAL_ACCEPTANCE_ISOLATED=1 BASE_URL=http://localhost:19003 \
 *   [CHROME_PATH=/path/to/chrome] [ONLY=/portal/kb] \
 *   node apps/frontend/scripts/acceptance/portal-routes.cjs
 *
 * Same harness as crm-confirm-dialog.cjs (isolated G0 stack, frontend on :19003).
 */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");

if (process.env.PORTAL_ACCEPTANCE_ISOLATED !== "1") {
  throw new Error(
    "Isolated acceptance marker required (PORTAL_ACCEPTANCE_ISOLATED=1)",
  );
}

const repo = path.resolve(__dirname, "../../../..");
const requireFromRepo = createRequire(path.join(repo, "package.json"));
const { chromium } = requireFromRepo("playwright");
const bcrypt = createRequire(path.join(repo, "apps/backend/package.json"))(
  "bcryptjs",
);
// axe-core is a transitive dev dependency; read it from the pnpm store.
const pnpmStore = path.join(repo, "node_modules/.pnpm");
const axeDir = fs
  .readdirSync(pnpmStore)
  .find((name) => name.startsWith("axe-core@"));
if (!axeDir) throw new Error("axe-core not found in node_modules/.pnpm");
const AXE_PATH = path.join(
  pnpmStore,
  axeDir,
  "node_modules/axe-core/axe.min.js",
);

const BASE_URL = process.env.BASE_URL || "http://localhost:19003";
const DB_CONTAINER = "affexai-g0-isolated-postgres-test-1";
const PASSWORD = "Fixture-Portal-2026!";
const TENANT = "portal-accept-a";
const ROLE_ID = "d6000000-0000-4000-8000-000000000001";
const USER_ID = "d7000000-0000-4000-8000-000000000001";
const DEFAULT_TITLE = "Portal · AffeXAI";
const WIDTHS = [375, 768, 1280];
const MISSING_ID = "00000000-0000-4000-8000-00000000dead";

const ROUTES = [
  "/portal/dashboard",
  "/portal/certificates",
  "/portal/courses",
  "/portal/downloads",
  "/portal/events",
  "/portal/events/discover",
  `/portal/events/${MISSING_ID}`,
  "/portal/kb",
  "/portal/kb/olmayan-makale",
  "/portal/licenses",
  "/portal/newsletter",
  "/portal/notifications",
  "/portal/orders",
  "/portal/profile",
  "/portal/settings",
  "/portal/support",
  "/portal/support/new",
  `/portal/support/${MISSING_ID}`,
  "/portal/videos",
].filter((route) => !process.env.ONLY || route.startsWith(process.env.ONLY));

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
  sql(`DELETE FROM user_roles WHERE "userId"='${USER_ID}';
       DELETE FROM users WHERE id='${USER_ID}';
       DELETE FROM roles WHERE id='${ROLE_ID}';
       DELETE FROM organizations WHERE slug='${TENANT}';`);
}

function seed() {
  const hash = bcrypt.hashSync(PASSWORD, 10);
  sql(`INSERT INTO organizations(name,slug) VALUES('Portal Kabul','${TENANT}');
    INSERT INTO roles(id,tenant_id,name,"displayName",description,permissions,is_active,is_custom)
      VALUES('${ROLE_ID}','${TENANT}','customer','Müşteri','Portal acceptance','["events.view","certificates.view"]'::jsonb,true,false);
    INSERT INTO users(id,tenant_id,email,password,"firstName","lastName","isActive","emailVerified","tokenVersion","isSubscribedToNewsletter","organizationId","roleId")
      VALUES('${USER_ID}','${TENANT}','musteri@portal.test','${hash}','Portal','Müşteri',true,true,1,false,(SELECT id FROM organizations WHERE slug='${TENANT}'),'${ROLE_ID}');
    INSERT INTO user_roles(tenant_id,"userId","roleId","isPrimary") VALUES('${TENANT}','${USER_ID}','${ROLE_ID}',true);`);
}

// The harness backend keys its 60/min limit on the frontend server's IP, so
// each route is loaded once and re-checked at the other widths by resizing.
const PACE_MS = Number(process.env.PACE_MS || 3_000);

async function load(page, route, consoleErrors) {
  const onConsole = (message) =>
    message.type() === "error" && consoleErrors.push(message.text());
  page.on("console", onConsole);
  await page.setViewportSize({ width: WIDTHS[0], height: 900 });
  await page.goto(BASE_URL + route, { waitUntil: "load" });
  // Some pages poll or hold a socket open, so network idle is only a best effort.
  await page
    .waitForLoadState("networkidle", { timeout: 5_000 })
    .catch(() => {});
  await page.waitForTimeout(500);
  page.off("console", onConsole);
  await page.addScriptTag({ path: AXE_PATH });
}

async function audit(page, width, consoleErrors) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(300);
  const result = await page.evaluate(async () => {
    const axeResult = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
    });
    return {
      title: document.title,
      h1: document.querySelectorAll("h1").length,
      overflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      serious: axeResult.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${v.id}@${v.nodes[0].target}`),
    };
  });
  // Keyboard: the first Tab is the skip link, and Enter moves focus into <main>.
  // Focusing <body> resets the sequential focus start to the top of the page.
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });
  await page.keyboard.press("Tab");
  await page.evaluate(() => document.body.removeAttribute("tabindex"));
  const firstStop = await page.evaluate(() =>
    document.activeElement?.textContent?.trim(),
  );
  if (firstStop === "Ana içeriğe geç") await page.keyboard.press("Enter");
  const reachesMain = await page.evaluate(() =>
    Boolean(document.activeElement?.closest("main")),
  );
  return { ...result, reachesMain, consoleErrors };
}

(async () => {
  cleanup();
  seed();
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
  });
  const failures = [];
  const titles = new Map();
  try {
    const page = await (await browser.newContext()).newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.fill("#login-email", "musteri@portal.test");
    await page.fill("input[type=password]", PASSWORD);
    await page.keyboard.press("Enter");
    await page.waitForURL("**/portal/**", { timeout: 20_000 });

    for (const route of ROUTES) {
      const consoleErrors = [];
      try {
        await load(page, route, consoleErrors);
      } catch (error) {
        console.log(
          `FAIL ${route} did not load: ${error.message.split("\n")[0]}`,
        );
        failures.push({ route, width: 0, problems: ["load"], consoleErrors });
        continue;
      }
      for (const width of WIDTHS) {
        let r;
        try {
          r = await audit(page, width, consoleErrors);
        } catch (error) {
          console.log(
            `FAIL ${width}px ${route} crashed: ${error.message.split("\n")[0]}`,
          );
          failures.push({
            route,
            width,
            problems: ["crashed"],
            consoleErrors: [],
          });
          continue;
        }
        const problems = [];
        if (
          !r.title ||
          r.title === DEFAULT_TITLE ||
          r.title === "AffeXAI Cortex"
        )
          problems.push(`title="${r.title}"`);
        if (r.h1 !== 1) problems.push(`h1=${r.h1}`);
        if (r.overflow > 0) problems.push(`overflow=${r.overflow}`);
        if (r.serious.length) problems.push(`axe=${r.serious.join(",")}`);
        if (!r.reachesMain) problems.push("keyboard-cannot-reach-main");
        // A missing record is expected to log its 404; only its page states are judged.
        if (r.consoleErrors.length && !route.includes(MISSING_ID))
          problems.push(`console=${r.consoleErrors.length}`);
        if (width === 1280) titles.set(route, r.title);
        const status = problems.length ? "FAIL" : "PASS";
        console.log(`${status} ${width}px ${route} ${problems.join(" ")}`);
        if (problems.length)
          failures.push({
            route,
            width,
            problems,
            consoleErrors: r.consoleErrors,
          });
      }
      await page.waitForTimeout(PACE_MS);
    }
    if (!process.env.ONLY) {
      // A customer saves their own settings through PATCH /users/me (no admin API).
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${BASE_URL}/portal/settings`, { waitUntil: "load" });
      const city = page.locator("#city");
      await city.waitFor({ timeout: 15_000 });
      await city.fill("İzmir");
      const saved = page.waitForResponse(
        (r) =>
          r.url().endsWith("/api/users/me") && r.request().method() === "PATCH",
      );
      await page.getByRole("button", { name: "Kaydet" }).first().click();
      const status = (await saved).status();
      const stored = sql(`SELECT city FROM users WHERE id='${USER_ID}'`);
      const ok = status === 200 && stored === "İzmir";
      console.log(
        `${ok ? "PASS" : "FAIL"} customer saves own settings (PATCH /users/me ${status}, city=${stored})`,
      );
      if (!ok)
        failures.push({
          route: "/portal/settings save",
          width: 1280,
          problems: ["save"],
          consoleErrors: [],
        });
    }
  } finally {
    await browser.close();
    if (process.env.KEEP_FIXTURES !== "1") cleanup();
  }
  const total = ROUTES.length * WIDTHS.length;
  console.log(`${total - failures.length}/${total} route×width checks passed`);
  if (process.env.VERBOSE === "1") {
    for (const f of failures)
      for (const e of f.consoleErrors)
        console.log(`  console ${f.route}: ${e.slice(0, 160)}`);
  }
  process.exitCode = failures.length ? 1 : 0;
})();
