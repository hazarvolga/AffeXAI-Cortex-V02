/**
 * F3.4 acceptance: tenant CRUD screens follow the UX-CONTRACT flow ledger
 * (create, edit, delete, search with URL state, states, keyboard, axe).
 *
 *   TENANT_CRUD_ACCEPTANCE_ISOLATED=1 BASE_URL=http://localhost:19003 \
 *   [CHROME_PATH=/path/to/chrome] node apps/frontend/scripts/acceptance/tenant-crud.cjs
 *
 * Same harness as crm-confirm-dialog.cjs (isolated G0 stack, frontend on :19003).
 * The harness backend counts every API call against one IP (60/min), so steps pace themselves.
 */
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");

if (process.env.TENANT_CRUD_ACCEPTANCE_ISOLATED !== "1") {
  throw new Error(
    "Isolated acceptance marker required (TENANT_CRUD_ACCEPTANCE_ISOLATED=1)",
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
const PASSWORD = "Fixture-Crud-2026!";
const TENANT = "crud-accept-a";
const ADMIN_ROLE = "d8000000-0000-4000-8000-000000000001";
const MEMBER_ROLE = "d8000000-0000-4000-8000-000000000002";
const ADMIN_ID = "d9000000-0000-4000-8000-000000000001";
const MEMBER_ID = "d9000000-0000-4000-8000-000000000002";
const PACE_MS = Number(process.env.PACE_MS || 2_500);
const NEW_ROLE = "kabul_rolu";

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
  sql(`DELETE FROM crm_customers WHERE tenant_id='${TENANT}';
       DELETE FROM user_roles WHERE tenant_id='${TENANT}';
       DELETE FROM users WHERE tenant_id='${TENANT}';
       DELETE FROM roles WHERE tenant_id='${TENANT}';
       DELETE FROM organizations WHERE slug='${TENANT}';`);
}

function seed() {
  const hash = bcrypt.hashSync(PASSWORD, 10);
  const org = `(SELECT id FROM organizations WHERE slug='${TENANT}')`;
  sql(`INSERT INTO organizations(name,slug) VALUES('CRUD Kabul','${TENANT}');
    INSERT INTO roles(id,tenant_id,name,"displayName",description,permissions,is_active,is_custom) VALUES
      ('${ADMIN_ROLE}','${TENANT}','admin','Yönetici','CRUD acceptance','["*","users.view","users.manage","roles.manage","crm.view","crm.manage","forms.view","forms.manage"]'::jsonb,true,false),
      ('${MEMBER_ROLE}','${TENANT}','viewer','İzleyici','CRUD acceptance','["events.view"]'::jsonb,true,true);
    INSERT INTO users(id,tenant_id,email,password,"firstName","lastName","isActive","emailVerified","tokenVersion","isSubscribedToNewsletter","organizationId","roleId") VALUES
      ('${ADMIN_ID}','${TENANT}','admin@crud.test','${hash}','Kabul','Yönetici',true,true,1,false,${org},'${ADMIN_ROLE}'),
      ('${MEMBER_ID}','${TENANT}','uye@crud.test','${hash}','Deniz','Üye',true,true,1,false,${org},'${ADMIN_ROLE}');
    INSERT INTO user_roles(tenant_id,"userId","roleId","isPrimary") VALUES
      ('${TENANT}','${ADMIN_ID}','${ADMIN_ROLE}',true),('${TENANT}','${MEMBER_ID}','${ADMIN_ROLE}',true);
    INSERT INTO crm_customers(tenant_id,"companyName",email) VALUES
      ('${TENANT}','Onay Lojistik','onay@crud.test'),('${TENANT}','Deniz Yapı','deniz@crud.test');`);
}

const wait = (page, ms = PACE_MS) => page.waitForTimeout(ms);
const memberActive = () =>
  sql(`SELECT "isActive" FROM users WHERE id='${MEMBER_ID}'`) === "t";

async function axeCheck(page, route) {
  const problems = [];
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(400);
    await page.addScriptTag({ path: AXE_PATH });
    const result = await page.evaluate(async () => {
      const run = await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      });
      return {
        overflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
        serious: run.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.id}@${v.nodes[0].target}`),
      };
    });
    if (result.overflow > 0)
      problems.push(`${width}px overflow=${result.overflow}`);
    if (result.serious.length)
      problems.push(`${width}px axe=${result.serious.join(",")}`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  assert.deepEqual(problems, [], `${route}: ${problems.join(" | ")}`);
}

(async () => {
  cleanup();
  seed();
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
  });
  let passed = 0;
  let failed = 0;
  const step = async (name, run) => {
    try {
      await run();
      passed += 1;
      console.log(`PASS ${name}`);
    } catch (error) {
      failed += 1;
      console.log(`FAIL ${name}\n     ${error.message.split("\n")[0]}`);
    }
  };
  try {
    const page = await (
      await browser.newContext({ viewport: { width: 1280, height: 900 } })
    ).newPage();
    page.on("dialog", () => {
      throw new Error("A native browser dialog was opened");
    });
    await page.goto(`${BASE_URL}/${TENANT}/admin/login`);
    await page.fill("#login-email", "admin@crud.test");
    await page.fill("input[type=password]", PASSWORD);
    await page.keyboard.press("Enter");
    await page.waitForURL((url) => !url.pathname.endsWith("/login"), {
      timeout: 20_000,
    });
    const users = `${BASE_URL}/${TENANT}/admin/users`;

    await step("users: title, skip link and URL-backed search", async () => {
      await page.goto(users);
      await page
        .getByRole("heading", { level: 1, name: "Kullanıcılar" })
        .waitFor({ timeout: 15_000 });
      assert.equal(await page.title(), "Kullanıcılar · AffeXAI Cortex");
      await page.evaluate(() => {
        document.body.tabIndex = -1;
        document.body.focus();
      });
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() => document.activeElement?.textContent?.trim()),
        "Ana içeriğe geç",
      );
      await page.keyboard.press("Enter");
      assert.ok(
        await page.evaluate(() =>
          Boolean(document.activeElement?.closest("main")),
        ),
      );
      await page.getByLabel("Kullanıcı ara").fill("uye@");
      await page.waitForURL((url) => url.searchParams.get("q") === "uye@", {
        timeout: 5_000,
      });
      await page.getByText("1 kullanıcı").waitFor({ timeout: 10_000 });
      await page.getByText("uye@crud.test").waitFor();
    });
    await wait(page);

    await step(
      "users: deactivation is confirmed by name, Escape keeps the user",
      async () => {
        await page
          .getByRole("button", { name: "Deniz Üye için işlemler" })
          .click();
        await page.getByRole("menuitem", { name: "Pasifleştir" }).click();
        const dialog = page.getByRole("alertdialog");
        await dialog.getByText("Deniz Üye pasifleştirilsin mi?").waitFor();
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "detached" });
        assert.equal(memberActive(), true);
        await page
          .getByRole("button", { name: "Deniz Üye için işlemler" })
          .click();
        await page.getByRole("menuitem", { name: "Pasifleştir" }).click();
        await page
          .getByRole("alertdialog")
          .getByRole("button", { name: "Pasifleştir" })
          .click();
        for (let i = 0; i < 20 && memberActive(); i += 1)
          await page.waitForTimeout(250);
        assert.equal(memberActive(), false);
        await page
          .getByText("Deniz Üye pasifleştirildi")
          .first()
          .waitFor({ timeout: 5_000 });
      },
    );
    await wait(page);

    await step("users: role change saves through the edit dialog", async () => {
      await page
        .getByRole("button", { name: "Deniz Üye için işlemler" })
        .click();
      await page.getByRole("menuitem", { name: "Rolü değiştir" }).click();
      const dialog = page.getByRole("dialog", { name: "Rolü değiştir" });
      await dialog.getByRole("combobox", { name: "Rol" }).click();
      await page.getByRole("option", { name: "İzleyici" }).click();
      await dialog
        .getByRole("button", { name: "Değişiklikleri kaydet" })
        .click();
      await dialog.waitFor({ state: "detached", timeout: 10_000 });
      const primary = sql(
        `SELECT "roleId" FROM user_roles WHERE "userId"='${MEMBER_ID}' AND "isPrimary" AND deleted_at IS NULL`,
      );
      assert.equal(primary, MEMBER_ROLE);
    });
    await wait(page);

    await step(
      "users: invite validation focuses the first invalid field",
      async () => {
        await page.goto(`${users}/new`);
        await page.getByRole("button", { name: "Davet gönder" }).click();
        await page
          .getByRole("alert")
          .getByText("Formda düzeltilmesi gereken alanlar var:")
          .waitFor();
        assert.equal(
          await page.evaluate(() => document.activeElement?.id),
          "invite-firstName",
        );
        assert.equal(
          await page
            .getByLabel("Ad", { exact: false })
            .first()
            .getAttribute("aria-invalid"),
          "true",
        );
      },
    );
    await wait(page);

    await step(
      "roles: create, grant a permission after confirmation, delete",
      async () => {
        await page.goto(`${BASE_URL}/${TENANT}/admin/roles`);
        await page.getByRole("button", { name: "Yeni rol" }).click();
        const editor = page.getByRole("dialog", { name: "Yeni rol" });
        await editor.getByLabel("Sistem adı").fill(NEW_ROLE);
        await editor.getByLabel("Görünen ad").fill("Kabul Rolü");
        await editor.getByRole("button", { name: "Rolü oluştur" }).click();
        await editor.waitFor({ state: "detached", timeout: 10_000 });
        assert.equal(
          sql(
            `SELECT count(*) FROM roles WHERE tenant_id='${TENANT}' AND name='${NEW_ROLE}' AND deleted_at IS NULL`,
          ),
          "1",
        );
        await wait(page);

        const toggle = page
          .getByRole("switch", { name: /^Kabul Rolü: / })
          .first();
        await toggle.waitFor({ timeout: 10_000 });
        const label = await toggle.getAttribute("aria-label");
        await toggle.click();
        await page
          .getByRole("alertdialog")
          .getByRole("button", { name: "Yetkiyi ver" })
          .click();
        await page.getByRole("alertdialog").waitFor({ state: "detached" });
        for (
          let i = 0;
          i < 20 &&
          sql(
            `SELECT jsonb_array_length(permissions) FROM roles WHERE name='${NEW_ROLE}' AND tenant_id='${TENANT}'`,
          ) === "0";
          i += 1
        ) {
          await page.waitForTimeout(250);
        }
        assert.equal(
          sql(
            `SELECT jsonb_array_length(permissions) FROM roles WHERE name='${NEW_ROLE}' AND tenant_id='${TENANT}'`,
          ),
          "1",
          label,
        );
        await wait(page);

        await page
          .getByRole("button", { name: "Kabul Rolü rolünü düzenle" })
          .click();
        await page
          .getByRole("dialog", { name: "Rolü düzenle" })
          .getByRole("button", { name: "Rolü sil" })
          .click();
        await page
          .getByRole("alertdialog")
          .getByText("Kabul Rolü rolü silinsin mi?")
          .waitFor();
        await page
          .getByRole("alertdialog")
          .getByRole("button", { name: "Rolü sil" })
          .click();
        await page
          .getByRole("dialog", { name: "Rolü düzenle" })
          .waitFor({ state: "detached", timeout: 10_000 });
        assert.equal(
          sql(
            `SELECT count(*) FROM roles WHERE tenant_id='${TENANT}' AND name='${NEW_ROLE}' AND deleted_at IS NULL`,
          ),
          "0",
        );
      },
    );
    await wait(page);

    await step(
      "crm: search narrows the registry and lives in the URL",
      async () => {
        await page.goto(`${BASE_URL}/${TENANT}/admin/crm`);
        await page.getByLabel("Müşteri ara").fill("Onay");
        await page.waitForURL((url) => url.searchParams.get("q") === "Onay", {
          timeout: 5_000,
        });
        // The search field's live status reports the filtered total.
        await page
          .getByRole("status")
          .filter({ hasText: /^1 kayıt$/ })
          .waitFor({ timeout: 10_000 });
        await page
          .getByText("Onay Lojistik")
          .filter({ visible: true })
          .first()
          .waitFor();
        assert.equal(
          await page.getByText("Deniz Yapı").filter({ visible: true }).count(),
          0,
        );
      },
    );
    await wait(page);

    await step(
      "forms: an unmatched search offers to clear the filters",
      async () => {
        await page.goto(`${BASE_URL}/${TENANT}/admin/forms?q=olmayan`);
        const clear = page.getByRole("button", { name: "Filtreleri temizle" });
        const empty = page.getByText("Henüz form yok");
        await Promise.race([
          clear.waitFor({ timeout: 15_000 }),
          empty.waitFor({ timeout: 15_000 }),
        ]);
        if (await clear.count()) {
          await clear.click();
          await page.waitForURL((url) => !url.searchParams.has("q"), {
            timeout: 5_000,
          });
        }
      },
    );
    await wait(page);

    for (const route of ["users", "roles", "crm", "forms", "settings"]) {
      await step(`axe and overflow: ${route}`, async () => {
        await page.goto(`${BASE_URL}/${TENANT}/admin/${route}`, {
          waitUntil: "load",
        });
        await page
          .waitForLoadState("networkidle", { timeout: 5_000 })
          .catch(() => {});
        await axeCheck(page, route);
      });
      await wait(page);
    }
  } finally {
    await browser.close();
    if (process.env.KEEP_FIXTURES !== "1") cleanup();
  }
  console.log(`${passed}/${passed + failed} steps passed`);
  process.exitCode = failed ? 1 : 0;
})();
