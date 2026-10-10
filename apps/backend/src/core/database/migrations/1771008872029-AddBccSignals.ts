import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBccSignals1771008872029 implements MigrationInterface {
    name = 'AddBccSignals1771008872029'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."bcc_signals_type_enum" AS ENUM('SENTIMENT', 'INTENT', 'INTERACTION', 'FRICTION', 'RESONANCE')`);
        await queryRunner.query(`CREATE TYPE "public"."bcc_signals_source_enum" AS ENUM('FORM', 'EVENT', 'CMS', 'SUPPORT', 'CRM', 'SYSTEM')`);
        await queryRunner.query(`CREATE TABLE "bcc_signals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."bcc_signals_type_enum" NOT NULL, "source" "public"."bcc_signals_source_enum" NOT NULL, "intensity" double precision NOT NULL, "message" text, "metadata" jsonb, "tenantId" character varying NOT NULL, "userId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a4e054dbdf4e456778dbee02821" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5c330e8c5b1f46fb737f62a8b2" ON "bcc_signals" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4e003b4bab66ccdfadf5ad891f" ON "bcc_signals" ("tenantId", "createdAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_4e003b4bab66ccdfadf5ad891f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5c330e8c5b1f46fb737f62a8b2"`);
        await queryRunner.query(`DROP TABLE "bcc_signals"`);
        await queryRunner.query(`DROP TYPE "public"."bcc_signals_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."bcc_signals_type_enum"`);
    }

}
