import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlockToComponentType1728000000012 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add 'block' to the cms_components_type_enum if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TYPE "public"."cms_components_type_enum" ADD VALUE 'block';
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing values from enums directly
        // To rollback, we would need to recreate the enum without 'block'
        // This is a complex operation and generally not recommended
        // In practice, we would leave the enum value in place
    }

}
