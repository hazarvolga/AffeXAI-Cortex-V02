import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailBlockLibrary1738099300000 implements MigrationInterface {
  name = 'CreateEmailBlockLibrary1738099300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create block category enum
    await queryRunner.query(`
      CREATE TYPE "email_block_library_category_enum" AS ENUM (
        'structure',
        'content',
        'media',
        'social',
        'ecommerce',
        'interactive',
        'special'
      )
    `);

    // Create block type enum
    await queryRunner.query(`
      CREATE TYPE "email_block_library_type_enum" AS ENUM (
        'one_column',
        'two_column',
        'three_column',
        'two_column_sidebar',
        'spacer',
        'divider',
        'heading',
        'text',
        'button',
        'list',
        'quote',
        'image',
        'image_text',
        'image_group',
        'video',
        'icon',
        'social_links',
        'social_share',
        'social_follow',
        'product',
        'product_grid',
        'pricing_table',
        'coupon',
        'countdown',
        'rating',
        'progress_bar',
        'accordion',
        'header',
        'footer',
        'html_code',
        'navigation',
        'menu',
        'logo',
        'survey',
        'form'
      )
    `);

    // Create email_block_library table
    await queryRunner.query(`
      CREATE TABLE "email_block_library" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" "email_block_library_type_enum" NOT NULL,
        "category" "email_block_library_category_enum" NOT NULL,
        "label" VARCHAR NOT NULL,
        "description" TEXT,
        "icon" VARCHAR,
        "default_properties" JSONB NOT NULL,
        "default_styles" JSONB NOT NULL,
        "preview_html" TEXT,
        "thumbnail_url" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_email_block_library_category"
      ON "email_block_library"("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_email_block_library_type"
      ON "email_block_library"("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_email_block_library_is_active"
      ON "email_block_library"("is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_email_block_library_sort_order"
      ON "email_block_library"("sort_order")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_email_block_library_sort_order"`);
    await queryRunner.query(`DROP INDEX "IDX_email_block_library_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_email_block_library_type"`);
    await queryRunner.query(`DROP INDEX "IDX_email_block_library_category"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "email_block_library"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "email_block_library_type_enum"`);
    await queryRunner.query(`DROP TYPE "email_block_library_category_enum"`);
  }
}
