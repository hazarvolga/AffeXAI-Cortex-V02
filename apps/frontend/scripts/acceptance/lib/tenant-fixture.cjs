/**
 * Shared fixture for the isolated acceptance stack: one tenant with a tenant
 * administrator whose role carries the real tenant permission set.
 */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");

const repo = path.resolve(__dirname, "../../../../..");
const bcrypt = createRequire(path.join(repo, "apps/backend/package.json"))(
  "bcryptjs",
);
const pnpmStore = path.join(repo, "node_modules/.pnpm");

const DB_CONTAINER = "affexai-g0-isolated-postgres-test-1";
const AXE_PATH = path.join(
  pnpmStore,
  fs.readdirSync(pnpmStore).find((name) => name.startsWith("axe-core@")),
  "node_modules/axe-core/axe.min.js",
);

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

/** @param {{ tenant: string, email: string, password: string, roleId: string, userId: string, extraCleanup?: string }} f */
function tenantFixture(f) {
  const cleanup = () =>
    sql(`${f.extraCleanup ?? ""}
       DELETE FROM user_roles WHERE tenant_id='${f.tenant}';
       DELETE FROM users WHERE tenant_id='${f.tenant}';
       DELETE FROM roles WHERE tenant_id='${f.tenant}';
       DELETE FROM organizations WHERE slug='${f.tenant}';`);
  const seed = () => {
    const hash = bcrypt.hashSync(f.password, 10);
    sql(`INSERT INTO organizations(name,slug) VALUES('Kabul ${f.tenant}','${f.tenant}');
      INSERT INTO roles(id,tenant_id,name,"displayName",description,permissions,is_active,is_custom)
        VALUES('${f.roleId}','${f.tenant}','admin','Yönetici','Acceptance','${JSON.stringify(TENANT_ADMIN_PERMISSIONS)}'::jsonb,true,false);
      INSERT INTO users(id,tenant_id,email,password,"firstName","lastName","isActive","emailVerified","tokenVersion","isSubscribedToNewsletter","organizationId","roleId")
        VALUES('${f.userId}','${f.tenant}','${f.email}','${hash}','Kabul','Yönetici',true,true,1,false,(SELECT id FROM organizations WHERE slug='${f.tenant}'),'${f.roleId}');
      INSERT INTO user_roles(tenant_id,"userId","roleId","isPrimary") VALUES('${f.tenant}','${f.userId}','${f.roleId}',true);`);
  };
  const login = async (page, baseUrl) => {
    await page.goto(`${baseUrl}/${f.tenant}/admin/login`);
    await page.fill("#login-email", f.email);
    await page.fill("input[type=password]", f.password);
    await page.keyboard.press("Enter");
    await page.waitForURL((url) => !url.pathname.endsWith("/login"), {
      timeout: 20_000,
    });
  };
  return { cleanup, seed, login };
}

module.exports = { AXE_PATH, repo, sql, tenantFixture };
