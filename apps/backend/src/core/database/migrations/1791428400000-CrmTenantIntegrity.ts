import { MigrationInterface, QueryRunner } from 'typeorm';

const CRM_ADMIN_PERMISSIONS = [
  'crm.view', 'crm.manage', 'crm.delete',
  'forms.view', 'forms.manage', 'forms.submissions.view',
];

export class CrmTenantIntegrity1791428400000 implements MigrationInterface {
  name = 'CrmTenantIntegrity1791428400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL lock_timeout = '5s'`);
    await queryRunner.query(`SET LOCAL statement_timeout = '30s'`);
    await queryRunner.query(`
      DO $$
      DECLARE migration_created_table boolean := to_regclass('public.crm_customers') IS NULL;
      BEGIN
      CREATE TABLE IF NOT EXISTS crm_customers (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        tenant_id varchar(128),
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        deleted_at timestamp,
        "companyName" varchar(255) NOT NULL,
        email varchar(255) NOT NULL,
        "customerNumber" varchar(100),
        "contactPerson" varchar(100),
        phone varchar(50),
        address text,
        city varchar(100),
        country varchar(100),
        "isActive" boolean NOT NULL DEFAULT true,
        notes text,
        metadata jsonb,
        "resonanceScore" double precision NOT NULL DEFAULT 0,
        "sentimentScore" double precision NOT NULL DEFAULT 0,
        "frictionRank" double precision NOT NULL DEFAULT 0,
        "lastInteractionAt" timestamp,
        CONSTRAINT "PK_crm_customers" PRIMARY KEY (id)
      );
      IF migration_created_table THEN
        COMMENT ON TABLE crm_customers IS 'CrmTenantIntegrity1791428400000:owned';
      END IF;
      END $$
    `);
    await this.assertLegacyRowsAreSafe(queryRunner);
    await queryRunner.query('LOCK TABLE crm_customers IN ACCESS EXCLUSIVE MODE');
    await this.assertLegacyRowsAreSafe(queryRunner);

    await queryRunner.query(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        FOR constraint_name IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          WHERE rel.relname = 'crm_customers'
            AND con.contype = 'u'
            AND pg_get_constraintdef(con.oid) = 'UNIQUE (email)'
        LOOP
          EXECUTE format('ALTER TABLE crm_customers DROP CONSTRAINT %I', constraint_name);
        END LOOP;
      END $$
    `);
    await queryRunner.query(`ALTER TABLE crm_customers ALTER COLUMN tenant_id SET NOT NULL`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_16d8d9021e548702f2689247f4"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_crm_customers_tenant_email_live"
      ON crm_customers (tenant_id, lower(email))
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_crm_customers_tenant_id"
      ON crm_customers (tenant_id, id)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_crm_customers_tenant_created"
      ON crm_customers (tenant_id, created_at DESC)
    `);
    await queryRunner.query(`
      ALTER TABLE form_submissions
      ADD COLUMN "idempotencyKey" varchar(80),
      ADD COLUMN "payloadHash" varchar(64)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_form_submissions_tenant_id"
      ON form_submissions ("tenantId", id)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_form_submissions_idempotency"
      ON form_submissions ("tenantId", "formId", "idempotencyKey")
      WHERE "idempotencyKey" IS NOT NULL
    `);
    await queryRunner.query(`
      DO $$
      DECLARE migration_created_table boolean := to_regclass('public.crm_leads') IS NULL;
      BEGIN
      CREATE TABLE IF NOT EXISTS crm_leads (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        tenant_id varchar(128) NOT NULL,
        customer_id uuid,
        source_type varchar(32) NOT NULL,
        source_record_id uuid NOT NULL,
        form_id uuid,
        email varchar(255),
        company_name varchar(255),
        contact_name varchar(100),
        phone varchar(50),
        status varchar(32) NOT NULL DEFAULT 'new',
        source_data jsonb NOT NULL DEFAULT '{}'::jsonb,
        schema_version integer NOT NULL DEFAULT 1,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_crm_leads" PRIMARY KEY (id),
        CONSTRAINT "FK_crm_leads_form_submission" FOREIGN KEY (tenant_id, source_record_id)
          REFERENCES form_submissions("tenantId", id) ON DELETE RESTRICT,
        CONSTRAINT "FK_crm_leads_tenant_customer" FOREIGN KEY (tenant_id, customer_id)
          REFERENCES crm_customers(tenant_id, id) ON DELETE RESTRICT,
        CONSTRAINT "CHK_crm_leads_source" CHECK (source_type = 'form'),
        CONSTRAINT "CHK_crm_leads_contact" CHECK (email IS NOT NULL OR phone IS NOT NULL)
      );
      IF migration_created_table THEN
        COMMENT ON TABLE crm_leads IS 'CrmTenantIntegrity1791428400000:owned';
      END IF;
      END $$
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'crm_leads'::regclass AND contype = 'f'
            AND conname = 'FK_crm_leads_tenant_customer'
            AND pg_get_constraintdef(oid) LIKE '%FOREIGN KEY (tenant_id, customer_id)%REFERENCES crm_customers(tenant_id, id)%'
        ) OR NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'crm_leads'::regclass AND contype = 'f'
            AND conname = 'FK_crm_leads_form_submission'
            AND pg_get_constraintdef(oid) LIKE '%FOREIGN KEY (tenant_id, source_record_id)%REFERENCES form_submissions("tenantId", id)%'
        ) OR NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'crm_leads'::regclass AND contype = 'c'
            AND conname = 'CHK_crm_leads_contact'
            AND pg_get_constraintdef(oid) = 'CHECK (((email IS NOT NULL) OR (phone IS NOT NULL)))'
        ) OR NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'crm_leads'::regclass AND contype = 'c'
            AND conname = 'CHK_crm_leads_source'
            AND pg_get_constraintdef(oid) = 'CHECK (((source_type)::text = ''form''::text))'
        ) THEN
          RAISE EXCEPTION 'Existing crm_leads schema is missing required tenant constraints';
        END IF;
      END $$
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_crm_leads_tenant_source_record"
      ON crm_leads (tenant_id, source_type, source_record_id)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_crm_leads_tenant_customer"
      ON crm_leads (tenant_id, customer_id)
    `);
    await queryRunner.query(
      `
        UPDATE roles
        SET permissions = (
          SELECT jsonb_agg(DISTINCT value ORDER BY value)
          FROM jsonb_array_elements_text(
            COALESCE(permissions, '[]'::jsonb) || $1::jsonb
          ) AS entry(value)
        ), updated_at = now()
        WHERE tenant_id IS NOT NULL
          AND deleted_at IS NULL
          AND lower(btrim(name)) IN ('organization_owner', 'organization_admin', 'admin')
      `,
      [JSON.stringify(CRM_ADMIN_PERMISSIONS)],
    );
  }

  private async assertLegacyRowsAreSafe(queryRunner: QueryRunner): Promise<void> {
    const unscoped = await queryRunner.query(`
      SELECT id FROM crm_customers WHERE tenant_id IS NULL LIMIT 10
    `);
    if (unscoped.length > 0) {
      throw new Error('Cannot enforce CRM tenant scope: unscoped CRM customers require resolution');
    }
    const duplicates = await queryRunner.query(`
      SELECT tenant_id, lower(email) AS email, count(*)::int AS count
      FROM crm_customers
      WHERE deleted_at IS NULL
      GROUP BY tenant_id, lower(email)
      HAVING count(*) > 1
      LIMIT 10
    `);
    if (duplicates.length > 0) {
      throw new Error('Cannot enforce CRM tenant scope: duplicate tenant customer emails require resolution');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const crossTenantDuplicates = await queryRunner.query(`
      SELECT email, count(*)::int AS count
      FROM crm_customers
      GROUP BY email
      HAVING count(*) > 1
      LIMIT 10
    `);
    if (crossTenantDuplicates.length > 0) {
      throw new Error('Cannot roll back CRM tenant scope: global duplicate emails require resolution');
    }
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.crm_leads') IS NOT NULL
          AND obj_description('crm_leads'::regclass, 'pg_class') = 'CrmTenantIntegrity1791428400000:owned'
        THEN
          DROP TABLE crm_leads;
        END IF;
      END $$
    `);
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_form_submissions_idempotency"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_form_submissions_tenant_id"');
    await queryRunner.query('ALTER TABLE form_submissions DROP COLUMN IF EXISTS "payloadHash"');
    await queryRunner.query('ALTER TABLE form_submissions DROP COLUMN IF EXISTS "idempotencyKey"');
    await queryRunner.query(`
      DO $$
      BEGIN
        IF obj_description('crm_customers'::regclass, 'pg_class') = 'CrmTenantIntegrity1791428400000:owned'
        THEN
          DROP TABLE crm_customers;
        ELSE
          DROP INDEX IF EXISTS "IDX_crm_customers_tenant_created";
          DROP INDEX IF EXISTS "IDX_crm_customers_tenant_id";
          DROP INDEX IF EXISTS "IDX_crm_customers_tenant_email_live";
          ALTER TABLE crm_customers ALTER COLUMN tenant_id DROP NOT NULL;
          ALTER TABLE crm_customers
            ADD CONSTRAINT "UQ_crm_customers_email" UNIQUE (email);
        END IF;
      END $$
    `);
  }
}
