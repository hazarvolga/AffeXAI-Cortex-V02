import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class AddRefreshTokenToUsers1729180000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if refreshToken column exists
    const refreshTokenExists = await queryRunner.hasColumn('users', 'refreshToken');
    if (!refreshTokenExists) {
      await MigrationHelpers.addColumnIfNotExists(queryRunner, 
        'users',
        new TableColumn({
          name: 'refresh_token',
          type: 'text',
          isNullable: true,
        })
      );
    }

    // Check if refreshTokenExpires column exists
    const refreshTokenExpiresExists = await queryRunner.hasColumn('users', 'refreshTokenExpires');
    if (!refreshTokenExpiresExists) {
      await MigrationHelpers.addColumnIfNotExists(queryRunner, 
        'users',
        new TableColumn({
          name: 'refresh_token_expires',
          type: 'timestamp',
          isNullable: true,
        })
      );
    }

    console.log('✅ Migration: refreshToken columns verified/added to users table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove refreshTokenExpires column
    await queryRunner.dropColumn('users', 'refreshTokenExpires');

    // Remove refreshToken column
    await queryRunner.dropColumn('users', 'refreshToken');

    console.log('✅ Migration: Removed refreshToken and refreshTokenExpires columns from users table');
  }
}
