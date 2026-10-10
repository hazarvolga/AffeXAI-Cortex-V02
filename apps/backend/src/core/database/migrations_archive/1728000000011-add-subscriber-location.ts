import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";
import { MigrationHelpers } from '../utils/migration-helpers';

export class AddSubscriberLocation1728000000011 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('subscribers');

        // Check and add location column
        if (!table?.findColumnByName('location')) {
            await MigrationHelpers.addColumnIfNotExists(queryRunner, 'subscribers', new TableColumn({
                name: 'location',
                type: 'varchar',
                isNullable: true,
                length: '10',
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('subscribers');

        if (table?.findColumnByName('location')) {
            await queryRunner.dropColumn('subscribers', 'location');
        }
    }
}