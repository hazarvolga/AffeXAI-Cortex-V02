import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateThemeSettings1736499600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await MigrationHelpers.createTableIfNotExists(queryRunner, 
      new Table({
        name: 'theme_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'header_config',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'header_menu_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'footer_config',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: '_i_d_x_theme_settings_active',
            columnNames: ['is_active'],
          },
          {
            name: '_i_d_x_theme_settings_header_menu_id',
            columnNames: ['header_menu_id'],
          },
        ],
      }),
      true,
    );

    // Add foreign key for header_menu_id
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 
      'theme_settings',
      new TableForeignKey({
        columnNames: ['header_menu_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cms_menus',
        onDelete: 'SET NULL',
      }),
    );

    // Add foreign key for created_by
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 
      'theme_settings',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Add foreign key for updated_by
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 
      'theme_settings',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('theme_settings');

    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('theme_settings', foreignKey);
      }
    }

    await queryRunner.dropTable('theme_settings');
  }
}
