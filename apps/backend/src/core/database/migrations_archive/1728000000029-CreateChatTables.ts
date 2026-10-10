import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChatTables1728000000029 implements MigrationInterface {
    name = 'CreateChatTables1761400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable uuid-ossp extension if not exists
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create chat_sessions table
        await queryRunner.query(`
            CREATE TABLE "chat_sessions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now(),
                deleted_at TIMESTAMP,
                "user_id" uuid NOT NULL,
                "sessionType" character varying NOT NULL DEFAULT 'support',
                "status" character varying NOT NULL DEFAULT 'active',
                "title" character varying(255),
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "closedAt" TIMESTAMP,
                CONSTRAINT "PK_chat_sessions" PRIMARY KEY ("id")
            )
        `);

        // Create chat_messages table
        await queryRunner.query(`
            CREATE TABLE "chat_messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now(),
                deleted_at TIMESTAMP,
                "sessionId" uuid NOT NULL,
                "senderType" character varying NOT NULL,
                "senderId" uuid,
                "content" text NOT NULL,
                "messageType" character varying NOT NULL DEFAULT 'text',
                "metadata" jsonb NOT NULL DEFAULT '{}',
                CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id")
            )
        `);

        // Create chat_documents table
        await queryRunner.query(`
            CREATE TABLE "chat_documents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now(),
                deleted_at TIMESTAMP,
                "sessionId" uuid NOT NULL,
                "messageId" uuid,
                "filename" character varying(255) NOT NULL,
                "fileType" character varying(10) NOT NULL,
                "fileSize" integer NOT NULL,
                "storagePath" character varying(500) NOT NULL,
                "extractedContent" text,
                "processingStatus" character varying NOT NULL DEFAULT 'pending',
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "processedAt" TIMESTAMP,
                CONSTRAINT "PK_chat_documents" PRIMARY KEY ("id")
            )
        `);

        // Create chat_context_sources table
        await queryRunner.query(`
            CREATE TABLE "chat_context_sources" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now(),
                deleted_at TIMESTAMP,
                "sessionId" uuid NOT NULL,
                "messageId" uuid,
                "sourceType" character varying NOT NULL,
                "sourceId" character varying(255),
                "content" text NOT NULL,
                "relevanceScore" real NOT NULL DEFAULT '0',
                "metadata" jsonb NOT NULL DEFAULT '{}',
                CONSTRAINT "PK_chat_context_sources" PRIMARY KEY ("id")
            )
        `);

        // Create chat_support_assignments table
        await queryRunner.query(`
            CREATE TABLE "chat_support_assignments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now(),
                deleted_at TIMESTAMP,
                "sessionId" uuid NOT NULL,
                "supportUserId" uuid NOT NULL,
                "assignedBy" uuid,
                "assignmentType" character varying NOT NULL DEFAULT 'manual',
                "status" character varying NOT NULL DEFAULT 'active',
                "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "completedAt" TIMESTAMP,
                "notes" text,
                CONSTRAINT "PK_chat_support_assignments" PRIMARY KEY ("id")
            )
        `);

        // Create chat_url_cache table
        await queryRunner.query(`
            CREATE TABLE "chat_url_cache" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now(),
                deleted_at TIMESTAMP,
                "urlHash" character varying(64) NOT NULL,
                "originalUrl" text NOT NULL,
                "title" character varying(500),
                "content" text,
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "processingStatus" character varying NOT NULL DEFAULT 'completed',
                "expiresAt" TIMESTAMP,
                CONSTRAINT "PK_chat_url_cache" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_chat_url_cache_urlHash" UNIQUE ("urlHash")
            )
        `);

        // Create indexes for chat_sessions
        await queryRunner.query(`CREATE INDEX "IDX_chat_sessions_userId" ON "chat_sessions" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_sessions_status" ON "chat_sessions" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_sessions_sessionType" ON "chat_sessions" ("sessionType")`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_sessions_createdAt" ON "chat_sessions" (created_at)`);

        // Create indexes for chat_messages
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_sessionId" ON "chat_messages" ("sessionId")`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_sessionId_createdAt" ON "chat_messages" ("sessionId", created_at)`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_senderType_senderId" ON "chat_messages" ("senderType", "senderId")`);

        // Create indexes for chat_documents
        await queryRunner.query(`CREATE INDEX "IDX_chat_documents_sessionId" ON "chat_documents" ("sessionId")`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_documents_processingStatus" ON "chat_documents" ("processingStatus")`);

        // Create indexes for chat_context_sources
        await queryRunner.query(`CREATE INDEX "IDX_chat_context_sources_sessionId" ON "chat_context_sources" ("sessionId")`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_context_sources_sourceType" ON "chat_context_sources" ("sourceType")`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_context_sources_relevanceScore" ON "chat_context_sources" ("relevanceScore")`);

        // Create indexes for chat_support_assignments
        await queryRunner.query(`CREATE INDEX "IDX_chat_support_assignments_sessionId" ON "chat_support_assignments" ("sessionId")`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_support_assignments_supportUserId" ON "chat_support_assignments" ("supportUserId")`);
        await queryRunner.query(`CREATE INDEX "IDX_chat_support_assignments_status" ON "chat_support_assignments" ("status")`);

        // Create indexes for chat_url_cache
        await queryRunner.query(`CREATE INDEX "IDX_chat_url_cache_expiresAt" ON "chat_url_cache" ("expiresAt")`);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "chat_sessions" 
            ADD CONSTRAINT "FK_chat_sessions_userId" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_messages" 
            ADD CONSTRAINT "FK_chat_messages_sessionId" 
            FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_messages" 
            ADD CONSTRAINT "FK_chat_messages_senderId" 
            FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_documents" 
            ADD CONSTRAINT "FK_chat_documents_sessionId" 
            FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_documents" 
            ADD CONSTRAINT "FK_chat_documents_messageId" 
            FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_context_sources" 
            ADD CONSTRAINT "FK_chat_context_sources_sessionId" 
            FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_context_sources" 
            ADD CONSTRAINT "FK_chat_context_sources_messageId" 
            FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_support_assignments" 
            ADD CONSTRAINT "FK_chat_support_assignments_sessionId" 
            FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_support_assignments" 
            ADD CONSTRAINT "FK_chat_support_assignments_supportUserId" 
            FOREIGN KEY ("supportUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_support_assignments" 
            ADD CONSTRAINT "FK_chat_support_assignments_assignedBy" 
            FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Add check constraints for enums
        await queryRunner.query(`
            ALTER TABLE "chat_sessions" 
            ADD CONSTRAINT "CHK_chat_sessions_sessionType" 
            CHECK ("sessionType" IN ('support', 'general'))
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_sessions" 
            ADD CONSTRAINT "CHK_chat_sessions_status" 
            CHECK ("status" IN ('active', 'closed', 'transferred'))
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_messages" 
            ADD CONSTRAINT "CHK_chat_messages_senderType" 
            CHECK ("senderType" IN ('user', 'ai', 'support'))
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_messages" 
            ADD CONSTRAINT "CHK_chat_messages_messageType" 
            CHECK ("messageType" IN ('text', 'file', 'url', 'system'))
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_documents" 
            ADD CONSTRAINT "CHK_chat_documents_processingStatus" 
            CHECK ("processingStatus" IN ('pending', 'processing', 'completed', 'failed'))
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_context_sources" 
            ADD CONSTRAINT "CHK_chat_context_sources_sourceType" 
            CHECK ("sourceType" IN ('knowledge_base', 'faq_learning', 'document', 'url'))
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_support_assignments" 
            ADD CONSTRAINT "CHK_chat_support_assignments_assignmentType" 
            CHECK ("assignmentType" IN ('manual', 'auto', 'escalated'))
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_support_assignments" 
            ADD CONSTRAINT "CHK_chat_support_assignments_status" 
            CHECK ("status" IN ('active', 'completed', 'transferred'))
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_url_cache" 
            ADD CONSTRAINT "CHK_chat_url_cache_processingStatus" 
            CHECK ("processingStatus" IN ('pending', 'processing', 'completed', 'failed'))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints first
        await queryRunner.query(`ALTER TABLE "chat_support_assignments" DROP CONSTRAINT "FK_chat_support_assignments_assignedBy"`);
        await queryRunner.query(`ALTER TABLE "chat_support_assignments" DROP CONSTRAINT "FK_chat_support_assignments_supportUserId"`);
        await queryRunner.query(`ALTER TABLE "chat_support_assignments" DROP CONSTRAINT "FK_chat_support_assignments_sessionId"`);
        await queryRunner.query(`ALTER TABLE "chat_context_sources" DROP CONSTRAINT "FK_chat_context_sources_messageId"`);
        await queryRunner.query(`ALTER TABLE "chat_context_sources" DROP CONSTRAINT "FK_chat_context_sources_sessionId"`);
        await queryRunner.query(`ALTER TABLE "chat_documents" DROP CONSTRAINT "FK_chat_documents_messageId"`);
        await queryRunner.query(`ALTER TABLE "chat_documents" DROP CONSTRAINT "FK_chat_documents_sessionId"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_senderId"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_sessionId"`);
        await queryRunner.query(`ALTER TABLE "chat_sessions" DROP CONSTRAINT "FK_chat_sessions_userId"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "chat_url_cache"`);
        await queryRunner.query(`DROP TABLE "chat_support_assignments"`);
        await queryRunner.query(`DROP TABLE "chat_context_sources"`);
        await queryRunner.query(`DROP TABLE "chat_documents"`);
        await queryRunner.query(`DROP TABLE "chat_messages"`);
        await queryRunner.query(`DROP TABLE "chat_sessions"`);
    }
}