import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class AddTokenVersionToUser1729333333333 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add tokenVersion column to users table
    await MigrationHelpers.addColumnIfNotExists(
      queryRunner,
      'users',
      new TableColumn({
        name: 'token_version',
        type: 'int',
        default: 1,
        isNullable: false,
      })
    );

    console.log('✅ Added tokenVersion column to users table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove tokenVersion column
    await queryRunner.dropColumn('users', 'tokenVersion');

    console.log('✅ Removed tokenVersion column from users table');
  }
}
