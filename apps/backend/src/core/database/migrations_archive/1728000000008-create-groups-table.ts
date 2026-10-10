import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateGroupsTable1728000000008 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await MigrationHelpers.createTableIfNotExists(queryRunner, new Table({
            name: 'groups',
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
                    length: '255',
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'subscriber_count',
                    type: 'int',
                    default: 0,
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('groups');
    }
}