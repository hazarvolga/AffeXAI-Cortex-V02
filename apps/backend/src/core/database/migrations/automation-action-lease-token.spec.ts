import { AutomationActionLeaseToken1791442800000 } from './1791442800000-AutomationActionLeaseToken';

describe('AutomationActionLeaseToken1791442800000', () => {
  it('adds a non-null action ownership token before removing the bootstrap default', async () => {
    const query = jest.fn().mockResolvedValue([]);

    await new AutomationActionLeaseToken1791442800000().up({ query } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('ADD COLUMN lease_token uuid NOT NULL DEFAULT gen_random_uuid()');
    expect(sql).toContain('ALTER COLUMN lease_token DROP DEFAULT');
  });
});
