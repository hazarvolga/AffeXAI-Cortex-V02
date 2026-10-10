import { MigrationInterface, QueryRunner } from 'typeorm';

export class TicketCsatTenantScope1791385200000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query('ALTER TABLE ticket_csat RENAME COLUMN "createdAt" TO created_at');
    await runner.query(`ALTER TABLE ticket_csat ADD COLUMN tenant_id varchar,
      ADD COLUMN updated_at timestamp NOT NULL DEFAULT now(), ADD COLUMN deleted_at timestamp`);
    // Derive scope only from a consistent ticket owner. Ambiguous legacy rows
    // remain quarantined with NULL tenant rather than being assigned or deleted.
    await runner.query(`UPDATE ticket_csat c SET tenant_id = t.tenant_id
      FROM tickets t, users u WHERE t.id = c."ticketId" AND u.id = c."customerId"
      AND t."userId" = u.id AND t.tenant_id = u.tenant_id AND t.tenant_id IS NOT NULL`);
    const duplicates = await runner.query(`SELECT 1 FROM ticket_csat WHERE tenant_id IS NOT NULL
      AND deleted_at IS NULL GROUP BY tenant_id, "ticketId" HAVING count(*) > 1 LIMIT 1`);
    if (duplicates.length) throw new Error('Duplicate scoped CSAT surveys require explicit remediation; no surveys were removed');
    await runner.query(`CREATE UNIQUE INDEX uq_csat_active_ticket ON ticket_csat(tenant_id, "ticketId")
      WHERE deleted_at IS NULL AND tenant_id IS NOT NULL`);
    await runner.query(`ALTER TABLE ticket_csat ADD CONSTRAINT fk_csat_ticket_tenant
      FOREIGN KEY ("ticketId", tenant_id) REFERENCES tickets(id, tenant_id) ON DELETE CASCADE`);
    await runner.query(`ALTER TABLE ticket_csat ADD CONSTRAINT fk_csat_customer_tenant
      FOREIGN KEY ("customerId", tenant_id) REFERENCES users(id, tenant_id) ON DELETE RESTRICT`);
  }
  async down(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) throw new Error('CSAT rollback requires a transaction');
    await runner.query('LOCK TABLE ticket_csat IN ACCESS EXCLUSIVE MODE');
    if ((await runner.query('SELECT 1 FROM ticket_csat LIMIT 1')).length) throw new Error('CSAT tenant metadata requires explicit recovery before rollback');
    await runner.query('ALTER TABLE ticket_csat DROP CONSTRAINT fk_csat_customer_tenant, DROP CONSTRAINT fk_csat_ticket_tenant');
    await runner.query('DROP INDEX uq_csat_active_ticket');
    await runner.query('ALTER TABLE ticket_csat DROP COLUMN tenant_id, DROP COLUMN updated_at, DROP COLUMN deleted_at');
    await runner.query('ALTER TABLE ticket_csat RENAME COLUMN created_at TO "createdAt"');
  }
}
