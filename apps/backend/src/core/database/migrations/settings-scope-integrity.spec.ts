import { QueryRunner } from 'typeorm';
import { SettingsScopeIntegrity1791424800000 } from './1791424800000-SettingsScopeIntegrity';

describe('SettingsScopeIntegrity migration', () => {
  it('uses bounded waits, preflights before locking and repeats the preflight under the lock', async () => {
    const queries: string[] = [];
    const runner = {
      query: jest.fn(async (sql: string) => {
        queries.push(sql.replace(/\s+/g, ' ').trim());
        return [];
      }),
    } as unknown as QueryRunner;

    await new SettingsScopeIntegrity1791424800000().up(runner);

    expect(queries[0]).toBe("SET LOCAL lock_timeout = '5s'");
    expect(queries[1]).toBe("SET LOCAL statement_timeout = '30s'");
    const lockIndex = queries.indexOf('LOCK TABLE settings IN ACCESS EXCLUSIVE MODE');
    const mutationIndex = queries.findIndex(sql => sql.startsWith('ALTER TABLE settings'));
    const unscopedChecks = queries.filter(sql => sql.startsWith('SELECT id FROM settings') && sql.includes('tenant_id IS NULL'));
    const duplicateChecks = queries.filter(sql => sql.startsWith('SELECT tenant_id') && sql.includes('HAVING count(*) > 1'));
    expect(unscopedChecks).toHaveLength(2);
    expect(duplicateChecks).toHaveLength(2);
    expect(lockIndex).toBeGreaterThan(3);
    expect(mutationIndex).toBeGreaterThan(lockIndex + 2);
  });

  it('refuses ambiguous legacy rows before changing the schema', async () => {
    const runner = {
      query: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'unscoped-setting' }]),
    } as unknown as QueryRunner;

    await expect(new SettingsScopeIntegrity1791424800000().up(runner))
      .rejects.toThrow('unscoped settings');
    expect((runner.query as jest.Mock).mock.calls).toHaveLength(3);
  });

  it('refuses duplicate live tenant keys before changing the schema', async () => {
    const runner = {
      query: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ tenant_id: 'xyz', category: 'company', key: 'domain', count: 2 }]),
    } as unknown as QueryRunner;

    await expect(new SettingsScopeIntegrity1791424800000().up(runner))
      .rejects.toThrow('duplicate live tenant settings');
    expect((runner.query as jest.Mock).mock.calls).toHaveLength(4);
  });

  it('enforces tenant/platform scope and separate live uniqueness indexes', async () => {
    const queries: string[] = [];
    const runner = {
      query: jest.fn(async (sql: string) => {
        queries.push(sql.replace(/\s+/g, ' ').trim());
        return [];
      }),
    } as unknown as QueryRunner;

    await new SettingsScopeIntegrity1791424800000().up(runner);
    const sql = queries.join('\n');

    expect(sql).toContain('CHK_settings_scope_tenant');
    expect(sql).toContain("scope = 'tenant' AND tenant_id IS NOT NULL");
    expect(sql).toContain("scope = 'platform' AND tenant_id IS NULL");
    expect(sql).toContain('IDX_settings_tenant_category_key_live');
    expect(sql).toContain('IDX_settings_platform_category_key_live');
    expect(sql).toContain('CREATE TABLE setting_revisions');
    expect(sql).toContain('CREATE TABLE setting_audit_logs');
  });
});
