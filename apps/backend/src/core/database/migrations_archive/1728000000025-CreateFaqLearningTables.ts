import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateFaqLearningTables1728000000025 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create learning_patterns table
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'learning_patterns',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'pattern_type',
            type: 'enum',
            enum: ['question', 'answer', 'context'],
          },
          {
            name: 'pattern',
            type: 'text',
          },
          {
            name: 'pattern_hash',
            type: 'varchar',
            length: '64',
            isUnique: true,
          },
          {
            name: 'frequency',
            type: 'integer',
            default: 1,
          },
          {
            name: 'confidence',
            type: 'integer',
            default: 50,
          },
          {
            name: 'keywords',
            type: 'text',
            isArray: true,
            default: 'ARRAY[]::text[]',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'sources',
            type: 'jsonb',
            default: "'[]'::jsonb",
          },
          {
            name: 'metadata',
            type: 'jsonb',
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
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create learned_faq_entries table
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'learned_faq_entries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'question',
            type: 'text',
          },
          {
            name: 'answer',
            type: 'text',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'confidence',
            type: 'integer',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'pending_review', 'approved', 'rejected', 'published'],
            default: "'draft'",
          },
          {
            name: 'source',
            type: 'enum',
            enum: ['chat', 'ticket'],
          },
          {
            name: 'source_id',
            type: 'uuid',
          },
          {
            name: 'keywords',
            type: 'text',
            isArray: true,
            default: 'ARRAY[]::text[]',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'usage_count',
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
            name: 'reviewed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'published_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'reviewed_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
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
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create faq_learning_config table
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'faq_learning_config',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'config_key',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'config_value',
            type: 'jsonb',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'category',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
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
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Add foreign keys for learned_faq_entries
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
      'learned_faq_entries',
      new TableForeignKey({
        columnNames: ['reviewed_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_learned_faq_entries_reviewed_by',
      }),
    );

    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
      'learned_faq_entries',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_learned_faq_entries_created_by',
      }),
    );

    // Add foreign key for faq_learning_config
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
      'faq_learning_config',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_faq_learning_config_updated_by',
      }),
    );

    // Create indexes for learning_patterns
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learning_patterns',
      new TableIndex({
        name: 'idx_learning_patterns_type',
        columnNames: ['pattern_type'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learning_patterns',
      new TableIndex({
        name: 'idx_learning_patterns_frequency',
        columnNames: ['frequency'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learning_patterns',
      new TableIndex({
        name: 'idx_learning_patterns_confidence',
        columnNames: ['confidence'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learning_patterns',
      new TableIndex({
        name: 'idx_learning_patterns_category',
        columnNames: ['category'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learning_patterns',
      new TableIndex({
        name: 'idx_learning_patterns_created_at',
        columnNames: ['created_at'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learning_patterns',
      new TableIndex({
        name: 'idx_learning_patterns_hash',
        columnNames: ['pattern_hash'],
        isUnique: true,
      }),
    );

    // Create indexes for learned_faq_entries
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learned_faq_entries',
      new TableIndex({
        name: 'idx_learned_faq_entries_status',
        columnNames: ['status'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learned_faq_entries',
      new TableIndex({
        name: 'idx_learned_faq_entries_source',
        columnNames: ['source'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learned_faq_entries',
      new TableIndex({
        name: 'idx_learned_faq_entries_category',
        columnNames: ['category'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learned_faq_entries',
      new TableIndex({
        name: 'idx_learned_faq_entries_confidence',
        columnNames: ['confidence'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learned_faq_entries',
      new TableIndex({
        name: 'idx_learned_faq_entries_created_at',
        columnNames: ['created_at'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learned_faq_entries',
      new TableIndex({
        name: 'idx_learned_faq_entries_source_id',
        columnNames: ['source_id'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learned_faq_entries',
      new TableIndex({
        name: 'idx_learned_faq_entries_usage_count',
        columnNames: ['usage_count'],
      }),
    );

    // Create indexes for faq_learning_config
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'faq_learning_config',
      new TableIndex({
        name: 'idx_faq_learning_config_key',
        columnNames: ['config_key'],
        isUnique: true,
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'faq_learning_config',
      new TableIndex({
        name: 'idx_faq_learning_config_updated_at',
        columnNames: ['updated_at'],
      }),
    );

    // Create composite indexes for better query performance
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learned_faq_entries',
      new TableIndex({
        name: 'idx_learned_faq_entries_status_confidence',
        columnNames: ['status', 'confidence'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learned_faq_entries',
      new TableIndex({
        name: 'idx_learned_faq_entries_source_status',
        columnNames: ['source', 'status'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'learning_patterns',
      new TableIndex({
        name: 'idx_learning_patterns_type_confidence',
        columnNames: ['pattern_type', 'confidence'],
      }),
    );

    // Create GIN indexes for JSONB columns for better search performance
    await queryRunner.query(`
      CREATE INDEX idx_learned_faq_entries_metadata_gin 
      ON learned_faq_entries USING GIN (metadata);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_learning_patterns_sources_gin 
      ON learning_patterns USING GIN (sources);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_learning_patterns_metadata_gin 
      ON learning_patterns USING GIN (metadata);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_faq_learning_config_value_gin 
      ON faq_learning_config USING GIN (config_value);
    `);

    // Create text search indexes for better full-text search
    await queryRunner.query(`
      CREATE INDEX idx_learned_faq_entries_question_text 
      ON learned_faq_entries USING GIN (to_tsvector('english', question));
    `);

    await queryRunner.query(`
      CREATE INDEX idx_learned_faq_entries_answer_text 
      ON learned_faq_entries USING GIN (to_tsvector('english', answer));
    `);

    await queryRunner.query(`
      CREATE INDEX idx_learning_patterns_pattern_text 
      ON learning_patterns USING GIN (to_tsvector('english', pattern));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop text search indexes
    await queryRunner.query('DROP INDEX IF EXISTS idx_learning_patterns_pattern_text');
    await queryRunner.query('DROP INDEX IF EXISTS idx_learned_faq_entries_answer_text');
    await queryRunner.query('DROP INDEX IF EXISTS idx_learned_faq_entries_question_text');

    // Drop GIN indexes
    await queryRunner.query('DROP INDEX IF EXISTS idx_faq_learning_config_value_gin');
    await queryRunner.query('DROP INDEX IF EXISTS idx_learning_patterns_metadata_gin');
    await queryRunner.query('DROP INDEX IF EXISTS idx_learning_patterns_sources_gin');
    await queryRunner.query('DROP INDEX IF EXISTS idx_learned_faq_entries_metadata_gin');

    // Drop composite indexes
    await queryRunner.dropIndex('learning_patterns', 'idx_learning_patterns_type_confidence');
    await queryRunner.dropIndex('learned_faq_entries', 'idx_learned_faq_entries_source_status');
    await queryRunner.dropIndex('learned_faq_entries', 'idx_learned_faq_entries_status_confidence');

    // Drop faq_learning_config indexes
    await queryRunner.dropIndex('faq_learning_config', 'idx_faq_learning_config_updated_at');
    await queryRunner.dropIndex('faq_learning_config', 'idx_faq_learning_config_key');

    // Drop learned_faq_entries indexes
    await queryRunner.dropIndex('learned_faq_entries', 'idx_learned_faq_entries_usage_count');
    await queryRunner.dropIndex('learned_faq_entries', 'idx_learned_faq_entries_source_id');
    await queryRunner.dropIndex('learned_faq_entries', 'idx_learned_faq_entries_created_at');
    await queryRunner.dropIndex('learned_faq_entries', 'idx_learned_faq_entries_confidence');
    await queryRunner.dropIndex('learned_faq_entries', 'idx_learned_faq_entries_category');
    await queryRunner.dropIndex('learned_faq_entries', 'idx_learned_faq_entries_source');
    await queryRunner.dropIndex('learned_faq_entries', 'idx_learned_faq_entries_status');

    // Drop learning_patterns indexes
    await queryRunner.dropIndex('learning_patterns', 'idx_learning_patterns_hash');
    await queryRunner.dropIndex('learning_patterns', 'idx_learning_patterns_created_at');
    await queryRunner.dropIndex('learning_patterns', 'idx_learning_patterns_category');
    await queryRunner.dropIndex('learning_patterns', 'idx_learning_patterns_confidence');
    await queryRunner.dropIndex('learning_patterns', 'idx_learning_patterns_frequency');
    await queryRunner.dropIndex('learning_patterns', 'idx_learning_patterns_type');

    // Drop foreign keys
    await queryRunner.dropForeignKey('faq_learning_config', 'fk_faq_learning_config_updated_by');
    await queryRunner.dropForeignKey('learned_faq_entries', 'fk_learned_faq_entries_created_by');
    await queryRunner.dropForeignKey('learned_faq_entries', 'fk_learned_faq_entries_reviewed_by');

    // Drop tables
    await queryRunner.dropTable('faq_learning_config');
    await queryRunner.dropTable('learned_faq_entries');
    await queryRunner.dropTable('learning_patterns');
  }
}