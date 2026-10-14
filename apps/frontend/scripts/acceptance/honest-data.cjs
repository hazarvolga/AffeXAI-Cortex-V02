/**
 * F3.2 acceptance: no invented values on surfaces that claim to be real.
 *
 *   HONEST_ACCEPTANCE_ISOLATED=1 BASE_URL=http://localhost:19003 \
 *   [CHROME_PATH=/path/to/chrome] node apps/frontend/scripts/acceptance/honest-data.cjs
 *
 * Same harness as crm-confirm-dialog.cjs (isolated G0 stack, frontend on :19003).
 */
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { createRequire } = require("node:module");
const path = require("node:path");

if (process.env.HONEST_ACCEPTANCE_ISOLATED !== "1") {
  throw new Error(
    "Isolated acceptance marker required (HONEST_ACCEPTANCE_ISOLATED=1)",
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
const PASSWORD = "Fixture-Honest-2026!";
const TENANT = "honest-accept-a";
const ROLE_ID = "d4000000-0000-4000-8000-000000000001";
const USER_ID = "d5000000-0000-4000-8000-000000000001";
const MEMBER_ID = "d5000000-0000-4000-8000-000000000002";

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
  sql(`DELETE FROM user_roles WHERE "userId" IN ('${USER_ID}','${MEMBER_ID}');
       DELETE FROM users WHERE id IN ('${USER_ID}','${MEMBER_ID}');
       DELETE FROM roles WHERE id='${ROLE_ID}';
       DELETE FROM organizations WHERE slug='${TENANT}';`);
}

function seed() {
  const hash = bcrypt.hashSync(PASSWORD, 10);
  const org = `(SELECT id FROM organizations WHERE slug='${TENANT}')`;
  sql(`INSERT INTO organizations(name,slug) VALUES('Dürüst Veri Kuruluşu','${TENANT}');
    INSERT INTO roles(id,tenant_id,name,"displayName",description,permissions,is_active,is_custom)
      VALUES('${ROLE_ID}','${TENANT}','admin','Yönetici','Honest-data acceptance','["*","users.view"]'::jsonb,true,false);
    INSERT INTO users(id,tenant_id,email,password,"firstName","lastName","isActive","emailVerified","tokenVersion","isSubscribedToNewsletter","organizationId","roleId")
      VALUES('${USER_ID}','${TENANT}','admin@honest.test','${hash}','Kabul','Yönetici',true,true,1,false,${org},'${ROLE_ID}'),
            ('${MEMBER_ID}','${TENANT}','uye@honest.test','${hash}','Pasif','Üye',false,false,1,false,${org},'${ROLE_ID}');
    INSERT INTO user_roles(tenant_id,"userId","roleId","isPrimary") VALUES('${TENANT}','${USER_ID}','${ROLE_ID}',true);`);
}

/** The value rendered next to a <dt> label in the user stats card. */
async function statValue(page, label) {
  const dd = page
    .locator("dl div", { has: page.locator(`dt:text-is("${label}")`) })
    .locator("dd");
  return (await dd.first().textContent()).trim();
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

    await step(
      "the CMS page API reaches the backend, not a frontend fixture",
      async () => {
        const response = await page.request.get(`${BASE_URL}/api/cms/pages`);
        const body = await response.text();
        assert.ok(
          !body.includes("AEC profesyonelleri"),
          "fixture page content was served",
        );
      },
    );

    await page.goto(`${BASE_URL}/${TENANT}/admin/login`);
    await page.fill("#login-email", "admin@honest.test");
    await page.fill("input[type=password]", PASSWORD);
    await page.keyboard.press("Enter");
    await page.waitForURL((url) => !url.pathname.endsWith("/login"), {
      timeout: 15_000,
    });
    await page.goto(`${BASE_URL}/${TENANT}/admin`);

    await step("user counts on the dashboard match the database", async () => {
      await page
        .locator("dt", { hasText: "Toplam kullanıcı" })
        .waitFor({ timeout: 15_000 });
      const total = sql(
        `SELECT count(*) FROM users WHERE tenant_id='${TENANT}'`,
      );
      const active = sql(
        `SELECT count(*) FROM users WHERE tenant_id='${TENANT}' AND "isActive"`,
      );
      assert.equal(await statValue(page, "Toplam kullanıcı"), total);
      assert.equal(await statValue(page, "Aktif"), active);
    });

    await step(
      "AI credit usage comes from the usage API and does not drift",
      async () => {
        // Innermost element that holds both the title and the figures: the card itself.
        const card = page
          .locator("div", { hasText: "AI kredi kullanımı" })
          .filter({ hasText: "Bu dönem" })
          .last();
        await card.waitFor({ timeout: 15_000 });
        const first = await card.textContent();
        await page.waitForTimeout(6_000); // the old card changed every 5 s
        assert.equal(await card.textContent(), first);
        assert.match(first, /0 \/ 50\.000/);
      },
    );

    await step("invented widgets are gone from the dashboard", async () => {
      const text = await page.locator("main").textContent();
      for (const fake of [
        "Reserve Module",
        "Unified Performance Timeline",
        "Pro Plan Active",
      ]) {
        assert.ok(!text.includes(fake), `${fake} is still rendered`);
      }
    });
    await context.close();
  } finally {
    await browser.close();
    if (process.env.KEEP_FIXTURES !== "1") cleanup();
  }
  console.log(`${4 - failed}/4 steps passed`);
  process.exitCode = failed ? 1 : 0;
})();
