import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCmsCategoriesAndMenus1728662494000 implements MigrationInterface {
  name = 'AddCmsCategoriesAndMenus1728662494000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add layout_options column to cms_pages if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "cms_pages" ADD COLUMN "layout_options" jsonb;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // Create cms_categories table
    await queryRunner.query(`
      CREATE TABLE "cms_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "parent_id" uuid,
        "order_index" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_cms_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_cms_categories_id" PRIMARY KEY ("id")
      )
    `);

    // Add indexes for cms_categories
    await queryRunner.query(`
      CREATE INDEX "IDX_cms_categories_parent_id" ON "cms_categories" ("parent_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_cms_categories_order_index" ON "cms_categories" ("order_index")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_cms_categories_is_active" ON "cms_categories" ("is_active")
    `);

    // Add foreign key for parent_id in cms_categories
    await queryRunner.query(`
      ALTER TABLE "cms_categories" 
      ADD CONSTRAINT "FK_cms_categories_parent_id" 
      FOREIGN KEY ("parent_id") 
      REFERENCES "cms_categories"("id") 
      ON DELETE SET NULL
    `);

    // Add category_id column to cms_pages
    await queryRunner.query(`
      ALTER TABLE "cms_pages" 
      ADD COLUMN "category_id" uuid
    `);

    // Add index and foreign key for category_id in cms_pages
    await queryRunner.query(`
      CREATE INDEX "IDX_cms_pages_category_id" ON "cms_pages" ("category_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "cms_pages" 
      ADD CONSTRAINT "FK_cms_pages_category_id" 
      FOREIGN KEY ("category_id") 
      REFERENCES "cms_categories"("id") 
      ON DELETE SET NULL
    `);

    // Create menu location enum
    await queryRunner.query(`
      CREATE TYPE "public"."cms_menus_location_enum" AS ENUM('header', 'footer', 'sidebar', 'mobile')
    `);

    // Create cms_menus table
    await queryRunner.query(`
      CREATE TABLE "cms_menus" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "location" "public"."cms_menus_location_enum" NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_cms_menus_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_cms_menus_id" PRIMARY KEY ("id")
      )
    `);

    // Add indexes for cms_menus
    await queryRunner.query(`
      CREATE INDEX "IDX_cms_menus_location" ON "cms_menus" ("location")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_cms_menus_is_active" ON "cms_menus" ("is_active")
    `);

    // Create menu item type enum
    await queryRunner.query(`
      CREATE TYPE "public"."cms_menu_items_type_enum" AS ENUM('link', 'page', 'category', 'dropdown', 'mega-menu', 'custom')
    `);

    // Create cms_menu_items table
    await queryRunner.query(`
      CREATE TABLE "cms_menu_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "menu_id" uuid NOT NULL,
        "parent_id" uuid,
        "type" "public"."cms_menu_items_type_enum" NOT NULL,
        "label" character varying(255) NOT NULL,
        "url" character varying(500),
        "page_id" uuid,
        "category_id" uuid,
        "target" character varying(50),
        "icon" character varying(100),
        "css_class" character varying(255),
        "order_index" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cms_menu_items_id" PRIMARY KEY ("id")
      )
    `);

    // Add indexes for cms_menu_items
    await queryRunner.query(`
      CREATE INDEX "IDX_cms_menu_items_menu_id" ON "cms_menu_items" ("menu_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_cms_menu_items_parent_id" ON "cms_menu_items" ("parent_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_cms_menu_items_order_index" ON "cms_menu_items" ("order_index")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_cms_menu_items_is_active" ON "cms_menu_items" ("is_active")
    `);

    // Add foreign keys for cms_menu_items
    await queryRunner.query(`
      ALTER TABLE "cms_menu_items" 
      ADD CONSTRAINT "FK_cms_menu_items_menu_id" 
      FOREIGN KEY ("menu_id") 
      REFERENCES "cms_menus"("id") 
      ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "cms_menu_items" 
      ADD CONSTRAINT "FK_cms_menu_items_parent_id" 
      FOREIGN KEY ("parent_id") 
      REFERENCES "cms_menu_items"("id") 
      ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "cms_menu_items" 
      ADD CONSTRAINT "FK_cms_menu_items_page_id" 
      FOREIGN KEY ("page_id") 
      REFERENCES "cms_pages"("id") 
      ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "cms_menu_items" 
      ADD CONSTRAINT "FK_cms_menu_items_category_id" 
      FOREIGN KEY ("category_id") 
      REFERENCES "cms_categories"("id") 
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop cms_menu_items foreign keys
    await queryRunner.query(`
      ALTER TABLE "cms_menu_items" DROP CONSTRAINT "FK_cms_menu_items_category_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "cms_menu_items" DROP CONSTRAINT "FK_cms_menu_items_page_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "cms_menu_items" DROP CONSTRAINT "FK_cms_menu_items_parent_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "cms_menu_items" DROP CONSTRAINT "FK_cms_menu_items_menu_id"
    `);

    // Drop cms_menu_items indexes
    await queryRunner.query(`DROP INDEX "IDX_cms_menu_items_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_cms_menu_items_order_index"`);
    await queryRunner.query(`DROP INDEX "IDX_cms_menu_items_parent_id"`);
    await queryRunner.query(`DROP INDEX "IDX_cms_menu_items_menu_id"`);

    // Drop cms_menu_items table and enum
    await queryRunner.query(`DROP TABLE "cms_menu_items"`);
    await queryRunner.query(`DROP TYPE "public"."cms_menu_items_type_enum"`);

    // Drop cms_menus indexes
    await queryRunner.query(`DROP INDEX "IDX_cms_menus_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_cms_menus_location"`);

    // Drop cms_menus table and enum
    await queryRunner.query(`DROP TABLE "cms_menus"`);
    await queryRunner.query(`DROP TYPE "public"."cms_menus_location_enum"`);

    // Drop cms_pages category_id column and constraints
    await queryRunner.query(`
      ALTER TABLE "cms_pages" DROP CONSTRAINT "FK_cms_pages_category_id"
    `);
    await queryRunner.query(`DROP INDEX "IDX_cms_pages_category_id"`);
    await queryRunner.query(`ALTER TABLE "cms_pages" DROP COLUMN "category_id"`);

    // Drop cms_categories table and constraints
    await queryRunner.query(`
      ALTER TABLE "cms_categories" DROP CONSTRAINT "FK_cms_categories_parent_id"
    `);
    await queryRunner.query(`DROP INDEX "IDX_cms_categories_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_cms_categories_order_index"`);
    await queryRunner.query(`DROP INDEX "IDX_cms_categories_parent_id"`);
    await queryRunner.query(`DROP TABLE "cms_categories"`);

    // Drop cms_pages layout_options column
    await queryRunner.query(`ALTER TABLE "cms_pages" DROP COLUMN "layout_options"`);
  }
}
