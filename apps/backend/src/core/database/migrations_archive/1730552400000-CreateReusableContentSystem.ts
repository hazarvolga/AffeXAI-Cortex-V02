import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReusableContentSystem1730552400000 implements MigrationInterface {
  name = 'CreateReusableContentSystem1730552400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create reusable_components table
    await queryRunner.query(`
      CREATE TABLE "reusable_components" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "component_type" VARCHAR(100) NOT NULL,
        "block_type" VARCHAR(100),
        "block_category" VARCHAR(100),
        "props" JSONB NOT NULL DEFAULT '{}',
        "tags" TEXT[] DEFAULT '{}',
        "category_id" UUID,
        "design_tokens" JSONB,
        "thumbnail_url" TEXT,
        "author_id" UUID,
        "is_public" BOOLEAN NOT NULL DEFAULT false,
        "is_featured" BOOLEAN NOT NULL DEFAULT false,
        "usage_count" INTEGER NOT NULL DEFAULT 0,
        "version" INTEGER NOT NULL DEFAULT 1,
        "parent_version_id" UUID,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_reusable_components" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reusable_components_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_reusable_components_category" FOREIGN KEY ("category_id") REFERENCES "cms_categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_reusable_components_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_reusable_components_parent" FOREIGN KEY ("parent_version_id") REFERENCES "reusable_components"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes for reusable_components
    await queryRunner.query(`CREATE INDEX "IDX_reusable_components_slug" ON "reusable_components" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_reusable_components_type" ON "reusable_components" ("component_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_reusable_components_category" ON "reusable_components" ("category_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reusable_components_author" ON "reusable_components" ("author_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reusable_components_public" ON "reusable_components" ("is_public")`);
    await queryRunner.query(`CREATE INDEX "IDX_reusable_components_featured" ON "reusable_components" ("is_featured")`);
    await queryRunner.query(`CREATE INDEX "IDX_reusable_components_usage" ON "reusable_components" ("usage_count")`);
    await queryRunner.query(`CREATE INDEX "IDX_reusable_components_tags" ON "reusable_components" USING GIN ("tags")`);

    // 2. Create reusable_sections table
    await queryRunner.query(`
      CREATE TABLE "reusable_sections" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) NOT NULL,
        "slug" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "section_type" VARCHAR(50) NOT NULL,
        "tags" TEXT[] DEFAULT '{}',
        "category_id" UUID,
        "design_system" JSONB,
        "layout_options" JSONB,
        "constraints" JSONB,
        "thumbnail_url" TEXT,
        "preview_config" JSONB,
        "author_id" UUID,
        "is_public" BOOLEAN NOT NULL DEFAULT false,
        "is_featured" BOOLEAN NOT NULL DEFAULT false,
        "usage_count" INTEGER NOT NULL DEFAULT 0,
        "version" INTEGER NOT NULL DEFAULT 1,
        "parent_version_id" UUID,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_reusable_sections" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reusable_sections_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_reusable_sections_category" FOREIGN KEY ("category_id") REFERENCES "cms_categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_reusable_sections_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_reusable_sections_parent" FOREIGN KEY ("parent_version_id") REFERENCES "reusable_sections"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes for reusable_sections
    await queryRunner.query(`CREATE INDEX "IDX_reusable_sections_slug" ON "reusable_sections" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_reusable_sections_type" ON "reusable_sections" ("section_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_reusable_sections_category" ON "reusable_sections" ("category_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reusable_sections_author" ON "reusable_sections" ("author_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reusable_sections_public" ON "reusable_sections" ("is_public")`);
    await queryRunner.query(`CREATE INDEX "IDX_reusable_sections_featured" ON "reusable_sections" ("is_featured")`);
    await queryRunner.query(`CREATE INDEX "IDX_reusable_sections_tags" ON "reusable_sections" USING GIN ("tags")`);

    // 3. Create section_components table
    await queryRunner.query(`
      CREATE TABLE "section_components" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "section_id" UUID NOT NULL,
        "reusable_component_id" UUID,
        "component_type" VARCHAR(100),
        "block_type" VARCHAR(100),
        "props" JSONB DEFAULT '{}',
        "parent_id" UUID,
        "order_index" INTEGER NOT NULL DEFAULT 0,
        "layout_props" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_section_components" PRIMARY KEY ("id"),
        CONSTRAINT "FK_section_components_section" FOREIGN KEY ("section_id") REFERENCES "reusable_sections"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_section_components_reusable" FOREIGN KEY ("reusable_component_id") REFERENCES "reusable_components"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_section_components_parent" FOREIGN KEY ("parent_id") REFERENCES "section_components"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for section_components
    await queryRunner.query(`CREATE INDEX "IDX_section_components_section" ON "section_components" ("section_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_section_components_reusable" ON "section_components" ("reusable_component_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_section_components_parent" ON "section_components" ("parent_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_section_components_order" ON "section_components" ("section_id", "order_index")`);

    // 4. Create component_favorites table
    await queryRunner.query(`
      CREATE TABLE "component_favorites" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL,
        "favoritable_type" VARCHAR(50) NOT NULL,
        "favoritable_id" UUID NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_component_favorites" PRIMARY KEY ("id"),
        CONSTRAINT "FK_component_favorites_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_component_favorites" UNIQUE ("user_id", "favoritable_type", "favoritable_id")
      )
    `);

    // Create indexes for component_favorites
    await queryRunner.query(`CREATE INDEX "IDX_component_favorites_user" ON "component_favorites" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_component_favorites_type_id" ON "component_favorites" ("favoritable_type", "favoritable_id")`);

    // 5. Create component_usage_history table
    await queryRunner.query(`
      CREATE TABLE "component_usage_history" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "usable_type" VARCHAR(50) NOT NULL,
        "usable_id" UUID NOT NULL,
        "used_in_type" VARCHAR(50) NOT NULL,
        "used_in_id" UUID NOT NULL,
        "user_id" UUID,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_component_usage_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_component_usage_history_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes for component_usage_history
    await queryRunner.query(`CREATE INDEX "IDX_usage_history_usable" ON "component_usage_history" ("usable_type", "usable_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_usage_history_used_in" ON "component_usage_history" ("used_in_type", "used_in_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_usage_history_user" ON "component_usage_history" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_usage_history_created" ON "component_usage_history" ("created_at")`);

    // 6. Alter cms_components table to add reusable component reference
    await queryRunner.query(`ALTER TABLE "cms_components" ADD COLUMN "reusable_component_id" UUID`);
    await queryRunner.query(`ALTER TABLE "cms_components" ADD COLUMN "is_instance_of_reusable" BOOLEAN DEFAULT false`);
    await queryRunner.query(`
      ALTER TABLE "cms_components"
      ADD CONSTRAINT "FK_cms_components_reusable"
      FOREIGN KEY ("reusable_component_id")
      REFERENCES "reusable_components"("id")
      ON DELETE SET NULL
    `);
    await queryRunner.query(`CREATE INDEX "IDX_cms_components_reusable" ON "cms_components" ("reusable_component_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_cms_components_is_instance" ON "cms_components" ("is_instance_of_reusable")`);

    // 7. Alter page_templates table to add section support
    await queryRunner.query(`ALTER TABLE "page_templates" ADD COLUMN "uses_sections" BOOLEAN DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "page_templates" ADD COLUMN "section_ids" UUID[]`);
    await queryRunner.query(`CREATE INDEX "IDX_page_templates_uses_sections" ON "page_templates" ("uses_sections")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes and columns from existing tables first
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_page_templates_uses_sections"`);
    await queryRunner.query(`ALTER TABLE "page_templates" DROP COLUMN IF EXISTS "section_ids"`);
    await queryRunner.query(`ALTER TABLE "page_templates" DROP COLUMN IF EXISTS "uses_sections"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cms_components_is_instance"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cms_components_reusable"`);
    await queryRunner.query(`ALTER TABLE "cms_components" DROP CONSTRAINT IF EXISTS "FK_cms_components_reusable"`);
    await queryRunner.query(`ALTER TABLE "cms_components" DROP COLUMN IF EXISTS "is_instance_of_reusable"`);
    await queryRunner.query(`ALTER TABLE "cms_components" DROP COLUMN IF EXISTS "reusable_component_id"`);

    // Drop new tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "component_usage_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "component_favorites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "section_components"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reusable_sections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reusable_components"`);
  }
}
