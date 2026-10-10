import { QueryRunner } from 'typeorm';
import { CrmTenantIntegrity1791428400000 } from './1791428400000-CrmTenantIntegrity';

describe('CrmTenantIntegrity migration', () => {
  it('creates a reproducible tenant-scoped CRM schema', async () => {
    const queries: string[] = [];
    const runner = {
      query: jest.fn(async (sql: string) => {
        queries.push(sql.replace(/\s+/g, ' ').trim());
        return [];
      }),
    } as unknown as QueryRunner;

    await new CrmTenantIntegrity1791428400000().up(runner);
    const sql = queries.join('\n');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS crm_customers');
    expect(sql).toContain('ALTER COLUMN tenant_id SET NOT NULL');
    expect(sql).toContain('IDX_crm_customers_tenant_email_live');
    expect(sql).toContain('ON crm_customers (tenant_id, lower(email))');
    expect(sql).toContain('FK_crm_leads_tenant_customer');
    expect(sql).toContain('REFERENCES crm_customers(tenant_id, id)');
    expect(sql).toContain('Existing crm_leads schema is missing required tenant constraints');
    expect(sql).toContain("organization_owner', 'organization_admin', 'admin");
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS crm_leads');
    expect(sql).toContain('IDX_crm_leads_tenant_source_record');
    expect(sql).toContain("pg_get_constraintdef(oid) = 'CHECK (((source_type)::text = ''form''::text))'");
    expect(sql).toContain("pg_get_constraintdef(oid) = 'CHECK (((email IS NOT NULL) OR (phone IS NOT NULL)))'");
    expect(sql).toContain('CrmTenantIntegrity1791428400000:owned');
    expect(sql).not.toContain('ADD COLUMN IF NOT EXISTS "idempotencyKey"');
  });

  it('refuses unscoped legacy customers before enforcing the schema', async () => {
    const runner = {
      query: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([{ id: 'unsafe-row' }]),
    } as unknown as QueryRunner;

    await expect(new CrmTenantIntegrity1791428400000().up(runner))
      .rejects.toThrow('unscoped CRM customers');
  });

  it('restores the legacy email contract only when rollback is unambiguous', async () => {
    const queries: string[] = [];
    const runner = { query: jest.fn(async (sql: string) => {
      queries.push(sql.replace(/\s+/g, ' ').trim());
      return [];
    }) } as unknown as QueryRunner;

    await new CrmTenantIntegrity1791428400000().down(runner);
    const sql = queries.join('\n');
    expect(sql).toContain('ALTER COLUMN tenant_id DROP NOT NULL');
    expect(sql).toContain('UQ_crm_customers_email');
  });

  it('refuses rollback after cross-tenant duplicate emails were created', async () => {
    const runner = { query: jest.fn().mockResolvedValueOnce([{ email: 'shared@example.com', count: 2 }]) } as unknown as QueryRunner;
    await expect(new CrmTenantIntegrity1791428400000().down(runner))
      .rejects.toThrow('global duplicate emails');
  });

  it('includes soft-deleted rows in the rollback duplicate preflight', async () => {
    const queries: string[] = [];
    const runner = { query: jest.fn(async (sql: string) => {
      queries.push(sql.replace(/\s+/g, ' ').trim());
      return [];
    }) } as unknown as QueryRunner;

    await new CrmTenantIntegrity1791428400000().down(runner);

    const duplicateQuery = queries[0];
    expect(duplicateQuery).toContain('FROM crm_customers');
    expect(duplicateQuery).not.toContain('deleted_at IS NULL');
  });

  it('drops crm_leads only when this migration owns the table', async () => {
    const queries: string[] = [];
    const runner = { query: jest.fn(async (sql: string) => {
      queries.push(sql.replace(/\s+/g, ' ').trim());
      return [];
    }) } as unknown as QueryRunner;

    await new CrmTenantIntegrity1791428400000().down(runner);
    const sql = queries.join('\n');

    expect(sql).toContain("obj_description('crm_leads'::regclass, 'pg_class')");
    expect(sql).toContain('CrmTenantIntegrity1791428400000:owned');
    expect(sql).not.toContain('DROP TABLE IF EXISTS crm_leads');
  });

  it('drops crm_customers only when this migration owns the table', async () => {
    const queries: string[] = [];
    const runner = { query: jest.fn(async (sql: string) => {
      queries.push(sql.replace(/\s+/g, ' ').trim());
      return [];
    }) } as unknown as QueryRunner;

    await new CrmTenantIntegrity1791428400000().down(runner);
    const sql = queries.join('\n');

    expect(sql).toContain("obj_description('crm_customers'::regclass, 'pg_class') = 'CrmTenantIntegrity1791428400000:owned'");
    expect(sql).toContain('THEN DROP TABLE crm_customers');
    expect(sql).toContain('ELSE DROP INDEX IF EXISTS "IDX_crm_customers_tenant_created"');
  });
});
