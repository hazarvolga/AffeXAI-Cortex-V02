import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutomationDispatchOutbox1791435600000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`SET LOCAL lock_timeout = '5s'`);
    await runner.query(`SET LOCAL statement_timeout = '30s'`);
    await runner.query('LOCK TABLE automation_approvals, automation_rules, platform_events IN SHARE ROW EXCLUSIVE MODE');
    const tenantMismatches = await runner.query(`
      SELECT approval.id
      FROM automation_approvals approval
      LEFT JOIN automation_rules rule
        ON rule.id = approval.rule_id AND rule.tenant_id = approval.tenant_id
      LEFT JOIN platform_events event
        ON event.id = approval.event_id AND event.tenant_id = approval.tenant_id
      WHERE approval.tenant_id IS NULL
        OR rule.id IS NULL
        OR (approval.event_id IS NOT NULL AND event.id IS NULL)
      LIMIT 10
    `);
    if (tenantMismatches.length) {
      throw new Error('tenant-mismatched automation approvals prevent durable dispatch migration');
    }
    const duplicateApprovals = await runner.query(`
      SELECT 1 FROM automation_approvals
      WHERE event_id IS NOT NULL
      GROUP BY tenant_id, rule_id, event_id HAVING count(*) > 1 LIMIT 1
    `);
    if (duplicateApprovals.length) {
      throw new Error('Duplicate automation approvals prevent durable dispatch migration');
    }
    await runner.query(`CREATE UNIQUE INDEX uq_automation_approval_dispatch
      ON automation_approvals(tenant_id, rule_id, event_id)
      WHERE event_id IS NOT NULL`);
    await runner.query(
      'ALTER TABLE automation_rules ADD CONSTRAINT uq_automation_rule_tenant UNIQUE (id, tenant_id)',
    );
    await runner.query(`ALTER TABLE automation_approvals ALTER COLUMN tenant_id SET NOT NULL`);
    await runner.query(`ALTER TABLE automation_approvals
      DROP CONSTRAINT IF EXISTS "FK_667c67b8dafc94157083326ab5c"`);
    await runner.query(`ALTER TABLE automation_approvals
      DROP CONSTRAINT IF EXISTS "FK_044bd1e23ef115eb279c0ede575"`);
    await runner.query(`ALTER TABLE automation_approvals
      ADD CONSTRAINT fk_automation_approval_rule_tenant
      FOREIGN KEY (rule_id, tenant_id)
      REFERENCES automation_rules(id, tenant_id) ON DELETE CASCADE`);
    await runner.query(`ALTER TABLE automation_approvals
      ADD CONSTRAINT fk_automation_approval_event_tenant
      FOREIGN KEY (event_id, tenant_id)
      REFERENCES platform_events(id, tenant_id) ON DELETE RESTRICT`);
    await runner.query(`CREATE TABLE automation_dispatch_outbox (
      event_id uuid NOT NULL,
      rule_id uuid NOT NULL,
      tenant_id varchar NOT NULL,
      status varchar NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','processing','delivered','skipped','dead')),
      attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
      available_at timestamptz NOT NULL DEFAULT now(),
      lease_token uuid,
      leased_until timestamptz,
      delivered_at timestamptz,
      last_error_code varchar(64),
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (event_id, rule_id),
      CONSTRAINT fk_automation_dispatch_event
        FOREIGN KEY (event_id, tenant_id)
        REFERENCES platform_events(id, tenant_id) ON DELETE RESTRICT,
      CONSTRAINT fk_automation_dispatch_rule
        FOREIGN KEY (rule_id, tenant_id)
        REFERENCES automation_rules(id, tenant_id) ON DELETE RESTRICT
    )`);
    await runner.query(`ALTER TABLE automation_dispatch_outbox
      ADD CONSTRAINT uq_automation_dispatch_tenant
      UNIQUE (event_id, rule_id, tenant_id)`);
    await runner.query(`CREATE INDEX idx_automation_dispatch_due
      ON automation_dispatch_outbox(available_at, created_at)
      WHERE status IN ('pending','processing')`);
    await runner.query(`CREATE TABLE automation_action_executions (
      event_id uuid NOT NULL,
      rule_id uuid NOT NULL,
      tenant_id varchar NOT NULL,
      action_order integer NOT NULL CHECK (action_order >= 0),
      status varchar NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing','failed','delivered')),
      attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0),
      started_at timestamptz NOT NULL DEFAULT now(),
      finished_at timestamptz,
      last_error_code varchar(64),
      PRIMARY KEY (event_id, rule_id, action_order),
      CONSTRAINT fk_automation_action_dispatch
        FOREIGN KEY (event_id, rule_id, tenant_id)
        REFERENCES automation_dispatch_outbox(event_id, rule_id, tenant_id)
        ON DELETE RESTRICT
    )`);
  }

  async down(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) {
      throw new Error('Automation dispatch rollback requires a transaction');
    }
    await runner.query('LOCK TABLE automation_dispatch_outbox IN ACCESS EXCLUSIVE MODE');
    const outstanding = await runner.query(
      `SELECT 1 FROM automation_dispatch_outbox
       WHERE status NOT IN ('delivered','skipped') LIMIT 1`,
    );
    if (outstanding.length) {
      throw new Error('Undelivered automation dispatches prevent rollback');
    }
    await runner.query('DROP TABLE automation_action_executions');
    await runner.query('DROP TABLE automation_dispatch_outbox');
    await runner.query(`ALTER TABLE automation_approvals
      DROP CONSTRAINT fk_automation_approval_event_tenant`);
    await runner.query(`ALTER TABLE automation_approvals
      DROP CONSTRAINT fk_automation_approval_rule_tenant`);
    await runner.query(`ALTER TABLE automation_approvals
      ADD CONSTRAINT "FK_667c67b8dafc94157083326ab5c"
      FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE`);
    await runner.query(`ALTER TABLE automation_approvals
      ADD CONSTRAINT "FK_044bd1e23ef115eb279c0ede575"
      FOREIGN KEY (event_id) REFERENCES platform_events(id) ON DELETE SET NULL`);
    await runner.query('ALTER TABLE automation_approvals ALTER COLUMN tenant_id DROP NOT NULL');
    await runner.query('DROP INDEX uq_automation_approval_dispatch');
    await runner.query(
      'ALTER TABLE automation_rules DROP CONSTRAINT uq_automation_rule_tenant',
    );
  }
}
