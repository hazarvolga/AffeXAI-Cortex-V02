import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreatePageTemplatesTable1729360000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'page_templates',
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
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'design_system',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'blocks',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'layout_options',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'preview',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'constraints',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'usage_count',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'is_featured',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'author_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Add foreign key for authorId
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
      'page_templates',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes for better query performance
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'page_templates',
      new TableIndex({
        name: 'idx_page_templates_category',
        columnNames: ['category'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'page_templates',
      new TableIndex({
        name: 'idx_page_templates_is_featured',
        columnNames: ['is_featured'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'page_templates',
      new TableIndex({
        name: 'idx_page_templates_is_active',
        columnNames: ['is_active'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'page_templates',
      new TableIndex({
        name: 'idx_page_templates_author_id',
        columnNames: ['author_id'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'page_templates',
      new TableIndex({
        name: 'idx_page_templates_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_page_templates_created_at;
      DROP INDEX IF EXISTS idx_page_templates_author_id;
      DROP INDEX IF EXISTS idx_page_templates_is_active;
      DROP INDEX IF EXISTS idx_page_templates_is_featured;
      DROP INDEX IF EXISTS idx_page_templates_category;
    `);

    // Drop table (foreign keys are dropped automatically)
    await queryRunner.dropTable('page_templates');
  }
}
