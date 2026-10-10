import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class AddEmailVerificationFields1729000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');

    // Add emailVerificationToken column if not exists
    const hasToken = table?.columns.find(c => c.name === 'emailVerificationToken');
    if (!hasToken) {
      await MigrationHelpers.addColumnIfNotExists(queryRunner, 'users', new TableColumn({
        name: 'email_verification_token',
        type: 'text',
        isNullable: true,
      }));
    }

    // Add emailVerificationExpires column if not exists
    const hasExpires = table?.columns.find(c => c.name === 'emailVerificationExpires');
    if (!hasExpires) {
      await MigrationHelpers.addColumnIfNotExists(queryRunner, 'users', new TableColumn({
        name: 'email_verification_expires',
        type: 'timestamp',
        isNullable: true,
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');

    // Drop emailVerificationExpires if exists
    const hasExpires = table?.columns.find(c => c.name === 'emailVerificationExpires');
    if (hasExpires) {
      await queryRunner.dropColumn('users', 'emailVerificationExpires');
    }

    // Drop emailVerificationToken if exists
    const hasToken = table?.columns.find(c => c.name === 'emailVerificationToken');
    if (hasToken) {
      await queryRunner.dropColumn('users', 'emailVerificationToken');
    }
  }
}
