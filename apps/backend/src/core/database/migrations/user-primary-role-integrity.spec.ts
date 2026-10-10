import { QueryRunner } from 'typeorm';
import { UserPrimaryRoleIntegrity1791421200000 } from './1791421200000-UserPrimaryRoleIntegrity';

describe('UserPrimaryRoleIntegrity migration', () => {
  it('locks data, canonicalizes role names, and enforces live uniqueness', async () => {
    const queries: string[] = [];
    const runner = {
      query: jest.fn(async (sql: string) => {
        queries.push(sql.trim());
        return [];
      }),
    } as unknown as QueryRunner;

    await new UserPrimaryRoleIntegrity1791421200000().up(runner);

    expect(queries[0]).toContain('LOCK TABLE roles, user_roles');
    expect(queries.join('\n')).toContain('lower(btrim(name))');
    expect(queries.join('\n')).toContain('IDX_user_roles_one_live_primary_per_tenant_user');
    expect(queries.join('\n')).toContain('IDX_roles_tenant_normalized_name_live');
  });

  it('refuses duplicate live primary assignments', async () => {
    const runner = {
      query: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ tenant_id: 'a', user_id: 'u', count: 2 }]),
    } as unknown as QueryRunner;

    await expect(new UserPrimaryRoleIntegrity1791421200000().up(runner))
      .rejects.toThrow('multiple live primary roles');
  });

  it('refuses rollback before mutation when deleted and live role names collide', async () => {
    const runner = {
      query: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ tenant_id: 'a', name: 'editor', count: 2 }]),
    } as unknown as QueryRunner;

    await expect(new UserPrimaryRoleIntegrity1791421200000().down(runner))
      .rejects.toThrow('rollback');
    expect((runner.query as jest.Mock).mock.calls).toHaveLength(2);
  });
});
