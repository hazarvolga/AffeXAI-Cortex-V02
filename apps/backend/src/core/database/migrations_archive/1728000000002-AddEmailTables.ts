import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";
import { MigrationHelpers } from '../utils/migration-helpers';

export class AddEmailTables1728000000002 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await MigrationHelpers.createTableIfNotExists(queryRunner, new Table({
            name: 'email_campaigns',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'uuid',
                },
                {
                    name: 'name',
                    type: 'varchar',
                },
                {
                    name: 'subject',
                    type: 'varchar',
                },
                {
                    name: 'content',
                    type: 'text',
                },
                {
                    name: 'status',
                    type: 'varchar',
                    default: `'draft'`,
                },
                {
                    name: 'scheduled_at',
                    type: 'timestamp',
                    isNullable: true,
                },
                {
                    name: 'sent_at',
                    type: 'timestamp',
                    isNullable: true,
                },
                {
                    name: 'total_recipients',
                    type: 'int',
                    default: 0,
                },
                {
                    name: 'sent_count',
                    type: 'int',
                    default: 0,
                },
                {
                    name: 'opened_count',
                    type: 'int',
                    default: 0,
                },
                {
                    name: 'clicked_count',
                    type: 'int',
                    default: 0,
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

        await MigrationHelpers.createTableIfNotExists(queryRunner, new Table({
            name: 'email_logs',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'uuid',
                },
                {
                    name: 'campaign_id',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'recipient_email',
                    type: 'varchar',
                },
                {
                    name: 'recipient_id',
                    type: 'varchar',
                    isNullable: true,
                },
                {
                    name: 'sent_at',
                    type: 'timestamp',
                    isNullable: true,
                },
                {
                    name: 'opened_at',
                    type: 'timestamp',
                    isNullable: true,
                },
                {
                    name: 'clicked_at',
                    type: 'timestamp',
                    isNullable: true,
                },
                {
                    name: 'tracking_id',
                    type: 'varchar',
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

        await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 'email_logs', new TableForeignKey({
            columnNames: ['campaign_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'email_campaigns',
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('email_logs');
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('campaign_id') !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey('email_logs', foreignKey);
            }
        }
        await queryRunner.dropTable('email_logs');
        await queryRunner.dropTable('email_campaigns');
    }

}
