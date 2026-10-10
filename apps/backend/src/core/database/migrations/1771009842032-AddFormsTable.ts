import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFormsTable1771009842032 implements MigrationInterface {
    name = 'AddFormsTable1771009842032'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "forms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" character varying NOT NULL, "name" character varying NOT NULL, "description" text, "structure" jsonb NOT NULL, "settings" jsonb, "logicConfig" jsonb, "status" character varying NOT NULL DEFAULT 'draft', "submissionCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba062fd30b06814a60756f233da" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "form_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" character varying NOT NULL, "formId" uuid NOT NULL, "data" jsonb NOT NULL, "submittedBy" character varying, "ipAddress" character varying, "submittedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fb6e1e9f26cda31c358a8a1530e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "form_submissions" ADD CONSTRAINT "FK_6bb44ead8acd515f1333e5309bf" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "form_submissions" DROP CONSTRAINT "FK_6bb44ead8acd515f1333e5309bf"`);
        await queryRunner.query(`DROP TABLE "form_submissions"`);
        await queryRunner.query(`DROP TABLE "forms"`);
    }

}
