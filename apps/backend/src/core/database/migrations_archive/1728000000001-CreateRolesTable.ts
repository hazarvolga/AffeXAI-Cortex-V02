import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateRolesTable1728000000001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await MigrationHelpers.createTableIfNotExists(queryRunner, 
            new Table({
                name: "roles",
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
                        length: "100",
                        isUnique: true,
                    },
                    {
                        name: "display_name",
                        type: "varchar",
                        length: "100",
                    },
                    {
                        name: "description",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "permissions",
                        type: "jsonb",
                        default: "'[]'",
                    },
                    {
                        name: "is_active",
                        type: "boolean",
                        default: true,
                    },
                    {
                        name: "is_system",
                        type: "boolean",
                        default: false,
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
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("roles");
    }

}
