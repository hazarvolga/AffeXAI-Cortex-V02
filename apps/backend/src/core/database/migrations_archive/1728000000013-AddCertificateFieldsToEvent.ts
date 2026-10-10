import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCertificateFieldsToEvent1728000000013 implements MigrationInterface {
    name = 'AddCertificateFieldsToEvent1760030936000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "events" ADD COLUMN "grantsCertificate" boolean NOT NULL DEFAULT false;
            EXCEPTION
                WHEN duplicate_column THEN NULL;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "events" ADD COLUMN "certificateTitle" character varying;
            EXCEPTION
                WHEN duplicate_column THEN NULL;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "events" 
            DROP COLUMN "certificateTitle"
        `);

        await queryRunner.query(`
            ALTER TABLE "events" 
            DROP COLUMN "grantsCertificate"
        `);
    }
}
