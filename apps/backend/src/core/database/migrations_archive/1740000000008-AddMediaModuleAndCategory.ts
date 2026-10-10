import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaModuleAndCategory1740000000008 implements MigrationInterface {
  name = 'AddMediaModuleAndCategory1762400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create module enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."media_module_enum" AS ENUM(
          'site-settings',
          'cms',
          'certificates',
          'email-marketing',
          'tickets',
          'chat',
          'events',
          'users',
          'general'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create category enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."media_category_enum" AS ENUM(
          'logo',
          'favicon',
          'hero',
          'gallery',
          'banner',
          'thumbnail',
          'background',
          'icon',
          'signature',
          'certificate-template',
          'campaign',
          'email-header',
          'attachment',
          'avatar',
          'profile',
          'event-cover',
          'other'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add module column to media table
    await queryRunner.query(`
      ALTER TABLE "media"
      ADD COLUMN IF NOT EXISTS "module" "public"."media_module_enum" NOT NULL DEFAULT 'general'
    `);

    // Add category column to media table
    await queryRunner.query(`
      ALTER TABLE "media"
      ADD COLUMN IF NOT EXISTS "category" "public"."media_category_enum" NOT NULL DEFAULT 'other'
    `);

    // Add tags column to media table (simple text array stored as comma-separated)
    await queryRunner.query(`
      ALTER TABLE "media"
      ADD COLUMN IF NOT EXISTS "tags" text
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_media_module" ON "media" ("module")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_media_category" ON "media" ("category")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_media_module_category" ON "media" ("module", "category")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_module_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_module"`);

    // Drop columns
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN IF EXISTS "tags"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN IF EXISTS "category"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN IF EXISTS "module"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."media_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."media_module_enum"`);
  }
}
