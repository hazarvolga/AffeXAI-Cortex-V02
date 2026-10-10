import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateSettingsTable1728000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await MigrationHelpers.createTableIfNotExists(queryRunner, 
      new Table({
        name: 'settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'value',
            type: 'text',
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
        indices: [
          {
            name: '_i_d_x_settings_category_key',
            columnNames: ['category', 'key'],
            isUnique: true,
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('settings');
  }
}