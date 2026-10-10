import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateExistingUserRoles1729500000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Migrating existing user roles to user_roles table...');

    // Get all users with roleId
    const users = await queryRunner.query(`
      SELECT id, "roleId"
      FROM users
      WHERE "roleId" IS NOT NULL
    `);

    console.log(`📊 Found ${users.length} users with existing roleId`);

    // Insert into user_roles table
    for (const user of users) {
      try {
        // Check if entry already exists
        const existing = await queryRunner.query(`
          SELECT id FROM user_roles
          WHERE "user_id" = $1 AND "role_id" = $2
        `, [user.id, user.roleId]);

        if (existing.length === 0) {
          await queryRunner.query(`
            INSERT INTO user_roles ("user_id", "role_id", "is_primary", "assigned_at")
            VALUES ($1, $2, true, NOW())
          `, [user.id, user.roleId]);

          console.log(`✅ Migrated role for user ${user.id}`);
        } else {
          console.log(`⏭️  User ${user.id} already has role assignment`);
        }
      } catch (error) {
        console.error(`❌ Failed to migrate role for user ${user.id}:`, error);
      }
    }

    console.log('✅ Migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Reverting user roles migration...');

    // Delete all user_roles entries that were migrated
    await queryRunner.query(`
      DELETE FROM user_roles
      WHERE "assigned_by" IS NULL
    `);

    console.log('✅ Migration reverted');
  }
}
