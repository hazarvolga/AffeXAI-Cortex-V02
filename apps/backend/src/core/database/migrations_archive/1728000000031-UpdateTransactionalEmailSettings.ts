import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Update transactional email settings - use real mailbox instead of noreply
 *
 * Problem: Using noreply@aluplan.tr causes Gmail delivery failures:
 * "The recipient server did not accept our requests to connect"
 *
 * Solution: Change fromEmail to destek@aluplan.tr (real mailbox)
 * This allows proper email delivery and enables email replies
 */
export class UpdateTransactionalEmailSettings1728000000031 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update transactional fromEmail from noreply@aluplan.tr to destek@aluplan.tr
        await queryRunner.query(`
            UPDATE settings
            SET value = 'destek@aluplan.tr'
            WHERE category = 'email'
              AND key = 'transactional.fromEmail'
              AND value = 'noreply@aluplan.tr'
        `);

        console.log('✅ Updated transactional email settings - now using destek@aluplan.tr');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert to noreply@ (not recommended, but provided for migration rollback)
        await queryRunner.query(`
            UPDATE settings
            SET value = 'noreply@aluplan.tr'
            WHERE category = 'email'
              AND key = 'transactional.fromEmail'
              AND value = 'destek@aluplan.tr'
        `);

        console.log('⚠️ Reverted transactional email settings to noreply@ (Gmail delivery may fail)');
    }

}
