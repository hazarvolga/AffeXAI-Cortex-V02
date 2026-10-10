import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class AddPipelineStateTable1730199600000 implements MigrationInterface {
  name = 'AddPipelineStateTable1730199600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'faq_pipeline_state',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['running', 'stopped', 'error'],
            default: "'stopped'",
          },
          {
            name: 'last_run',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'next_scheduled_run',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'daily_processing_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_faqs_generated',
            type: 'int',
            default: 0,
          },
          {
            name: 'last_error',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'processing_config',
            type: 'jsonb',
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
      }),
      true,
    );

    // Create index on status for faster queries
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'faq_pipeline_state',
      new TableIndex({
        name: '_i_d_x_pipeline_state_status',
        columnNames: ['status'],
      }),
    );

    // Create index on updatedAt for sorting
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'faq_pipeline_state',
      new TableIndex({
        name: '_i_d_x_pipeline_state_updated_at',
        columnNames: ['updated_at'],
      }),
    );

    // Insert initial state
    await queryRunner.query(`
      INSERT INTO faq_pipeline_state (id, status, daily_processing_count, total_faqs_generated, processing_config, created_at, updated_at)
      VALUES (
        uuid_generate_v4(),
        'stopped',
        0,
        0,
        '{"mode": "manual", "batchSize": 50, "scheduleInterval": 3600}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('faq_pipeline_state', 'IDX_pipeline_state_updated_at');
    await queryRunner.dropIndex('faq_pipeline_state', 'IDX_pipeline_state_status');
    await queryRunner.dropTable('faq_pipeline_state');
  }
}
