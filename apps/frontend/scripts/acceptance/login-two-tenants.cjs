/**
 * F2 sign-in acceptance against the isolated G0 harness (docker-compose.test.yml).
 *
 *   LOGIN_ACCEPTANCE_ISOLATED=1 BASE_URL=http://localhost:19003 \
 *   [CHROME_PATH=/path/to/chrome] node apps/frontend/scripts/acceptance/login-two-tenants.cjs
 *
 * Seeds two tenants straight into the ephemeral harness database, drives the
 * real browser with the keyboard only, then removes every fixture it created.
 * Login discovery is throttled (10/min per client) and the last scenario uses
 * that up on purpose: run the suite at most once a minute.
 */
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { createRequire } = require("node:module");
const path = require("node:path");

if (process.env.LOGIN_ACCEPTANCE_ISOLATED !== "1") {
  throw new Error(
    "Isolated acceptance marker required (LOGIN_ACCEPTANCE_ISOLATED=1)",
  );
}

const repo = path.resolve(__dirname, "../../../..");
const { chromium } = createRequire(path.join(repo, "package.json"))(
  "playwright",
);
const bcrypt = createRequire(path.join(repo, "apps/backend/package.json"))(
  "bcryptjs",
);

const BASE_URL = process.env.BASE_URL || "http://localhost:19003";
const DB_CONTAINER = "affexai-g0-isolated-postgres-test-1";
const PASSWORD = "Fixture-Login-2026!";
const T = { a: "login-accept-a", b: "login-accept-b" };
const ids = {
  roleAdminA: "a1000000-0000-4000-8000-000000000001",
  roleCustomerA: "a1000000-0000-4000-8000-000000000002",
  roleCustomerB: "b1000000-0000-4000-8000-000000000001",
  sharedA: "a2000000-0000-4000-8000-000000000001",
  sharedB: "b2000000-0000-4000-8000-000000000001",
  soloA: "a2000000-0000-4000-8000-000000000002",
};
const FAILURE = "E-posta veya şifre hatalı";
const RATE_LIMITED = "çok fazla deneme";
// The form's own alert; Next's route announcer also has role=alert inside a shadow root.
const FAILURE_NOTICE = "form p[role=alert], p[role=alert]";

async function failureText(page) {
  const notice = page.locator(FAILURE_NOTICE).first();
  await notice.waitFor();
  // Focus moves to the notice one frame after it renders.
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("role") === "alert",
  );
  return notice.textContent();
}

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
  );
}

function cleanup() {
  const users = Object.values(ids).filter((id) => id.includes("2000000"));
  sql(`DELETE FROM user_roles WHERE "userId" IN ('${users.join("','")}');
       DELETE FROM users WHERE id IN ('${users.join("','")}');
       DELETE FROM roles WHERE id IN ('${ids.roleAdminA}','${ids.roleCustomerA}','${ids.roleCustomerB}');
       DELETE FROM organizations WHERE slug IN ('${T.a}','${T.b}');`);
}

function seed() {
  const hash = bcrypt.hashSync(PASSWORD, 10);
  const role = (
    id,
    tenant,
    name,
  ) => `INSERT INTO roles(id,tenant_id,name,"displayName",description,permissions,is_active,is_custom)
    VALUES('${id}','${tenant}','${name}','${name}','Login acceptance','["*"]'::jsonb,true,false);`;
  // Sessions require membership of the active organisation that owns the tenant (JwtAuthGuard).
  const user = (
    id,
    tenant,
    email,
    roleId,
  ) => `INSERT INTO users(id,tenant_id,email,password,"firstName","lastName","isActive","emailVerified","tokenVersion","isSubscribedToNewsletter","organizationId")
    VALUES('${id}','${tenant}','${email}','${hash}','Kabul','Kullanıcı',true,true,1,false,(SELECT id FROM organizations WHERE slug='${tenant}'));
    INSERT INTO user_roles(tenant_id,"userId","roleId","isPrimary") VALUES('${tenant}','${id}','${roleId}',true);`;
  sql(`INSERT INTO organizations(name,slug) VALUES('Alfa Kuruluş','${T.a}'),('Beta Kuruluş','${T.b}');
    ${role(ids.roleAdminA, T.a, "organization_admin")}
    ${role(ids.roleCustomerA, T.a, "customer")}
    ${role(ids.roleCustomerB, T.b, "customer")}
    ${user(ids.sharedA, T.a, "shared@login.test", ids.roleAdminA)}
    ${user(ids.sharedB, T.b, "shared@login.test", ids.roleCustomerB)}
    ${user(ids.soloA, T.a, "solo@login.test", ids.roleCustomerA)}`);
}

async function fillByKeyboard(page, email, password) {
  await page.focus("#login-email");
  await page.keyboard.type(email);
  await page.keyboard.press("Tab");
  await page.keyboard.type(password);
  await page.keyboard.press("Enter");
}

async function freshPage(browser) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
  });
  return { context, page: await context.newPage() };
}

const scenarios = {
  async "single workspace signs in without a code and lands in the portal"(
    browser,
  ) {
    const { context, page } = await freshPage(browser);
    await page.goto(`${BASE_URL}/login`);
    await fillByKeyboard(page, "solo@login.test", PASSWORD);
    await page.waitForURL("**/portal/dashboard", { timeout: 15_000 });
    await context.close();
  },

  async "a shared email asks for the workspace, then opens the chosen tenant shell"(
    browser,
  ) {
    const { context, page } = await freshPage(browser);
    await page.goto(`${BASE_URL}/login`);
    await fillByKeyboard(page, "shared@login.test", PASSWORD);
    const heading = page.getByRole("heading", {
      name: "Çalışma alanını seçin",
    });
    await heading.waitFor();
    assert.equal(
      await page.evaluate(() => document.activeElement?.id),
      "workspace-choice-title",
    );
    const choices = await page
      .getByRole("button")
      .filter({ hasText: "login-accept-" })
      .allTextContents();
    assert.equal(choices.length, 2);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await page.waitForURL(`**/${T.a}/admin**`, { timeout: 15_000 });
    await context.close();
  },

  async "wrong password and unknown email get the same message"(browser) {
    const { context, page } = await freshPage(browser);
    const messages = [];
    for (const [email, password] of [
      ["solo@login.test", "Wrong-Password-1"],
      ["nobody@login.test", PASSWORD],
    ]) {
      await page.goto(`${BASE_URL}/login`);
      await fillByKeyboard(page, email, password);
      messages.push(await failureText(page));
    }
    assert.ok(messages[0].includes(FAILURE), messages[0]);
    assert.equal(messages[0], messages[1]);
    await context.close();
  },

  async "a tenant login URL never signs in another tenant's account"(browser) {
    const { context, page } = await freshPage(browser);
    await page.goto(`${BASE_URL}/${T.b}/admin/login`);
    await page.getByText(T.b, { exact: true }).waitFor();
    await fillByKeyboard(page, "solo@login.test", PASSWORD);
    assert.ok((await failureText(page)).includes(FAILURE));
    assert.ok(page.url().includes(`/${T.b}/admin/login`));
    await context.close();
  },

  async "an expired session returns to the requested page after sign-in"(
    browser,
  ) {
    const { context, page } = await freshPage(browser);
    await context.addCookies([
      { name: "auth_token", value: "expired.token.value", url: BASE_URL },
    ]);
    await page.goto(`${BASE_URL}/${T.a}/admin/crm`);
    await page.waitForURL(`**/${T.a}/admin/login?redirect=*`);
    await fillByKeyboard(page, "shared@login.test", PASSWORD);
    await page.waitForURL(`**/${T.a}/admin/crm`, { timeout: 15_000 });
    await context.close();
  },

  async "throttled attempts get a plain rate-limit message (runs last: spends the quota)"(
    browser,
  ) {
    let status = 0;
    for (let attempt = 0; attempt < 15 && status !== 429; attempt += 1) {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "nobody@login.test",
          password: "Wrong-Password-1",
        }),
      });
      status = response.status;
    }
    assert.equal(status, 429, "discovery should be throttled");
    const { context, page } = await freshPage(browser);
    await page.goto(`${BASE_URL}/login`);
    await fillByKeyboard(page, "solo@login.test", PASSWORD);
    const text = await failureText(page);
    assert.ok(text.toLowerCase().includes(RATE_LIMITED), text);
    await context.close();
  },
};

(async () => {
  cleanup();
  seed();
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
  });
  let failed = 0;
  try {
    for (const [name, run] of Object.entries(scenarios)) {
      try {
        await run(browser);
        console.log(`PASS ${name}`);
      } catch (error) {
        failed += 1;
        console.log(`FAIL ${name}\n     ${error.message.split("\n")[0]}`);
      }
    }
  } finally {
    await browser.close();
    if (process.env.KEEP_FIXTURES !== "1") cleanup();
  }
  console.log(
    `${Object.keys(scenarios).length - failed}/${Object.keys(scenarios).length} scenarios passed`,
  );
  process.exitCode = failed ? 1 : 0;
})();
