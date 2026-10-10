import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateAnalyticsTables1729350000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // 1. Analytics Events Table
    // ========================================
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'analytics_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'component_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'component_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'interaction_type',
            type: 'enum',
            enum: ['click', 'hover', 'scroll', 'focus', 'input', 'submit', 'view', 'exit'],
            isNullable: false,
          },
          {
            name: 'session_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'page_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'device_type',
            type: 'enum',
            enum: ['mobile', 'tablet', 'desktop'],
            isNullable: false,
          },
          {
            name: 'browser',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'viewport_width',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'viewport_height',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'coordinate_x',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'coordinate_y',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'relative_x',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'relative_y',
            type: 'int',
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
        ],
      }),
      true,
    );

    // Indexes for analytics_events
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'analytics_events',
      new TableIndex({
        name: '_i_d_x_analytics_events_component',
        columnNames: ['component_id', 'component_type'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'analytics_events',
      new TableIndex({
        name: '_i_d_x_analytics_events_session',
        columnNames: ['session_id'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'analytics_events',
      new TableIndex({
        name: '_i_d_x_analytics_events_type_date',
        columnNames: ['interaction_type', 'created_at'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'analytics_events',
      new TableIndex({
        name: '_i_d_x_analytics_events_page_date',
        columnNames: ['page_url', 'created_at'],
      }),
    );

    // ========================================
    // 2. Analytics Sessions Table
    // ========================================
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'analytics_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'start_time',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'end_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'duration',
            type: 'int',
            isNullable: true,
            comment: 'Duration in milliseconds',
          },
          {
            name: 'pages_visited',
            type: 'jsonb',
            isNullable: false,
            default: "'[]'",
          },
          {
            name: 'total_interactions',
            type: 'int',
            default: 0,
          },
          {
            name: 'device_type',
            type: 'enum',
            enum: ['mobile', 'tablet', 'desktop'],
            isNullable: false,
          },
          {
            name: 'browser',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'os',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'converted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'conversion_goal',
            type: 'varchar',
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
      }),
      true,
    );

    // Indexes for analytics_sessions
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'analytics_sessions',
      new TableIndex({
        name: '_i_d_x_analytics_sessions_user',
        columnNames: ['user_id'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'analytics_sessions',
      new TableIndex({
        name: '_i_d_x_analytics_sessions_start_time',
        columnNames: ['start_time'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'analytics_sessions',
      new TableIndex({
        name: '_i_d_x_analytics_sessions_converted',
        columnNames: ['converted', 'conversion_goal'],
      }),
    );

    // ========================================
    // 3. Analytics Heatmaps Table
    // ========================================
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'analytics_heatmaps',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'component_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'component_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'page_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'period_start',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'period_end',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'points',
            type: 'jsonb',
            isNullable: false,
            comment: 'Array of {x, y, intensity, type}',
          },
          {
            name: 'dimension_width',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'dimension_height',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'total_interactions',
            type: 'int',
            default: 0,
          },
          {
            name: 'unique_users',
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
      }),
      true,
    );

    // Indexes for analytics_heatmaps
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'analytics_heatmaps',
      new TableIndex({
        name: '_i_d_x_analytics_heatmaps_component',
        columnNames: ['component_id', 'page_url'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'analytics_heatmaps',
      new TableIndex({
        name: '_i_d_x_analytics_heatmaps_period',
        columnNames: ['period_start', 'period_end'],
      }),
    );

    // ========================================
    // 4. A/B Tests Table
    // ========================================
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'ab_tests',
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
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'component_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'component_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'running', 'paused', 'completed'],
            default: "'draft'",
          },
          {
            name: 'period_start',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'period_end',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'conversion_goal',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'target_audience',
            type: 'jsonb',
            isNullable: true,
            comment: 'Countries, devices, user segments',
          },
          {
            name: 'winner_variant_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'confidence_level',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: 'Statistical confidence (0-100)',
          },
          {
            name: 'sample_size',
            type: 'int',
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
      }),
      true,
    );

    // Indexes for ab_tests
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'ab_tests',
      new TableIndex({
        name: '_i_d_x_ab_tests_component',
        columnNames: ['component_id'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'ab_tests',
      new TableIndex({
        name: '_i_d_x_ab_tests_status',
        columnNames: ['status'],
      }),
    );

    // ========================================
    // 5. A/B Test Variants Table
    // ========================================
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'ab_test_variants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'test_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'component_config',
            type: 'jsonb',
            isNullable: false,
            comment: 'Component configuration for this variant',
          },
          {
            name: 'traffic_allocation',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
            comment: 'Percentage of traffic (0-100)',
          },
          {
            name: 'impressions',
            type: 'int',
            default: 0,
          },
          {
            name: 'interactions',
            type: 'int',
            default: 0,
          },
          {
            name: 'conversions',
            type: 'int',
            default: 0,
          },
          {
            name: 'conversion_rate',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0,
            comment: 'Conversion rate (0-1)',
          },
          {
            name: 'average_engagement_time',
            type: 'int',
            default: 0,
            comment: 'Average engagement time in milliseconds',
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
      }),
      true,
    );

    // Foreign key for ab_test_variants
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
      'ab_test_variants',
      new TableForeignKey({
        columnNames: ['test_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ab_tests',
        onDelete: 'CASCADE',
      }),
    );

    // Index for ab_test_variants
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'ab_test_variants',
      new TableIndex({
        name: '_i_d_x_ab_test_variants_test',
        columnNames: ['test_id'],
      }),
    );

    // ========================================
    // 6. Component Performance Table
    // ========================================
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'component_performance',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'component_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'component_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'page_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'period_start',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'period_end',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'render_time_avg',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'render_time_min',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'render_time_max',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'render_time_p50',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'render_time_p95',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'render_time_p99',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'error_rate',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0,
          },
          {
            name: 'total_renders',
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
      }),
      true,
    );

    // Indexes for component_performance
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'component_performance',
      new TableIndex({
        name: '_i_d_x_component_performance_component',
        columnNames: ['component_id', 'page_url'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'component_performance',
      new TableIndex({
        name: '_i_d_x_component_performance_period',
        columnNames: ['period_start', 'period_end'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('component_performance');
    await queryRunner.dropTable('ab_test_variants');
    await queryRunner.dropTable('ab_tests');
    await queryRunner.dropTable('analytics_heatmaps');
    await queryRunner.dropTable('analytics_sessions');
    await queryRunner.dropTable('analytics_events');
  }
}
