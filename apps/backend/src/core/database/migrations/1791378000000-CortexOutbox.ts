import { MigrationInterface, QueryRunner } from 'typeorm';

export class CortexOutbox1791378000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE platform_events ADD CONSTRAINT uq_platform_event_tenant UNIQUE (id, tenant_id)`);
    await runner.query(`CREATE TABLE cortex_outbox (
      event_id uuid PRIMARY KEY,
      tenant_id varchar NOT NULL,
      payload jsonb NOT NULL,
      status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','delivered','dead')),
      attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
      available_at timestamptz NOT NULL DEFAULT now(),
      lease_token uuid,
      leased_until timestamptz,
      delivered_at timestamptz,
      last_error_code varchar(64),
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT fk_cortex_event FOREIGN KEY (event_id, tenant_id) REFERENCES platform_events(id, tenant_id) ON DELETE RESTRICT,
      CONSTRAINT ck_cortex_payload_identity CHECK ((payload->>'tenantId') IS NOT NULL AND (payload->>'eventId') IS NOT NULL AND payload->>'tenantId' = tenant_id AND payload->>'eventId' = event_id::text)
    )`);
    await runner.query(`CREATE INDEX idx_cortex_outbox_due ON cortex_outbox(available_at, created_at) WHERE status IN ('pending','processing')`);
  }
  async down(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) throw new Error('Cortex outbox rollback requires a transaction');
    await runner.query('LOCK TABLE cortex_outbox IN ACCESS EXCLUSIVE MODE');
    const outstanding = await runner.query(`SELECT 1 FROM cortex_outbox WHERE status <> 'delivered' LIMIT 1`);
    if (outstanding.length) throw new Error('Undelivered Cortex events prevent rollback');
    await runner.query('DROP TABLE cortex_outbox');
    await runner.query('ALTER TABLE platform_events DROP CONSTRAINT uq_platform_event_tenant');
  }
}
