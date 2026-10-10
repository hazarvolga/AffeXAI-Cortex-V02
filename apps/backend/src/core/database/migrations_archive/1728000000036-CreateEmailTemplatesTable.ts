import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateEmailTemplatesTable1728000000036 implements MigrationInterface {
    name = 'CreateEmailTemplatesTable1728000000036'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await MigrationHelpers.createTableIfNotExists(queryRunner, new Table({
            name: "email_templates",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "uuid",
                },
                {
                    name: "name",
                    type: "varchar",
                },
                {
                    name: "slug",
                    type: "varchar",
                    isUnique: true,
                },
                {
                    name: "subject",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "content",
                    type: "text",
                    isNullable: true,
                },
                {
                    name: "file_template_name",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "variables",
                    type: "jsonb",
                    isNullable: true,
                    default: "'[]'",
                },
                {
                    name: "is_active",
                    type: "boolean",
                    default: true,
                },
                {
                    name: 'created_at',
                    type: "timestamp",
                    default: "now()",
                },
                {
                    name: 'updated_at',
                    type: "timestamp",
                    default: "now()",
                },
            ],
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("email_templates");
    }
}
