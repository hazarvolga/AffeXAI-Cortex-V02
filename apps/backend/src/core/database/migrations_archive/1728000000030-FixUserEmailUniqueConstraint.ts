import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Fix email unique constraint to work with soft deletes
 *
 * Problem: The unique constraint on email column doesn't account for soft-deleted records.
 * When a user is soft-deleted (deletedAt IS NOT NULL), their email should be available for reuse.
 *
 * Solution: Replace the simple unique constraint with a partial unique index
 * that only applies to non-deleted records (WHERE deletedAt IS NULL).
 */
export class FixUserEmailUniqueConstraint1728000000030 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing unique constraint on email column
        // This constraint was created with the table and prevents soft-deleted emails from being reused
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_97672ac88f789774dd47f7c8be3"
        `);

        // Also drop if there's a named constraint (might be named differently in some environments)
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key"
        `);

        // Create a partial unique index that only applies to non-deleted users
        // This allows the same email to exist multiple times if deletedAt IS NOT NULL
        // but prevents duplicate emails for active users (deletedAt IS NULL)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_users_email_active"
            ON "users" ("email")
            WHERE "deleted_at" IS NULL
        `);

        console.log('✅ Email unique constraint fixed - soft-deleted emails can now be reused');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the partial unique index
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_users_email_active"
        `);

        // Restore the simple unique constraint (this will fail if there are duplicate emails)
        await queryRunner.query(`
            ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
        `);

        console.log('⚠️ Email unique constraint restored to simple version (soft-deletes will have issues)');
    }

}
