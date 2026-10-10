import { MigrationInterface, QueryRunner } from 'typeorm';

const tables = ['email_logs', 'email_campaign_variants', 'email_open_history', 'ticket_assignment_rules', 'ticket_escalation_rules'];
const renamedTables = tables.filter(table => table !== 'email_logs');

export class TenantEntityAlignment1791396000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) throw new Error('Tenant alignment requires a transaction');
    for (const table of tables) {
      await runner.query(`ALTER TABLE "${table}" ADD COLUMN tenant_id varchar, ADD COLUMN deleted_at timestamp`);
    }
    for (const table of renamedTables) {
      for (const [legacy, current] of [['createdAt', 'created_at'], ['updatedAt', 'updated_at']]) {
        if (await runner.hasColumn(table, legacy)) {
          if (await runner.hasColumn(table, current)) throw new Error(`Ambiguous timestamp columns in ${table}`);
          await runner.query(`ALTER TABLE "${table}" RENAME COLUMN "${legacy}" TO "${current}"`);
        }
      }
    }
    // This legacy table had no modification timestamp. Preserve its known creation time.
    if (!await runner.hasColumn('email_open_history', 'updated_at')) {
      await runner.query('ALTER TABLE email_open_history ADD COLUMN updated_at timestamp');
      await runner.query('UPDATE email_open_history SET updated_at = created_at');
      await runner.query('ALTER TABLE email_open_history ALTER COLUMN updated_at SET NOT NULL, ALTER COLUMN updated_at SET DEFAULT now()');
    }
    for (const table of ['email_logs', 'email_campaign_variants']) {
      await runner.query(`UPDATE "${table}" child SET tenant_id = campaign.tenant_id
        FROM email_campaigns campaign WHERE child.campaign_id = campaign.id
        AND campaign.tenant_id IS NOT NULL AND btrim(campaign.tenant_id) <> ''`);
    }
    await runner.query(`UPDATE email_open_history history SET tenant_id = campaign.tenant_id
      FROM email_campaigns campaign, subscribers subscriber
      WHERE history."campaignId" = campaign.id AND history."subscriberId" = subscriber.id
      AND campaign.tenant_id IS NOT NULL AND btrim(campaign.tenant_id) <> ''
      AND campaign.tenant_id = subscriber.tenant_id`);
    // Rules have no trustworthy creator provenance: existing rows remain NULL-quarantined.
    for (const table of tables) await runner.query(`CREATE INDEX "idx_${table}_tenant_live" ON "${table}" (tenant_id) WHERE deleted_at IS NULL`);
  }

  async down(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) throw new Error('Tenant alignment rollback requires a transaction');
    await runner.query(`LOCK TABLE ${tables.map(table => `"${table}"`).join(', ')} IN ACCESS EXCLUSIVE MODE`);
    for (const table of tables) {
      const rows = await runner.query(`SELECT 1 FROM "${table}" WHERE tenant_id IS NOT NULL OR deleted_at IS NOT NULL LIMIT 1`);
      if (rows.length) throw new Error('Tenant-scoped or soft-deleted records prevent alignment rollback');
    }
    if ((await runner.query('SELECT 1 FROM email_open_history WHERE updated_at IS DISTINCT FROM created_at LIMIT 1')).length) {
      throw new Error('Modified history records prevent alignment rollback');
    }
    for (const table of tables) {
      await runner.query(`DROP INDEX "idx_${table}_tenant_live"`);
      await runner.query(`ALTER TABLE "${table}" DROP COLUMN tenant_id, DROP COLUMN deleted_at`);
    }
    await runner.query('ALTER TABLE email_open_history DROP COLUMN updated_at');
    for (const table of renamedTables) {
      await runner.query(`ALTER TABLE "${table}" RENAME COLUMN created_at TO "createdAt"`);
      if (table !== 'email_open_history') await runner.query(`ALTER TABLE "${table}" RENAME COLUMN updated_at TO "updatedAt"`);
    }
  }
}
