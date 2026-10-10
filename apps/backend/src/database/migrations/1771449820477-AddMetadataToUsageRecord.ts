import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddMetadataToUsageRecord1771449820477 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists first to avoid errors
        const table = await queryRunner.getTable("usage_records");
        const column = table.findColumnByName("metadata");

        if (!column) {
            await queryRunner.addColumn("usage_records", new TableColumn({
                name: "metadata",
                type: "jsonb",
                isNullable: true
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("usage_records", "metadata");
    }

}
