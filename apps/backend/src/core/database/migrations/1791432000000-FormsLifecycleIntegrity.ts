import { MigrationInterface, QueryRunner } from 'typeorm';

export class FormsLifecycleIntegrity1791432000000 implements MigrationInterface {
  name = 'FormsLifecycleIntegrity1791432000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL lock_timeout = '5s'`);
    await queryRunner.query(`SET LOCAL statement_timeout = '30s'`);
    await this.assertTenantBindingsAreSafe(queryRunner);
    await queryRunner.query('LOCK TABLE forms, form_submissions IN SHARE ROW EXCLUSIVE MODE');
    await this.assertTenantBindingsAreSafe(queryRunner);
    await queryRunner.query(`UPDATE forms SET status = 'draft'
      WHERE status IS NULL OR status NOT IN ('draft','published','archived')`);
    await queryRunner.query(`ALTER TABLE forms ADD CONSTRAINT "CK_forms_status"
      CHECK (status IN ('draft','published','archived'))`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_forms_tenant_id"
      ON forms ("tenantId", id)
    `);
    await queryRunner.query(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        FOR constraint_name IN
          SELECT con.conname
          FROM pg_constraint con
          WHERE con.conrelid = 'form_submissions'::regclass
            AND con.confrelid = 'forms'::regclass
            AND con.contype = 'f'
        LOOP
          EXECUTE format('ALTER TABLE form_submissions DROP CONSTRAINT %I', constraint_name);
        END LOOP;
      END $$
    `);
    await queryRunner.query(`
      ALTER TABLE form_submissions
      ADD CONSTRAINT "FK_form_submissions_tenant_form"
      FOREIGN KEY ("tenantId", "formId")
      REFERENCES forms("tenantId", id)
      ON DELETE RESTRICT
    `);
  }

  private async assertTenantBindingsAreSafe(queryRunner: QueryRunner): Promise<void> {
    const mismatches = await queryRunner.query(`
      SELECT submission.id
      FROM form_submissions submission
      LEFT JOIN forms form ON form.id = submission."formId"
      WHERE form.id IS NULL OR submission."tenantId" <> form."tenantId"
      LIMIT 10
    `);
    if (mismatches.length > 0) {
      throw new Error('Cannot enforce Forms tenant scope: tenant-mismatched form submissions require resolution');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE form_submissions
      DROP CONSTRAINT IF EXISTS "FK_form_submissions_tenant_form"
    `);
    await queryRunner.query(`
      ALTER TABLE form_submissions
      ADD CONSTRAINT "FK_6bb44ead8acd515f1333e5309bf"
      FOREIGN KEY ("formId") REFERENCES forms(id)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_forms_tenant_id"');
    await queryRunner.query('ALTER TABLE forms DROP CONSTRAINT IF EXISTS "CK_forms_status"');
  }
}
