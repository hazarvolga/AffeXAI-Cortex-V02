import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateBackupTables1732545000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create backups table
    await MigrationHelpers.createTableIfNotExists(queryRunner, 
      new Table({
        name: 'backups',
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
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['full', 'database', 'files', 'code'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'in_progress', 'completed', 'failed', 'uploading', 'uploaded'],
            default: "'pending'",
          },
          {
            name: 'file_path',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'checksum',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'is_automatic',
            type: 'boolean',
            default: false,
          },
          {
            name: 'triggered_by',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'uploaded_to',
            type: 'varchar',
            isArray: true,
            default: "'{}'",
          },
          {
            name: 'remote_urls',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
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
      true
    );

    // Create indexes for backups table
    await MigrationHelpers.createIndexIfNotExists(queryRunner, 
      'backups',
      new TableIndex({
        name: '_i_d_x__b_a_c_k_u_p__s_t_a_t_u_s__c_r_e_a_t_e_d',
        columnNames: ['status', 'created_at'],
      })
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner, 
      'backups',
      new TableIndex({
        name: '_i_d_x__b_a_c_k_u_p__t_y_p_e__s_t_a_t_u_s',
        columnNames: ['type', 'status'],
      })
    );

    await MigrationHelpers.createIndexIfNotExists(queryRunner, 
      'backups',
      new TableIndex({
        name: '_i_d_x__b_a_c_k_u_p__s_t_a_t_u_s',
        columnNames: ['status'],
      })
    );

    // Create backup_config table
    await MigrationHelpers.createTableIfNotExists(queryRunner, 
      new Table({
        name: 'backup_config',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'google_drive_client_id',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'google_drive_client_secret',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'google_drive_refresh_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'one_drive_client_id',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'one_drive_client_secret',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'one_drive_refresh_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'dropbox_access_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ftp_host',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'ftp_port',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'ftp_username',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ftp_password',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ftp_path',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'aws_access_key_id',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'aws_secret_access_key',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'aws_s3_bucket',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'aws_region',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'default_retention_days',
            type: 'integer',
            default: 30,
          },
          {
            name: 'default_upload_destinations',
            type: 'varchar',
            isArray: true,
            default: "'{}'",
          },
          {
            name: 'automatic_backup_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'automatic_backup_cron',
            type: 'varchar',
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
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('backup_config');
    await queryRunner.dropTable('backups');
  }
}
