import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { MigrationHelpers } from '../utils/migration-helpers';

export class AddMediaTable1728000000007 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await MigrationHelpers.createTableIfNotExists(queryRunner, new Table({
            name: 'media',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'uuid',
                },
                {
                    name: 'file_name',
                    type: 'varchar',
                },
                {
                    name: 'original_name',
                    type: 'varchar',
                },
                {
                    name: 'mime_type',
                    type: 'varchar',
                },
                {
                    name: 'size',
                    type: 'int',
                },
                {
                    name: 'url',
                    type: 'varchar',
                },
                {
                    name: 'key',
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('media');
    }

}
