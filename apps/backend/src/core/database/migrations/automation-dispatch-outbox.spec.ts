import { AutomationDispatchOutbox1791435600000 } from './1791435600000-AutomationDispatchOutbox';

describe('AutomationDispatchOutbox migration', () => {
  it('creates tenant-scoped dispatch, action ledger and approval idempotency constraints', async () => {
    const sql: string[] = [];
    const runner = {
      query: jest.fn(async (statement: string) => {
        sql.push(statement);
        if (statement.includes('GROUP BY tenant_id')) return [];
        return [];
      }),
    };
    await new AutomationDispatchOutbox1791435600000().up(runner as any);
    const all = sql.join('\n');
    expect(all).toContain('uq_automation_approval_dispatch');
    expect(all).toContain('automation_dispatch_outbox');
    expect(all).toContain('automation_action_executions');
    expect(all).toContain('FOREIGN KEY (event_id, rule_id, tenant_id)');
    expect(all).toContain('fk_automation_approval_rule_tenant');
    expect(all).toContain('FOREIGN KEY (rule_id, tenant_id)');
    expect(all).toContain('fk_automation_approval_event_tenant');
    expect(all).toContain('FOREIGN KEY (event_id, tenant_id)');
    expect(all).toContain('LEFT JOIN automation_rules rule');
    expect(all).toContain('LEFT JOIN platform_events event');
  });

  it('refuses tenant-mismatched approval relationships before changing constraints', async () => {
    const runner = {
      query: jest.fn(async (statement: string) =>
        statement.includes('SELECT approval.id') ? [{ id: 'unsafe-approval' }] : []),
    };
    await expect(new AutomationDispatchOutbox1791435600000().up(runner as any))
      .rejects.toThrow('tenant-mismatched automation approvals');
  });

  it('refuses rollback while retryable or dead dispatch work remains', async () => {
    const runner = {
      isTransactionActive: true,
      query: jest.fn(async (statement: string) => statement.includes('SELECT 1') ? [{ value: 1 }] : []),
    };
    await expect(new AutomationDispatchOutbox1791435600000().down(runner as any))
      .rejects.toThrow('Undelivered automation dispatches');
  });
});
