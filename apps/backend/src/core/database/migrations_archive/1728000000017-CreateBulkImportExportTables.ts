import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBulkImportExportTables1728000000017 implements MigrationInterface {
  name = 'CreateBulkImportExportTables1760621189173';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create import_jobs table
    await queryRunner.query(`
      CREATE TABLE "import_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fileName" character varying NOT NULL,
        "originalFileName" character varying NOT NULL,
        "filePath" character varying NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "totalRecords" integer NOT NULL DEFAULT 0,
        "processedRecords" integer NOT NULL DEFAULT 0,
        "validRecords" integer NOT NULL DEFAULT 0,
        "invalidRecords" integer NOT NULL DEFAULT 0,
        "riskyRecords" integer NOT NULL DEFAULT 0,
        "duplicateRecords" integer NOT NULL DEFAULT 0,
        "options" jsonb,
        "columnMapping" jsonb,
        "validationSummary" jsonb,
        "error" text,
        "completedAt" TIMESTAMP,
        "user_id" uuid,
        "progressPercentage" real NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        deleted_at TIMESTAMP,
        CONSTRAINT "PK_import_jobs" PRIMARY KEY ("id")
      )
    `);

    // Create export_jobs table
    await queryRunner.query(`
      CREATE TABLE "export_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fileName" character varying NOT NULL,
        "filePath" character varying NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "totalRecords" integer NOT NULL DEFAULT 0,
        "processedRecords" integer NOT NULL DEFAULT 0,
        "filters" jsonb NOT NULL,
        "options" jsonb NOT NULL,
        "error" text,
        "completedAt" TIMESTAMP,
        "expiresAt" TIMESTAMP NOT NULL,
        "user_id" uuid,
        "progressPercentage" real NOT NULL DEFAULT 0,
        "fileSizeBytes" bigint,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        deleted_at TIMESTAMP,
        CONSTRAINT "PK_export_jobs" PRIMARY KEY ("id")
      )
    `);

    // Create import_results table
    await queryRunner.query(`
      CREATE TABLE "import_results" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "importJobId" uuid NOT NULL,
        "email" character varying NOT NULL,
        "status" character varying(20) NOT NULL,
        "confidenceScore" integer NOT NULL DEFAULT 0,
        "validationDetails" jsonb,
        "issues" jsonb,
        "suggestions" jsonb,
        "imported" boolean NOT NULL DEFAULT false,
        "error" text,
        "originalData" jsonb,
        "rowNumber" integer,
        "subscriber_id" uuid,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        deleted_at TIMESTAMP,
        CONSTRAINT "PK_import_results" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "import_results" 
      ADD CONSTRAINT "FK_import_results_importJob" 
      FOREIGN KEY ("importJobId") 
      REFERENCES "import_jobs"("id") 
      ON DELETE CASCADE
    `);

    // Create indexes for better performance
    await queryRunner.query(`CREATE INDEX "IDX_import_results_importJobId_email" ON "import_results" ("importJobId", "email")`);
    await queryRunner.query(`CREATE INDEX "IDX_import_results_importJobId_status" ON "import_results" ("importJobId", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_import_jobs_status" ON "import_jobs" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_import_jobs_userId" ON "import_jobs" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_export_jobs_status" ON "export_jobs" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_export_jobs_userId" ON "export_jobs" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`ALTER TABLE "import_results" DROP CONSTRAINT "FK_import_results_importJob"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "import_results"`);
    await queryRunner.query(`DROP TABLE "export_jobs"`);
    await queryRunner.query(`DROP TABLE "import_jobs"`);
  }
}