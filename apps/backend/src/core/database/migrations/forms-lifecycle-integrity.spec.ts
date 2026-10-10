import { QueryRunner } from 'typeorm';
import { FormsLifecycleIntegrity1791432000000 } from './1791432000000-FormsLifecycleIntegrity';

describe('FormsLifecycleIntegrity migration', () => {
  it('preflights tenant mismatches and replaces the unsafe single-column form FK', async () => {
    const queries: string[] = [];
    const runner = {
      query: jest.fn(async (sql: string) => {
        queries.push(sql.replace(/\s+/g, ' ').trim());
        return [];
      }),
    } as unknown as QueryRunner;

    await new FormsLifecycleIntegrity1791432000000().up(runner);
    const sql = queries.join('\n');

    expect(sql).toContain("SET LOCAL lock_timeout = '5s'");
    expect(sql).toContain('submission."tenantId" <> form."tenantId"');
    expect(sql).toContain('LOCK TABLE forms, form_submissions');
    expect(sql).toContain("status NOT IN ('draft','published','archived')");
    expect(sql).toContain('"CK_forms_status"');
    expect(sql).toContain('CREATE UNIQUE INDEX "IDX_forms_tenant_id"');
    expect(sql).toContain('ON forms ("tenantId", id)');
    expect(sql).toContain('FOREIGN KEY ("tenantId", "formId")');
    expect(sql).toContain('REFERENCES forms("tenantId", id)');
  });

  it('aborts before schema changes when legacy submissions have a tenant mismatch', async () => {
    const runner = {
      query: jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([{ id: randomId }]),
    } as unknown as QueryRunner;

    await expect(new FormsLifecycleIntegrity1791432000000().up(runner))
      .rejects.toThrow('tenant-mismatched form submissions');
  });
});

const randomId = '00000000-0000-4000-8000-000000000001';
