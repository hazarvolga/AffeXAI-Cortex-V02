import { AutomationApprovalPermission1791439200000 } from './1791439200000-AutomationApprovalPermission';

describe('AutomationApprovalPermission1791439200000', () => {
  it('grants the separate approval permission only to tenant owners', async () => {
    const query = jest.fn().mockResolvedValue([]);

    await new AutomationApprovalPermission1791439200000().up({ query } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('automation.approve');
    expect(sql).toContain("lower(btrim(name)) = 'organization_owner'");
    expect(sql).toContain('tenant_id IS NOT NULL');
    expect(sql).not.toContain("lower(btrim(name)) = 'admin'");
  });
});
