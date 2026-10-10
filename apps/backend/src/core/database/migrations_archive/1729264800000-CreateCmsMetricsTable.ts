import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateCmsMetricsTable1729264800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('cms_metrics')) {
      console.log('Skipping CreateCmsMetricsTable because table exists');
      return;
    }
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'cms_metrics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'metricType',
            type: 'enum',
            enum: ['view', 'click', 'edit', 'publish'],
            isNullable: false,
          },
          {
            name: 'pageId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'pageTitle',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'linkUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'linkText',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'visitorId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    /* // Create indexes for better query performance
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'cms_metrics',
      new TableIndex({
        name: '_i_d_x_cms_metrics_type',
        columnNames: ['metricType'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'cms_metrics',
      new TableIndex({
        name: '_i_d_x_cms_metrics_page',
        columnNames: ['pageId'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'cms_metrics',
      new TableIndex({
        name: '_i_d_x_cms_metrics_type_date',
        columnNames: ['metricType', 'createdAt'],
      }),
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'cms_metrics',
      new TableIndex({
        name: '_i_d_x_cms_metrics_page_type_date',
        columnNames: ['pageId', 'metricType', 'createdAt'],
      }),
    ); */
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('cms_metrics');
  }
}
