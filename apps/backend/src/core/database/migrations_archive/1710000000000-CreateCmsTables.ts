import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCmsTables1710000000000 implements MigrationInterface {
    name = 'CreateCmsTables1710000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum only if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."cms_pages_status_enum" AS ENUM('draft', 'published', 'archived');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cms_pages" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "title" character varying(255) NOT NULL,
            "slug" character varying(255) NOT NULL,
            "description" text,
            "status" "public"."cms_pages_status_enum" NOT NULL DEFAULT 'draft',
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "published_at" TIMESTAMP,
            "created_by" uuid,
            "updated_by" uuid,
            CONSTRAINT "UQ_cms_pages_slug" UNIQUE ("slug"),
            CONSTRAINT "PK_cms_pages_id" PRIMARY KEY ("id")
        )`);
        
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."cms_components_type_enum" AS ENUM('text', 'button', 'image', 'container', 'card', 'grid', 'block');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cms_components" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "page_id" uuid NOT NULL,
            "parent_id" uuid,
            "type" "public"."cms_components_type_enum" NOT NULL,
            "props" jsonb NOT NULL,
            "order_index" integer NOT NULL DEFAULT 0,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_cms_components_id" PRIMARY KEY ("id")
        )`);
        
        await queryRunner.query(`CREATE INDEX "IDX_cms_components_page_id" ON "cms_components" ("page_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_cms_components_parent_id" ON "cms_components" ("parent_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_cms_components_order_index" ON "cms_components" ("order_index")`);
        
        await queryRunner.query(`ALTER TABLE "cms_components" ADD CONSTRAINT "FK_cms_components_page_id" FOREIGN KEY ("page_id") REFERENCES "cms_pages"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "cms_components" ADD CONSTRAINT "FK_cms_components_parent_id" FOREIGN KEY ("parent_id") REFERENCES "cms_components"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cms_components" DROP CONSTRAINT "FK_cms_components_parent_id"`);
        await queryRunner.query(`ALTER TABLE "cms_components" DROP CONSTRAINT "FK_cms_components_page_id"`);
        
        await queryRunner.query(`DROP INDEX "IDX_cms_components_order_index"`);
        await queryRunner.query(`DROP INDEX "IDX_cms_components_parent_id"`);
        await queryRunner.query(`DROP INDEX "IDX_cms_components_page_id"`);
        
        await queryRunner.query(`DROP TABLE "cms_components"`);
        await queryRunner.query(`DROP TYPE "public"."cms_components_type_enum"`);
        
        await queryRunner.query(`DROP TABLE "cms_pages"`);
        await queryRunner.query(`DROP TYPE "public"."cms_pages_status_enum"`);
    }
}