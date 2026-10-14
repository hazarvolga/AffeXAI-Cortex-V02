/**
 * F3.1 acceptance: the app-owned confirm dialog replaces window.confirm in a
 * real CRM flow. Cancel must change nothing; confirm must persist.
 *
 *   DIALOG_ACCEPTANCE_ISOLATED=1 BASE_URL=http://localhost:19003 \
 *   [CHROME_PATH=/path/to/chrome] node apps/frontend/scripts/acceptance/crm-confirm-dialog.cjs
 *
 * Same harness as login-two-tenants.cjs (isolated G0 stack, frontend on :19003).
 */
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { createRequire } = require("node:module");
const path = require("node:path");

if (process.env.DIALOG_ACCEPTANCE_ISOLATED !== "1") {
  throw new Error(
    "Isolated acceptance marker required (DIALOG_ACCEPTANCE_ISOLATED=1)",
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
const PASSWORD = "Fixture-Dialog-2026!";
const TENANT = "dialog-accept-a";
const ROLE_ID = "d1000000-0000-4000-8000-000000000001";
const USER_ID = "d2000000-0000-4000-8000-000000000001";
const CUSTOMER_ID = "d3000000-0000-4000-8000-000000000001";

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
  sql(`DELETE FROM crm_customers WHERE id='${CUSTOMER_ID}';
       DELETE FROM user_roles WHERE "userId"='${USER_ID}';
       DELETE FROM users WHERE id='${USER_ID}';
       DELETE FROM roles WHERE id='${ROLE_ID}';
       DELETE FROM organizations WHERE slug='${TENANT}';`);
}

function seed() {
  const hash = bcrypt.hashSync(PASSWORD, 10);
  sql(`INSERT INTO organizations(name,slug) VALUES('Dialog Kuruluş','${TENANT}');
    INSERT INTO roles(id,tenant_id,name,"displayName",description,permissions,is_active,is_custom)
      VALUES('${ROLE_ID}','${TENANT}','organization_admin','Org Admin','Dialog acceptance','["*","crm.view","crm.manage","crm.delete"]'::jsonb,true,false);
    INSERT INTO users(id,tenant_id,email,password,"firstName","lastName","isActive","emailVerified","tokenVersion","isSubscribedToNewsletter","organizationId")
      VALUES('${USER_ID}','${TENANT}','admin@dialog.test','${hash}','Kabul','Yönetici',true,true,1,false,(SELECT id FROM organizations WHERE slug='${TENANT}'));
    INSERT INTO user_roles(tenant_id,"userId","roleId","isPrimary") VALUES('${TENANT}','${USER_ID}','${ROLE_ID}',true);
    INSERT INTO crm_customers(id,tenant_id,"companyName",email) VALUES('${CUSTOMER_ID}','${TENANT}','Onay Test A.Ş.','musteri@dialog.test');`);
}

const isActive = () =>
  sql(`SELECT "isActive" FROM crm_customers WHERE id='${CUSTOMER_ID}'`) === "t";

async function openDialog(page) {
  // The registry renders a desktop table and a hidden mobile card list.
  await page
    .getByRole("button", { name: "Müşteriyi pasifleştir" })
    .filter({ visible: true })
    .first()
    .focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("alertdialog");
  await dialog.waitFor();
  assert.ok((await dialog.textContent()).includes("pasifleştirilsin mi"));
  // Destructive confirmations start on the safe choice.
  const focused = await page.evaluate(() =>
    document.activeElement?.textContent?.trim(),
  );
  assert.equal(focused, "Vazgeç");
  return dialog;
}

(async () => {
  cleanup();
  seed();
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
  });
  let failed = 0;
  const step = async (name, run) => {
    try {
      await run();
      console.log(`PASS ${name}`);
    } catch (error) {
      failed += 1;
      console.log(`FAIL ${name}\n     ${error.message.split("\n")[0]}`);
    }
  };
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();
    page.on("dialog", () => {
      throw new Error("A native browser dialog was opened");
    });
    await page.goto(`${BASE_URL}/${TENANT}/admin/login`);
    await page.focus("#login-email");
    await page.keyboard.type("admin@dialog.test");
    await page.keyboard.press("Tab");
    await page.keyboard.type(PASSWORD);
    await page.keyboard.press("Enter");
    // The login page itself lives under /<tenant>/admin, so wait until we leave it.
    await page.waitForURL((url) => !url.pathname.endsWith("/login"), {
      timeout: 15_000,
    });
    await page.goto(`${BASE_URL}/${TENANT}/admin/crm`);
    await page
      .getByText("Onay Test A.Ş.")
      .filter({ visible: true })
      .first()
      .waitFor({ timeout: 15_000 });

    await step(
      "cancel keeps the customer active and returns focus",
      async () => {
        await openDialog(page);
        await page.keyboard.press("Escape");
        await page.getByRole("alertdialog").waitFor({ state: "detached" });
        assert.equal(isActive(), true);
      },
    );

    await step(
      "confirm deactivates the customer through the real API",
      async () => {
        const dialog = await openDialog(page);
        await dialog.getByRole("button", { name: "Pasifleştir" }).click();
        await page.getByRole("alertdialog").waitFor({ state: "detached" });
        for (let i = 0; i < 20 && isActive(); i += 1)
          await page.waitForTimeout(250);
        assert.equal(isActive(), false);
      },
    );
    await context.close();
  } finally {
    await browser.close();
    if (process.env.KEEP_FIXTURES !== "1") cleanup();
  }
  console.log(`${2 - failed}/2 steps passed`);
  process.exitCode = failed ? 1 : 0;
})();
