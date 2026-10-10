import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateEmailSuppressionTable1728000000015 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await MigrationHelpers.createTableIfNotExists(queryRunner, 
            new Table({
                name: "email_suppressions",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "email",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                    },
                    {
                        name: "reason",
                        type: "text",
                        isNullable: false,
                    },
                    {
                        name: "provider",
                        type: "varchar",
                        length: "50",
                        isNullable: false,
                    },
                    {
                        name: "event_type",
                        type: "enum",
                        enum: [
                            "delivered",
                            "bounced",
                            "soft_bounced",
                            "opened",
                            "clicked",
                            "complained",
                            "spam",
                            "unsubscribed",
                            "dropped",
                            "deferred",
                        ],
                        isNullable: false,
                    },
                    {
                        name: "bounce_reason",
                        type: "enum",
                        enum: [
                            "mailbox_not_found",
                            "domain_not_found",
                            "recipient_rejected",
                            "mailbox_full",
                            "message_too_large",
                            "temporary_failure",
                            "blocked",
                            "unknown",
                        ],
                        isNullable: true,
                    },
                    {
                        name: "suppressed_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        isNullable: false,
                    },
                    {
                        name: "metadata",
                        type: "json",
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Create unique index on email (IF NOT EXISTS to prevent duplicate errors)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_email_suppressions_email_unique" 
            ON "email_suppressions" ("email")
        `);

        // Create index for faster lookups
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_email_suppressions_provider" 
            ON "email_suppressions" ("provider")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("email_suppressions");
    }
}
