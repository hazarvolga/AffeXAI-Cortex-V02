import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

/**
 * Migration: Create user_roles table for multi-role support
 *
 * This migration creates a junction table to support many-to-many relationship
 * between users and roles, allowing a user to have multiple roles with one
 * designated as primary.
 *
 * Features:
 * - Multiple role assignment per user
 * - Primary role designation (isPrimary flag)
 * - Audit trail (assignedAt, assignedBy)
 * - Prevent duplicate assignments (unique constraint)
 * - Ensure only one primary role per user
 * - Cascade delete when user is deleted
 * - Restrict delete when role has assignments
 */
export class CreateUserRolesTable1729500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Creating user_roles table...');

    // Create user_roles junction table
    await MigrationHelpers.createTableIfNotExists(queryRunner,
      new Table({
        name: 'user_roles',
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
            isNullable: false,
          },
          {
            name: 'role_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'is_primary',
            type: 'boolean',
            default: false,
            comment: 'Indicates if this is the primary role for the user',
          },
          {
            name: 'assigned_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'assigned_by',
            type: 'uuid',
            isNullable: true,
            comment: 'User ID who assigned this role',
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

    console.log('✅ user_roles table created');

    // Add foreign key for userId
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
      'user_roles',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE', // When user is deleted, remove all role assignments
        name: '_f_k_user_roles_user_id',
      })
    );

    console.log('✅ Foreign key FK_user_roles_userId created');

    // Add foreign key for roleId
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner,
      'user_roles',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'RESTRICT', // Prevent role deletion if assigned to users
        name: '_f_k_user_roles_role_id',
      })
    );

    console.log('✅ Foreign key FK_user_roles_roleId created');

    // Add unique index to prevent duplicate role assignments
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'user_roles',
      new TableIndex({
        name: '_i_d_x_user_roles_unique',
        columnNames: ['user_id', 'role_id'],
        isUnique: true,
      })
    );

    console.log('✅ Unique index IDX_user_roles_unique created');

    // Add index for faster userId queries
    await MigrationHelpers.createIndexIfNotExists(queryRunner,
      'user_roles',
      new TableIndex({
        name: '_i_d_x_user_roles_user_id',
        columnNames: ['user_id'],
      })
    );

    console.log('✅ Index IDX_user_roles_userId created');

    // Add partial unique index to ensure only one primary role per user
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_roles_primary" ON "user_roles" ("user_id") WHERE "is_primary" = true`
    );

    console.log('✅ Partial unique index IDX_user_roles_primary created');
    console.log('✅ Migration CreateUserRolesTable1729500000000 completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Rolling back CreateUserRolesTable1729500000000...');

    // Drop indexes first
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_roles_primary"`);
    console.log('✅ Dropped index IDX_user_roles_primary');

    await queryRunner.dropIndex('user_roles', 'IDX_user_roles_userId');
    console.log('✅ Dropped index IDX_user_roles_userId');

    await queryRunner.dropIndex('user_roles', 'IDX_user_roles_unique');
    console.log('✅ Dropped index IDX_user_roles_unique');

    // Drop foreign keys
    await queryRunner.dropForeignKey('user_roles', 'FK_user_roles_roleId');
    console.log('✅ Dropped foreign key FK_user_roles_roleId');

    await queryRunner.dropForeignKey('user_roles', 'FK_user_roles_userId');
    console.log('✅ Dropped foreign key FK_user_roles_userId');

    // Drop table
    await queryRunner.dropTable('user_roles');
    console.log('✅ Dropped table user_roles');

    console.log('✅ Rollback CreateUserRolesTable1729500000000 completed');
  }
}
