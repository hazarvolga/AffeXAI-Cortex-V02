import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateKnowledgeBaseArticlesTable1728000000024 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create knowledge_base_articles table
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'knowledge_base_articles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'summary',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '500',
            isUnique: true,
          },
          {
            name: 'category_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'author_id',
            type: 'uuid',
          },
          {
            name: 'tags',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_published',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_featured',
            type: 'boolean',
            default: false,
          },
          {
            name: 'view_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'helpful_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'not_helpful_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'search_score',
            type: 'integer',
            default: 0,
          },
          {
            name: 'related_article_ids',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'draft'",
          },
          {
            name: 'published_at',
            type: 'timestamp with time zone',
            isNullable: true,
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
        ],
      }),
      true,
    );

    // Add foreign key for category
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
      'knowledge_base_articles',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedTableName: 'knowledge_base_categories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_kb_articles_category',
      }),
    );

    // Add foreign key for author
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
      'knowledge_base_articles',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_kb_articles_author',
      }),
    );

    // Create indexes for better query performance
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_articles',
      new TableIndex({
        name: 'idx_kb_articles_slug',
        columnNames: ['slug'],
        isUnique: true,
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_articles',
      new TableIndex({
        name: 'idx_kb_articles_category',
        columnNames: ['category_id'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_articles',
      new TableIndex({
        name: 'idx_kb_articles_author',
        columnNames: ['author_id'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_articles',
      new TableIndex({
        name: 'idx_kb_articles_published',
        columnNames: ['is_published'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_articles',
      new TableIndex({
        name: 'idx_kb_articles_status',
        columnNames: ['status'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_articles',
      new TableIndex({
        name: 'idx_kb_articles_created_at',
        columnNames: ['created_at'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_articles',
      new TableIndex({
        name: 'idx_kb_articles_published_at',
        columnNames: ['published_at'],
      }),
    );

    // Create composite index for published articles by category
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'knowledge_base_articles',
      new TableIndex({
        name: 'idx_kb_articles_category_published',
        columnNames: ['category_id', 'is_published', 'published_at'],
      }),
    );

    // Create full-text search index for title and content
    await queryRunner.query(`
      CREATE INDEX idx_kb_articles_search 
      ON knowledge_base_articles 
      USING gin(to_tsvector('english', title || ' ' || content));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop full-text search index
    await queryRunner.dropIndex('knowledge_base_articles', 'idx_kb_articles_search');

    // Drop indexes
    await queryRunner.dropIndex('knowledge_base_articles', 'idx_kb_articles_category_published');
    await queryRunner.dropIndex('knowledge_base_articles', 'idx_kb_articles_published_at');
    await queryRunner.dropIndex('knowledge_base_articles', 'idx_kb_articles_created_at');
    await queryRunner.dropIndex('knowledge_base_articles', 'idx_kb_articles_status');
    await queryRunner.dropIndex('knowledge_base_articles', 'idx_kb_articles_published');
    await queryRunner.dropIndex('knowledge_base_articles', 'idx_kb_articles_author');
    await queryRunner.dropIndex('knowledge_base_articles', 'idx_kb_articles_category');
    await queryRunner.dropIndex('knowledge_base_articles', 'idx_kb_articles_slug');

    // Drop foreign keys
    await queryRunner.dropForeignKey('knowledge_base_articles', 'fk_kb_articles_author');
    await queryRunner.dropForeignKey('knowledge_base_articles', 'fk_kb_articles_category');

    // Drop table
    await queryRunner.dropTable('knowledge_base_articles');
  }
}