import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsureSettingsUniqueIndex1740000000005 implements MigrationInterface {
    name = 'EnsureSettingsUniqueIndex1740000000005';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the index already exists to avoid errors
        const table = await queryRunner.getTable("settings");
        const indexExists = table?.indices.some(idx => idx.name === "IDX_settings_category_key");

        if (!indexExists) {
            await queryRunner.query(`
                CREATE UNIQUE INDEX "IDX_settings_category_key" 
                ON "settings" ("category", "key")
            `);
            console.log('✅ Created missing unique index IDX_settings_category_key');
        } else {
            console.log('ℹ️ Index IDX_settings_category_key already exists');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_settings_category_key"`);
    }
}
