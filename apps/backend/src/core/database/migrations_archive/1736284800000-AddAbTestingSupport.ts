import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class AddAbTestingSupport1736284800000 implements MigrationInterface {
  name = 'AddAbTestingSupport1736284800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create email_campaign_variants table
    await MigrationHelpers.createTableIfNotExists(queryRunner, 
      new Table({
        name: 'email_campaign_variants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'campaign_id',
            type: 'uuid',
          },
          {
            name: 'variant_label',
            type: 'varchar',
            length: '1',
            comment: 'A, B, C, D, or E',
          },
          // Variant Content
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'from_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'send_time_offset',
            type: 'int',
            isNullable: true,
            comment: 'Minutes offset from base send time',
          },
          // Configuration
          {
            name: 'split_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            comment: 'Percentage of recipients (0-100)',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'testing'",
            comment: 'testing, winner, loser, draft',
          },
          // Performance Metrics
          {
            name: 'sent_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'opened_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'clicked_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'conversion_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'revenue',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'bounce_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'unsubscribe_count',
            type: 'int',
            default: 0,
          },
          // Computed rates (will be calculated in application layer)
          {
            name: 'open_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: 'Calculated: (openedCount / sentCount) * 100',
          },
          {
            name: 'click_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: 'Calculated: (clickedCount / openedCount) * 100',
          },
          {
            name: 'conversion_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: 'Calculated: (conversionCount / clickedCount) * 100',
          },
          // Metadata
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
      }),
      true,
    );

    // 2. Add foreign key for campaign
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 
      'email_campaign_variants',
      new TableForeignKey({
        name: '_f_k_campaign_variants_campaign',
        columnNames: ['campaign_id'],
        referencedTableName: 'email_campaigns',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 3. Add unique constraint for variant per campaign
    await MigrationHelpers.createIndexIfNotExists(queryRunner, 
      'email_campaign_variants',
      new TableIndex({
        name: '_u_q_campaign_variant_label',
        columnNames: ['campaignId', 'variantLabel'],
        isUnique: true,
      }),
    );

    // 4. Add indexes for performance
    await MigrationHelpers.createIndexIfNotExists(queryRunner, 
      'email_campaign_variants',
      new TableIndex({
        name: '_i_d_x_campaign_variants_campaign',
        columnNames: ['campaign_id'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner, 
      'email_campaign_variants',
      new TableIndex({
        name: '_i_d_x_campaign_variants_status',
        columnNames: ['status'],
      }),
    );

    // 5. Extend email_campaigns table with A/B testing fields
    await queryRunner.addColumns('email_campaigns', [
      new TableColumn({
        name: 'is_ab_test',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'test_type',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'subject, content, send_time, from_name, combined',
      }),
      new TableColumn({
        name: 'winner_criteria',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'open_rate, click_rate, conversion_rate, revenue',
      }),
      new TableColumn({
        name: 'auto_select_winner',
        type: 'boolean',
        default: true,
      }),
      new TableColumn({
        name: 'winner_selection_date',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'selected_winner_id',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'test_duration',
        type: 'int',
        isNullable: true,
        comment: 'Duration in hours',
      }),
      new TableColumn({
        name: 'confidence_level',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 95.0,
        comment: '95%, 99%, etc.',
      }),
      new TableColumn({
        name: 'min_sample_size',
        type: 'int',
        default: 100,
        comment: 'Minimum sends per variant',
      }),
      new TableColumn({
        name: 'test_status',
        type: 'varchar',
        length: '20',
        default: "'draft'",
        comment: 'draft, testing, completed, winner_sent',
      }),
    ]);

    // 6. Add foreign key for selected winner
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 
      'email_campaigns',
      new TableForeignKey({
        name: '_f_k_campaign_selected_winner',
        columnNames: ['selected_winner_id'],
        referencedTableName: 'email_campaign_variants',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // 7. Add index for A/B test campaigns
    await MigrationHelpers.createIndexIfNotExists(queryRunner, 
      'email_campaigns',
      new TableIndex({
        name: '_i_d_x_ab_test_campaigns',
        columnNames: ['is_ab_test'],
        where: '"isAbTest" = true',
      }),
    );

    // 8. Add variant tracking to email_logs
    await MigrationHelpers.addColumnIfNotExists(queryRunner, 
      'email_logs',
      new TableColumn({
        name: 'variant_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // 9. Add foreign key for variant in email_logs
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 
      'email_logs',
      new TableForeignKey({
        name: '_f_k_email_log_variant',
        columnNames: ['variant_id'],
        referencedTableName: 'email_campaign_variants',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // 10. Add index for variant logs
    await MigrationHelpers.createIndexIfNotExists(queryRunner, 
      'email_logs',
      new TableIndex({
        name: '_i_d_x_email_log_variant',
        columnNames: ['variant_id'],
      }),
    );

    // 11. Add check constraint for split percentage
    await queryRunner.query(`
      ALTER TABLE email_campaign_variants 
      ADD CONSTRAINT CHK_valid_split_percentage 
      CHECK ("splitPercentage" >= 0 AND "splitPercentage" <= 100)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop email_logs foreign key and column
    await queryRunner.dropIndex('email_logs', 'IDX_email_log_variant');
    await queryRunner.dropForeignKey('email_logs', 'FK_email_log_variant');
    await queryRunner.dropColumn('email_logs', 'variantId');

    // 2. Drop email_campaigns indexes and foreign keys
    await queryRunner.dropIndex('email_campaigns', 'IDX_ab_test_campaigns');
    await queryRunner.dropForeignKey('email_campaigns', 'FK_campaign_selected_winner');

    // 3. Drop email_campaigns columns
    await queryRunner.dropColumns('email_campaigns', [
      'isAbTest',
      'testType',
      'winnerCriteria',
      'autoSelectWinner',
      'winnerSelectionDate',
      'selectedWinnerId',
      'testDuration',
      'confidenceLevel',
      'minSampleSize',
      'testStatus',
    ]);

    // 4. Drop email_campaign_variants table (cascade will drop foreign keys)
    await queryRunner.dropTable('email_campaign_variants', true);
  }
}
