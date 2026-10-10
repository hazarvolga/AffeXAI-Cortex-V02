import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketingAutomation1736285000000 implements MigrationInterface {
  name = 'AddMarketingAutomation1736285000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create email_automations table
    await queryRunner.query(`
      CREATE TABLE "email_automations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "description" text,
        "triggerType" varchar NOT NULL,
        "triggerConfig" jsonb NOT NULL DEFAULT '{}',
        "workflowSteps" jsonb NOT NULL DEFAULT '[]',
        "status" varchar NOT NULL DEFAULT 'draft',
        "is_active" boolean NOT NULL DEFAULT false,
        "segmentId" uuid,
        "subscriberCount" int NOT NULL DEFAULT 0,
        "executionCount" int NOT NULL DEFAULT 0,
        "successRate" decimal(5,2) NOT NULL DEFAULT 0,
        "avgExecutionTime" int NOT NULL DEFAULT 0,
        "lastExecutedAt" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "deleted_at" timestamp,
        CONSTRAINT "FK_email_automations_segment" FOREIGN KEY ("segmentId") REFERENCES "segments"("id") ON DELETE SET NULL
      )
    `);

    // 2. Create automation_triggers table
    await queryRunner.query(`
      CREATE TABLE "automation_triggers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "automationId" uuid NOT NULL,
        "subscriber_id" uuid NOT NULL,
        "triggerType" varchar NOT NULL,
        "triggerData" jsonb NOT NULL DEFAULT '{}',
        "status" varchar NOT NULL DEFAULT 'pending',
        "scheduledFor" timestamp,
        "firedAt" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_automation_triggers_automation" FOREIGN KEY ("automationId") REFERENCES "email_automations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_automation_triggers_subscriber" FOREIGN KEY ("subscriber_id") REFERENCES "subscribers"("id") ON DELETE CASCADE
      )
    `);

    // 3. Create automation_executions table
    await queryRunner.query(`
      CREATE TABLE "automation_executions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "automationId" uuid NOT NULL,
        "triggerId" uuid,
        "subscriber_id" uuid NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "currentStepIndex" int NOT NULL DEFAULT 0,
        "stepResults" jsonb NOT NULL DEFAULT '[]',
        "error" text,
        "startedAt" timestamp,
        "completedAt" timestamp,
        "executionTime" int,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_automation_executions_automation" FOREIGN KEY ("automationId") REFERENCES "email_automations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_automation_executions_trigger" FOREIGN KEY ("triggerId") REFERENCES "automation_triggers"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_automation_executions_subscriber" FOREIGN KEY ("subscriber_id") REFERENCES "subscribers"("id") ON DELETE CASCADE
      )
    `);

    // 4. Create automation_schedules table
    await queryRunner.query(`
      CREATE TABLE "automation_schedules" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "automationId" uuid NOT NULL,
        "subscriber_id" uuid NOT NULL,
        "stepIndex" int NOT NULL,
        "scheduledFor" timestamp NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "executedAt" timestamp,
        "error" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_automation_schedules_automation" FOREIGN KEY ("automationId") REFERENCES "email_automations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_automation_schedules_subscriber" FOREIGN KEY ("subscriber_id") REFERENCES "subscribers"("id") ON DELETE CASCADE
      )
    `);

    // 5. Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_automation_triggers_automation" ON "automation_triggers"("automationId");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_automation_triggers_subscriber" ON "automation_triggers"("subscriber_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_automation_triggers_status" ON "automation_triggers"("status");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_automation_triggers_scheduled" ON "automation_triggers"("scheduledFor") WHERE "status" = 'scheduled';
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_automation_executions_automation" ON "automation_executions"("automationId");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_automation_executions_subscriber" ON "automation_executions"("subscriber_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_automation_executions_status" ON "automation_executions"("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_automation_schedules_automation" ON "automation_schedules"("automationId");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_automation_schedules_subscriber" ON "automation_schedules"("subscriber_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_automation_schedules_scheduled" ON "automation_schedules"("scheduledFor") WHERE "status" = 'pending';
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_automation_schedules_status" ON "automation_schedules"("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_email_automations_status" ON "email_automations"("status");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_email_automations_active" ON "email_automations"("is_active") WHERE "is_active" = true;
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_email_automations_segment" ON "email_automations"("segmentId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_email_automations_segment"`);
    await queryRunner.query(`DROP INDEX "IDX_email_automations_active"`);
    await queryRunner.query(`DROP INDEX "IDX_email_automations_status"`);
    
    await queryRunner.query(`DROP INDEX "IDX_automation_schedules_status"`);
    await queryRunner.query(`DROP INDEX "IDX_automation_schedules_scheduled"`);
    await queryRunner.query(`DROP INDEX "IDX_automation_schedules_subscriber"`);
    await queryRunner.query(`DROP INDEX "IDX_automation_schedules_automation"`);
    
    await queryRunner.query(`DROP INDEX "IDX_automation_executions_status"`);
    await queryRunner.query(`DROP INDEX "IDX_automation_executions_subscriber"`);
    await queryRunner.query(`DROP INDEX "IDX_automation_executions_automation"`);
    
    await queryRunner.query(`DROP INDEX "IDX_automation_triggers_scheduled"`);
    await queryRunner.query(`DROP INDEX "IDX_automation_triggers_status"`);
    await queryRunner.query(`DROP INDEX "IDX_automation_triggers_subscriber"`);
    await queryRunner.query(`DROP INDEX "IDX_automation_triggers_automation"`);

    // Drop tables (reverse order due to foreign keys)
    await queryRunner.query(`DROP TABLE "automation_schedules"`);
    await queryRunner.query(`DROP TABLE "automation_executions"`);
    await queryRunner.query(`DROP TABLE "automation_triggers"`);
    await queryRunner.query(`DROP TABLE "email_automations"`);
  }
}
