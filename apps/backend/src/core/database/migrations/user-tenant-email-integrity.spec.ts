import { QueryRunner } from 'typeorm';
import { UserTenantEmailIntegrity1791414000000 } from './1791414000000-UserTenantEmailIntegrity';

describe('UserTenantEmailIntegrity migration', () => {
  it('locks before auditing and creates normalized live-user uniqueness', async () => {
    const queries: string[] = [];
    const runner = {
      query: jest.fn(async (sql: string) => {
        queries.push(sql.trim());
        return [];
      }),
    } as unknown as QueryRunner;
    await new UserTenantEmailIntegrity1791414000000().up(runner);
    expect(queries[0]).toBe('LOCK TABLE "users" IN ACCESS EXCLUSIVE MODE');
    expect(queries.join('\n')).toContain('CREATE UNIQUE INDEX "IDX_users_tenant_normalized_email_live"');
    expect(queries.join('\n')).toContain('lower(btrim("email"))');
    expect(queries.join('\n')).toContain('"refreshToken" = NULL');
  });

  it('refuses ambiguous duplicate live users', async () => {
    const runner = {
      query: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ tenant_id: 'a', normalized_email: 'same@example.com', count: 2 }]),
    } as unknown as QueryRunner;
    await expect(new UserTenantEmailIntegrity1791414000000().up(runner)).rejects.toThrow('duplicate live users');
  });
});
