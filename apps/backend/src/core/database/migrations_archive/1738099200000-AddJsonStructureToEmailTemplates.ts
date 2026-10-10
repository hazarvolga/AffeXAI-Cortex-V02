import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJsonStructureToEmailTemplates1738099200000 implements MigrationInterface {
  name = 'AddJsonStructureToEmailTemplates1738099200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new JSONB columns for email builder
    await queryRunner.query(`
      ALTER TABLE "email_templates"
      ADD COLUMN "structure" JSONB,
      ADD COLUMN "compiled_html" TEXT,
      ADD COLUMN "compiled_mjml" TEXT,
      ADD COLUMN "version" INTEGER DEFAULT 1,
      ADD COLUMN "created_from" VARCHAR(255),
      ADD COLUMN "is_editable" BOOLEAN DEFAULT true
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_email_templates_created_from"
      ON "email_templates"("created_from")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_email_templates_is_editable"
      ON "email_templates"("is_editable")
    `);

    // Migrate existing HTML content to structure (basic conversion)
    // This will convert existing HTML templates to a simple text block structure
    await queryRunner.query(`
      UPDATE "email_templates"
      SET "structure" = jsonb_build_object(
        'rows', jsonb_build_array(
          jsonb_build_object(
            'id', gen_random_uuid()::text,
            'type', 'section',
            'columns', jsonb_build_array(
              jsonb_build_object(
                'id', gen_random_uuid()::text,
                'width', '100%',
                'blocks', jsonb_build_array(
                  jsonb_build_object(
                    'id', gen_random_uuid()::text,
                    'type', 'html',
                    'properties', jsonb_build_object(
                      'html', "content"
                    ),
                    'styles', jsonb_build_object()
                  )
                )
              )
            ),
            'settings', jsonb_build_object()
          )
        ),
        'settings', jsonb_build_object(
          'backgroundColor', '#f5f5f5',
          'contentWidth', '600px',
          'fonts', jsonb_build_array()
        )
      ),
      "compiled_html" = "content",
      "is_editable" = false,
      "version" = 1
      WHERE "content" IS NOT NULL AND "structure" IS NULL
    `);

    // Mark file-based templates as non-editable
    await queryRunner.query(`
      UPDATE "email_templates"
      SET "is_editable" = false
      WHERE "file_template_name" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_email_templates_is_editable"`);
    await queryRunner.query(`DROP INDEX "IDX_email_templates_created_from"`);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "email_templates"
      DROP COLUMN "structure",
      DROP COLUMN "compiled_html",
      DROP COLUMN "compiled_mjml",
      DROP COLUMN "version",
      DROP COLUMN "created_from",
      DROP COLUMN "is_editable"
    `);
  }
}
