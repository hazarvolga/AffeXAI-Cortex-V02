import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePlatformIntegrationTables1760621189172 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable UUID extension if not already enabled
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create platform_events table
        await queryRunner.query(`
            CREATE TABLE "platform_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "source" character varying(50) NOT NULL,
                "event_type" character varying(100) NOT NULL,
                "payload" jsonb NOT NULL,
                "triggered_rules" uuid array DEFAULT '{}',
                "metadata" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_platform_events" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for platform_events
        await queryRunner.query(`CREATE INDEX "idx_platform_events_type" ON "platform_events" ("event_type")`);
        await queryRunner.query(`CREATE INDEX "idx_platform_events_source" ON "platform_events" ("source")`);
        await queryRunner.query(`CREATE INDEX "idx_platform_events_created" ON "platform_events" ("created_at" DESC)`);

        // Create automation_rules table
        await queryRunner.query(`
            CREATE TABLE "automation_rules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" text,
                "is_active" boolean NOT NULL DEFAULT true,
                "trigger_event_type" character varying(100) NOT NULL,
                "trigger_conditions" jsonb DEFAULT '{}',
                "actions" jsonb NOT NULL,
                "priority" integer NOT NULL DEFAULT 0,
                "requires_approval" boolean NOT NULL DEFAULT false,
                "impact_level" character varying(20) DEFAULT 'medium',
                "auto_approval_conditions" jsonb,
                "authorized_approvers" jsonb DEFAULT '[]',
                "execution_count" integer NOT NULL DEFAULT 0,
                "last_executed_at" TIMESTAMP,
                "last_execution_result" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_automation_rules" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for automation_rules
        await queryRunner.query(`CREATE INDEX "idx_automation_rules_trigger" ON "automation_rules" ("trigger_event_type")`);
        await queryRunner.query(`CREATE INDEX "idx_automation_rules_active" ON "automation_rules" ("is_active") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "idx_automation_rules_deleted" ON "automation_rules" ("deleted_at")`);

        // Create webhooks table
        await queryRunner.query(`
            CREATE TABLE "webhooks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "url" character varying(500) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "subscribed_events" character varying(100) array NOT NULL,
                "auth_type" character varying(20) DEFAULT 'none',
                "auth_config" jsonb,
                "retry_count" integer NOT NULL DEFAULT 3,
                "retry_delay" integer NOT NULL DEFAULT 5000,
                "timeout" integer NOT NULL DEFAULT 10000,
                "custom_headers" jsonb,
                "total_calls" integer NOT NULL DEFAULT 0,
                "successful_calls" integer NOT NULL DEFAULT 0,
                "failed_calls" integer NOT NULL DEFAULT 0,
                "last_called_at" TIMESTAMP,
                "last_status" integer,
                "last_error" text,
                "description" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_webhooks" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for webhooks
        await queryRunner.query(`CREATE INDEX "idx_webhooks_active" ON "webhooks" ("is_active") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "idx_webhooks_deleted" ON "webhooks" ("deleted_at")`);

        // Create automation_approvals table
        await queryRunner.query(`
            CREATE TABLE "automation_approvals" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "rule_id" uuid,
                "event_id" uuid,
                "status" character varying(20) NOT NULL DEFAULT 'pending',
                "priority" character varying(20) NOT NULL DEFAULT 'medium',
                "impact_level" character varying(20) NOT NULL DEFAULT 'medium',
                "pending_actions" jsonb NOT NULL,
                "requested_by" character varying(100) NOT NULL,
                "request_reason" text,
                "request_context" jsonb,
                "approved_by" character varying(100),
                "approved_at" TIMESTAMP,
                "approval_comment" text,
                "approval_chain" jsonb,
                "required_approvals" integer NOT NULL DEFAULT 1,
                "current_approvals" integer NOT NULL DEFAULT 0,
                "expires_at" TIMESTAMP,
                "is_expired" boolean NOT NULL DEFAULT false,
                "is_executed" boolean NOT NULL DEFAULT false,
                "executed_at" TIMESTAMP,
                "execution_result" jsonb,
                "approvers_notified" boolean NOT NULL DEFAULT false,
                "notified_users" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_automation_approvals" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for automation_approvals
        await queryRunner.query(`CREATE INDEX "idx_approval_status" ON "automation_approvals" ("status", "created_at")`);
        await queryRunner.query(`CREATE INDEX "idx_approval_rule" ON "automation_approvals" ("rule_id", "status")`);
        await queryRunner.query(`CREATE INDEX "idx_approval_event" ON "automation_approvals" ("event_id")`);
        await queryRunner.query(`CREATE INDEX "idx_approval_requester" ON "automation_approvals" ("requested_by")`);
        await queryRunner.query(`CREATE INDEX "idx_approval_expires" ON "automation_approvals" ("expires_at")`);
        await queryRunner.query(`CREATE INDEX "idx_approval_deleted" ON "automation_approvals" ("deleted_at")`);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "automation_approvals" 
            ADD CONSTRAINT "FK_approval_rule" 
            FOREIGN KEY ("rule_id") 
            REFERENCES "automation_rules"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "automation_approvals" 
            ADD CONSTRAINT "FK_approval_event" 
            FOREIGN KEY ("event_id") 
            REFERENCES "platform_events"("id") 
            ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints first
        await queryRunner.query(`ALTER TABLE "automation_approvals" DROP CONSTRAINT "FK_approval_event"`);
        await queryRunner.query(`ALTER TABLE "automation_approvals" DROP CONSTRAINT "FK_approval_rule"`);

        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE "automation_approvals"`);
        await queryRunner.query(`DROP TABLE "webhooks"`);
        await queryRunner.query(`DROP TABLE "automation_rules"`);
        await queryRunner.query(`DROP TABLE "platform_events"`);
    }

}
