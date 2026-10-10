import { MigrationInterface, QueryRunner } from 'typeorm';

export class SettingsScopeIntegrity1791424800000 implements MigrationInterface {
  name = 'SettingsScopeIntegrity1791424800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL lock_timeout = '5s'`);
    await queryRunner.query(`SET LOCAL statement_timeout = '30s'`);
    await this.assertLegacyRowsAreSafe(queryRunner);
    await queryRunner.query('LOCK TABLE settings IN ACCESS EXCLUSIVE MODE');
    // Repeat under the lock so a write between the cheap preflight and the
    // schema mutation cannot introduce an ambiguous row.
    await this.assertLegacyRowsAreSafe(queryRunner);

    await queryRunner.query(`
      ALTER TABLE settings
      ALTER COLUMN tenant_id TYPE varchar,
      ADD COLUMN scope varchar(16)
    `);
    await queryRunner.query(`UPDATE settings SET scope = 'tenant' WHERE scope IS NULL`);
    await queryRunner.query(`
      ALTER TABLE settings
      ALTER COLUMN scope SET NOT NULL,
      ALTER COLUMN scope SET DEFAULT 'tenant',
      ADD CONSTRAINT "CHK_settings_scope_tenant"
      CHECK (
        (scope = 'tenant' AND tenant_id IS NOT NULL)
        OR (scope = 'platform' AND tenant_id IS NULL)
      )
    `);
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_settings_category_key"');
    await queryRunner.query('DROP INDEX IF EXISTS "_i_d_x_settings_category_key"');
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_settings_tenant_category_key_live"
      ON settings (tenant_id, category, key)
      WHERE deleted_at IS NULL AND scope = 'tenant'
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_settings_platform_category_key_live"
      ON settings (category, key)
      WHERE deleted_at IS NULL AND scope = 'platform'
    `);
    await queryRunner.query(`
      CREATE TABLE setting_revisions (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        tenant_id varchar(128),
        scope varchar(16) NOT NULL,
        revision bigint NOT NULL DEFAULT 0,
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_setting_revisions" PRIMARY KEY (id),
        CONSTRAINT "CHK_setting_revisions_scope_tenant" CHECK (
          (scope = 'tenant' AND tenant_id IS NOT NULL)
          OR (scope = 'platform' AND tenant_id IS NULL)
        )
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_setting_revisions_tenant"
      ON setting_revisions (tenant_id)
      WHERE scope = 'tenant'
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_setting_revisions_platform"
      ON setting_revisions (scope)
      WHERE scope = 'platform'
    `);
    await queryRunner.query(`
      CREATE TABLE setting_audit_logs (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        tenant_id varchar(128),
        scope varchar(16) NOT NULL,
        actor_id uuid,
        action varchar(64) NOT NULL,
        revision bigint NOT NULL,
        changed_keys text[] NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_setting_audit_logs" PRIMARY KEY (id),
        CONSTRAINT "CHK_setting_audit_logs_scope_tenant" CHECK (
          (scope = 'tenant' AND tenant_id IS NOT NULL)
          OR (scope = 'platform' AND tenant_id IS NULL)
        )
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_setting_audit_logs_tenant_revision"
      ON setting_audit_logs (tenant_id, revision DESC)
    `);
  }

  private async assertLegacyRowsAreSafe(queryRunner: QueryRunner): Promise<void> {
    const unscoped = await queryRunner.query(`
      SELECT id
      FROM settings
      WHERE tenant_id IS NULL
      LIMIT 10
    `);
    if (unscoped.length > 0) {
      throw new Error('Cannot enforce settings scope: unscoped settings require explicit tenant or platform classification');
    }

    const duplicates = await queryRunner.query(`
      SELECT tenant_id, category, key, count(*)::int AS count
      FROM settings
      WHERE deleted_at IS NULL
      GROUP BY tenant_id, category, key
      HAVING count(*) > 1
      LIMIT 10
    `);
    if (duplicates.length > 0) {
      throw new Error('Cannot enforce settings scope: duplicate live tenant settings require resolution');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS setting_audit_logs');
    await queryRunner.query('DROP TABLE IF EXISTS setting_revisions');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_settings_platform_category_key_live"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_settings_tenant_category_key_live"');
    await queryRunner.query('ALTER TABLE settings DROP CONSTRAINT IF EXISTS "CHK_settings_scope_tenant"');
    await queryRunner.query('ALTER TABLE settings DROP COLUMN IF EXISTS scope');
  }
}
