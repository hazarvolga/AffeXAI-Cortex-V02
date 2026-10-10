import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailSettingsAndEncryption1728000000014 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if is_encrypted column exists, add if not
        const hasColumn = await queryRunner.hasColumn('settings', 'is_encrypted');

        if (!hasColumn) {
            await queryRunner.query(`
                ALTER TABLE "settings" 
                ADD COLUMN "is_encrypted" boolean NOT NULL DEFAULT false
            `);
        }

        // Insert default email settings
        await queryRunner.query(`
            INSERT INTO "settings" ("category", "key", "value", "is_encrypted") VALUES
            -- Provider selection
            ('email', 'provider', 'resend', false),
            
            -- Transactional email settings
            ('email', 'transactional.domain', 'tx.aluplan.tr', false),
            ('email', 'transactional.fromName', 'Aluplan', false),
            ('email', 'transactional.fromEmail', 'noreply@tx.aluplan.tr', false),
            ('email', 'transactional.replyToEmail', 'destek@aluplan.tr', false),
            
            -- Marketing email settings
            ('email', 'marketing.domain', 'news.aluplan.tr', false),
            ('email', 'marketing.fromName', 'Aluplan Newsletter', false),
            ('email', 'marketing.fromEmail', 'newsletter@news.aluplan.tr', false),
            ('email', 'marketing.replyToEmail', 'iletisim@aluplan.tr', false),
            
            -- Tracking settings
            ('email', 'tracking.clickTracking', 'false', false),
            ('email', 'tracking.openTracking', 'true', false),
            
            -- Rate limiting (per hour)
            ('email', 'rateLimit.transactional', '1000', false),
            ('email', 'rateLimit.marketing', '500', false)
            ON CONFLICT DO NOTHING
        `);

        // Note: API keys will be added manually via admin panel (they'll be encrypted)
        console.log('✅ Email settings schema updated with encryption support');
        console.log('⚠️  Remember to set RESEND_API_KEY via admin panel after deployment');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove email settings
        await queryRunner.query(`
            DELETE FROM "settings" WHERE "category" = 'email'
        `);

        // Remove is_encrypted column
        await queryRunner.query(`
            ALTER TABLE "settings" 
            DROP COLUMN "is_encrypted"
        `);
    }

}
