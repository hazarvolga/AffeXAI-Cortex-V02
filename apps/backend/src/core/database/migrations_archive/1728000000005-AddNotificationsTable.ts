import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";
import { MigrationHelpers } from '../utils/migration-helpers';

export class AddNotificationsTable1728000000005 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await MigrationHelpers.createTableIfNotExists(queryRunner, new Table({
            name: 'notifications',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'uuid',
                },
                {
                    name: 'message',
                    type: 'varchar',
                },
                {
                    name: 'type',
                    type: 'varchar',
                },
                {
                    name: 'is_read',
                    type: 'boolean',
                    default: false,
                },
                {
                    name: 'user_id',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'metadata',
                    type: 'jsonb',
                    isNullable: true,
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'now()',
                },
                {
                    name: 'updated_at',
                    type: 'timestamp',
                    default: 'now()',
                },
            ],
        }), true);

        await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 'notifications', new TableForeignKey({
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('notifications');
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('user_id') !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey('notifications', foreignKey);
            }
        }
        await queryRunner.dropTable('notifications');
    }

}
