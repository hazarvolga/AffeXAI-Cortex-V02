import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The PipelineState entity (faq-learning) shipped without a migration in the
 * active history, so the faq-learning dashboard failed with "relation does not
 * exist". Mirrors the entity; idempotent for databases that already have it.
 * tenantId is a varchar slug like every other tenant column.
 */
export class FaqPipelineState1791450000000 implements MigrationInterface {
  name = "FaqPipelineState1791450000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."faq_pipeline_state_status_enum" AS ENUM('running', 'stopped', 'error');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "faq_pipeline_state" (
        "tenantId" character varying(255),
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" "public"."faq_pipeline_state_status_enum" NOT NULL DEFAULT 'stopped',
        "lastRun" TIMESTAMP,
        "nextScheduledRun" TIMESTAMP,
        "dailyProcessingCount" integer NOT NULL DEFAULT 0,
        "totalFaqsGenerated" integer NOT NULL DEFAULT 0,
        "lastError" jsonb,
        "processingConfig" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_faq_pipeline_state" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_faq_pipeline_state_tenant" ON "faq_pipeline_state" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "faq_pipeline_state"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."faq_pipeline_state_status_enum"`,
    );
  }
}
