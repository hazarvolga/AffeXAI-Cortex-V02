import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class AddDEKFieldsToSettings1738032000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add encrypted_dek column to store the DEK encrypted with KEK
    await MigrationHelpers.addColumnIfNotExists(queryRunner, 
      'settings',
      new TableColumn({
        name: 'encrypted_dek',
        type: 'text',
        isNullable: true,
        comment: 'Data Encryption Key (DEK) encrypted with the master Key Encryption Key (KEK). Used in KEK/DEK pattern for provider-specific key encryption.',
      }),
    );

    // Add provider column to identify which AI provider this DEK is for
    await MigrationHelpers.addColumnIfNotExists(queryRunner, 
      'settings',
      new TableColumn({
        name: 'provider',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'AI provider identifier (openai, anthropic, google, or global). Used to cache and rotate DEKs per provider.',
      }),
    );

    // Add dek_created_at timestamp
    await MigrationHelpers.addColumnIfNotExists(queryRunner, 
      'settings',
      new TableColumn({
        name: 'dek_created_at',
        type: 'timestamp',
        isNullable: true,
        comment: 'When the DEK was created/rotated. Used for key rotation policies (recommended: 30-90 days).',
      }),
    );

    // Add dek_rotation_count for tracking rotations
    await MigrationHelpers.addColumnIfNotExists(queryRunner, 
      'settings',
      new TableColumn({
        name: 'dek_rotation_count',
        type: 'integer',
        default: 0,
        isNullable: false,
        comment: 'Number of times this DEK has been rotated. Helps track key age and enforce rotation policies.',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('settings', 'dek_rotation_count');
    await queryRunner.dropColumn('settings', 'dek_created_at');
    await queryRunner.dropColumn('settings', 'provider');
    await queryRunner.dropColumn('settings', 'encrypted_dek');
  }
}
