import { DataSource, QueryRunner } from "typeorm";
import { TenantAdminPermissions1791417600000 } from "./1791417600000-TenantAdminPermissions";

const databaseUrl = process.env.ROLE_MIGRATION_TEST_DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;

describePostgres("TenantAdminPermissions PostgreSQL integration", () => {
  let dataSource: DataSource;
  let runner: QueryRunner;

  beforeAll(async () => {
    dataSource = new DataSource({ type: "postgres", url: databaseUrl });
    await dataSource.initialize();
    runner = dataSource.createQueryRunner();
    await runner.connect();
    await runner.query(`
      CREATE TEMP TABLE roles (
        id text PRIMARY KEY,
        tenant_id text,
        name text,
        permissions jsonb,
        deleted_at timestamptz,
        updated_at timestamptz DEFAULT now()
      )
    `);
  });

  afterAll(async () => {
    await runner?.release();
    await dataSource?.destroy();
  });

  beforeEach(async () => {
    await runner.query("TRUNCATE roles");
    await runner.startTransaction();
  });

  afterEach(async () => {
    if (runner.isTransactionActive) {
      await runner.rollbackTransaction();
    }
  });

  it("normalizes exact and whitespace wildcards and remains idempotent", async () => {
    await runner.query(`
      INSERT INTO roles (id, tenant_id, name, permissions) VALUES
        ('owner-exact', 'a', 'organization_owner', '["*", "cms.read"]'),
        ('owner-spaced', 'b', ' Organization_Owner ', '[" * ", "users.view"]')
    `);

    const migration = new TenantAdminPermissions1791417600000();
    await migration.up(runner);
    await migration.up(runner);

    const rows = await runner.query(
      "SELECT permissions FROM roles ORDER BY id",
    );
    for (const row of rows) {
      expect(row.permissions).toContain("users.view");
      expect(row.permissions).not.toContain("*");
      expect(row.permissions).not.toContain(" * ");
      expect(row.permissions).not.toContain("system.admin");
      expect(new Set(row.permissions).size).toBe(row.permissions.length);
    }
  });

  it.each([
    ["null role name", "NULL", `'["*"]'::jsonb`, "unknown privileged tenant roles"],
    ["unknown role", "'custom_root'", `'[" * "]'::jsonb`, "unknown privileged tenant roles"],
    ["malformed permissions", "'organization_owner'", `'{}'::jsonb`, "malformed permission documents"],
  ])("rejects %s", async (_label, nameSql, permissionsSql, message) => {
    await runner.query(
      `INSERT INTO roles (id, tenant_id, name, permissions) VALUES ('unsafe', 'a', ${nameSql}, ${permissionsSql})`,
    );
    await expect(
      new TenantAdminPermissions1791417600000().up(runner),
    ).rejects.toThrow(message);
  });
});
