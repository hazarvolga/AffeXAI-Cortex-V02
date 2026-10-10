import { MigrationInterface, QueryRunner } from "typeorm";

export class FixChatMessageSessionId1740000000003 implements MigrationInterface {
    name = 'FixChatMessageSessionId1761311500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Ensure uuid-ossp extension is enabled
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Step 2: Check if sessionId column already exists and is NOT NULL
        const columnCheck = await queryRunner.query(`
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'chat_messages' 
            AND column_name = 'sessionId'
        `);

        // If column exists and is already NOT NULL, skip migration
        if (columnCheck.length > 0 && columnCheck[0].is_nullable === 'NO') {
            console.log('sessionId column already exists and is NOT NULL, skipping migration');
            return;
        }

        // Step 3: Get the first available session or create a default one
        const sessions = await queryRunner.query(`
            SELECT id FROM chat_sessions ORDER BY "created_at" ASC LIMIT 1
        `);

        let defaultSessionId: string;

        if (sessions.length > 0) {
            defaultSessionId = sessions[0].id;
        } else {
            // Create a default session if none exists
            const result = await queryRunner.query(`
                INSERT INTO chat_sessions (id, status, "created_at", "updated_at")
                VALUES (uuid_generate_v4(), 'active', NOW(), NOW())
                RETURNING id
            `);
            defaultSessionId = result[0].id;
        }

        // Step 4: Update all chat_messages with null sessionId to use the default session
        await queryRunner.query(`
            UPDATE chat_messages 
            SET "sessionId" = $1 
            WHERE "sessionId" IS NULL
        `, [defaultSessionId]);

        // Step 5: Make sessionId NOT NULL
        await queryRunner.query(`
            ALTER TABLE "chat_messages" 
            ALTER COLUMN "sessionId" SET NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Make sessionId nullable again
        await queryRunner.query(`
            ALTER TABLE "chat_messages" 
            ALTER COLUMN "sessionId" DROP NOT NULL
        `);
    }
}
