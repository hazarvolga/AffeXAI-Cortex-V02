import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserPrimaryRoleIntegrity1791421200000 implements MigrationInterface {
  name = 'UserPrimaryRoleIntegrity1791421200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('LOCK TABLE roles, user_roles IN ACCESS EXCLUSIVE MODE');

    const ambiguousRoles = await queryRunner.query(`
      SELECT tenant_id, lower(btrim(name)) AS normalized_name, count(*)::int AS count
      FROM roles
      WHERE deleted_at IS NULL
      GROUP BY tenant_id, lower(btrim(name))
      HAVING lower(btrim(name)) IS NULL
         OR lower(btrim(name)) = ''
         OR count(*) > 1
      LIMIT 10
    `);
    if (ambiguousRoles.length > 0) {
      throw new Error('Cannot canonicalize tenant role names: blank or duplicate live roles require resolution');
    }

    const duplicatePrimaryRoles = await queryRunner.query(`
      SELECT tenant_id, "userId" AS user_id, count(*)::int AS count
      FROM user_roles
      WHERE deleted_at IS NULL AND "isPrimary" = true
      GROUP BY tenant_id, "userId"
      HAVING count(*) > 1
      LIMIT 10
    `);
    if (duplicatePrimaryRoles.length > 0) {
      throw new Error('Cannot enforce role assignment integrity: multiple live primary roles require resolution');
    }

    await queryRunner.query(`
      UPDATE roles
      SET name = lower(btrim(name))
      WHERE deleted_at IS NULL AND name IS DISTINCT FROM lower(btrim(name))
    `);
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_c555146b304b5f51a7de6e18de"');
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_roles_tenant_normalized_name_live"
      ON roles (tenant_id, lower(btrim(name)))
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE roles
      ADD CONSTRAINT "CHK_roles_live_name_canonical"
      CHECK (deleted_at IS NOT NULL OR (name IS NOT NULL AND name <> '' AND name = lower(btrim(name))))
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_user_roles_one_live_primary_per_tenant_user"
      ON user_roles (tenant_id, "userId")
      WHERE deleted_at IS NULL AND "isPrimary" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('LOCK TABLE roles IN ACCESS EXCLUSIVE MODE');
    const rollbackConflicts = await queryRunner.query(`
      SELECT tenant_id, name, count(*)::int AS count
      FROM roles
      WHERE name IS NOT NULL
      GROUP BY tenant_id, name
      HAVING count(*) > 1
      LIMIT 10
    `);
    if (rollbackConflicts.length > 0) {
      throw new Error('Cannot rollback role integrity: deleted and live role names now conflict');
    }
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_user_roles_one_live_primary_per_tenant_user"');
    await queryRunner.query('ALTER TABLE roles DROP CONSTRAINT IF EXISTS "CHK_roles_live_name_canonical"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_roles_tenant_normalized_name_live"');
    await queryRunner.query('CREATE UNIQUE INDEX "IDX_c555146b304b5f51a7de6e18de" ON roles (tenant_id, name)');
  }
}
