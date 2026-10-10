import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserTenantEmailIntegrity1791414000000 implements MigrationInterface {
  name = 'UserTenantEmailIntegrity1791414000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('LOCK TABLE "users" IN ACCESS EXCLUSIVE MODE');
    const unscoped = await queryRunner.query(`SELECT id FROM users WHERE deleted_at IS NULL AND tenant_id IS NULL LIMIT 10`);
    if (unscoped.length > 0) {
      throw new Error('Cannot enforce tenant email uniqueness: live users without tenant scope require resolution');
    }
    const duplicates = await queryRunner.query(`
      SELECT tenant_id, lower(btrim(email)) AS normalized_email, count(*)::int AS count
      FROM users
      WHERE deleted_at IS NULL AND email IS NOT NULL
      GROUP BY tenant_id, lower(btrim(email))
      HAVING count(*) > 1
      LIMIT 10
    `);
    if (duplicates.length > 0) {
      throw new Error('Cannot enforce tenant email uniqueness: duplicate live users require resolution');
    }
    await queryRunner.query(`UPDATE users SET email = lower(btrim(email)) WHERE email IS NOT NULL AND email <> lower(btrim(email))`);
    await queryRunner.query(`
      UPDATE users
      SET "refreshToken" = NULL,
          "refreshTokenExpires" = NULL,
          "tokenVersion" = "tokenVersion" + 1
      WHERE "refreshToken" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_tenant_normalized_email_live"
      ON "users" ("tenant_id", lower(btrim("email")))
      WHERE "deleted_at" IS NULL AND "email" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_tenant_normalized_email_live"');
  }
}
