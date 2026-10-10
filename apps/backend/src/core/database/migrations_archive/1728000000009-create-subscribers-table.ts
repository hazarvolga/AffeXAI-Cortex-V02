import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateSubscribersTable1728000000009 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await MigrationHelpers.createTableIfNotExists(queryRunner, 
            new Table({
                name: "subscribers",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "uuid",
                    },
                    {
                        name: "email",
                        type: "varchar",
                        isUnique: true,
                        length: "255",
                    },
                    {
                        name: "status",
                        type: "varchar",
                        length: "20",
                        default: "'pending'",
                    },
                    {
                        name: "groups",
                        type: "json",
                        isNullable: true,
                    },
                    {
                        name: "segments",
                        type: "json",
                        isNullable: true,
                    },
                    {
                        name: "subscribed_at",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "last_updated",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: 'deleted_at',
                        type: "timestamp",
                        isNullable: true,
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
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("subscribers");
    }
}