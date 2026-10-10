import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";
import { MigrationHelpers } from '../utils/migration-helpers';

export class AddEventsTables1728000000006 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create events table
        await MigrationHelpers.createTableIfNotExists(queryRunner,
            new Table({
                name: 'events',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                    },
                    {
                        name: 'description',
                        type: 'text',
                    },
                    {
                        name: 'start_date',
                        type: 'timestamp',
                    },
                    {
                        name: 'end_date',
                        type: 'timestamp',
                    },
                    {
                        name: 'location',
                        type: 'varchar',
                    },
                    {
                        name: 'capacity',
                        type: 'int',
                    },
                    {
                        name: 'price',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        default: "'draft'",
                    },
                    {
                        name: 'created_by_id',
                        type: 'uuid',
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
                    {
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Create event_registrations table
        await MigrationHelpers.createTableIfNotExists(queryRunner,
            new Table({
                name: 'event_registrations',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                    },
                    {
                        name: 'event_id',
                        type: 'uuid',
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        default: "'pending'",
                    },
                    {
                        name: 'amount_paid',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: 'payment_details',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'checked_in_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'additional_info',
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
                    {
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Add foreign key constraints
        await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
            'events',
            new TableForeignKey({
                columnNames: ['created_by_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'SET NULL',
                name: '_f_k_events_created_by'
            }),
        );

        await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
            'event_registrations',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
                name: '_f_k_event_registrations_user'
            }),
        );

        await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
            'event_registrations',
            new TableForeignKey({
                columnNames: ['event_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'events',
                onDelete: 'CASCADE',
                name: '_f_k_event_registrations_event'
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        const table = await queryRunner.getTable('event_registrations');
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey('event_registrations', foreignKey);
            }
        }

        const eventsTable = await queryRunner.getTable('events');
        if (eventsTable) {
            const foreignKeys = eventsTable.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey('events', foreignKey);
            }
        }

        // Drop tables
        await queryRunner.dropTable('event_registrations', true);
        await queryRunner.dropTable('events', true);
    }

}