import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateKnowledgeBaseCategoriesTable1728000000023 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create knowledge_base_categories table
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'knowledge_base_categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
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
            name: 'slug',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '50',
            default: "'blue'",
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '50',
            default: "'folder'",
          },
          {
            name: 'sort_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'article_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'updated_by',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'NOW()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Add self-referencing foreign key for parent category
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
      'knowledge_base_categories',
      new TableForeignKey({
        columnNames: ['parent_id'],
        referencedTableName: 'knowledge_base_categories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_kb_categories_parent',
      }),
    );

    // Add foreign keys for audit fields
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
      'knowledge_base_categories',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_kb_categories_created_by',
      }),
    );

    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
      'knowledge_base_categories',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_kb_categories_updated_by',
      }),
    );

    // Create indexes for better query performance
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_categories',
      new TableIndex({
        name: 'idx_kb_categories_slug',
        columnNames: ['slug'],
        isUnique: true,
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_categories',
      new TableIndex({
        name: 'idx_kb_categories_parent',
        columnNames: ['parent_id'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_categories',
      new TableIndex({
        name: 'idx_kb_categories_active',
        columnNames: ['is_active'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_categories',
      new TableIndex({
        name: 'idx_kb_categories_sort',
        columnNames: ['sort_order'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_categories',
      new TableIndex({
        name: 'idx_kb_categories_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Create composite index for parent-child queries with sorting
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_categories',
      new TableIndex({
        name: 'idx_kb_categories_parent_sort_active',
        columnNames: ['parent_id', 'sort_order', 'is_active'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('knowledge_base_categories', 'idx_kb_categories_parent_sort_active');
    await queryRunner.dropIndex('knowledge_base_categories', 'idx_kb_categories_created_at');
    await queryRunner.dropIndex('knowledge_base_categories', 'idx_kb_categories_sort');
    await queryRunner.dropIndex('knowledge_base_categories', 'idx_kb_categories_active');
    await queryRunner.dropIndex('knowledge_base_categories', 'idx_kb_categories_parent');
    await queryRunner.dropIndex('knowledge_base_categories', 'idx_kb_categories_slug');

    // Drop foreign keys
    await queryRunner.dropForeignKey('knowledge_base_categories', 'fk_kb_categories_updated_by');
    await queryRunner.dropForeignKey('knowledge_base_categories', 'fk_kb_categories_created_by');
    await queryRunner.dropForeignKey('knowledge_base_categories', 'fk_kb_categories_parent');

    // Drop table
    await queryRunner.dropTable('knowledge_base_categories');
  }
}