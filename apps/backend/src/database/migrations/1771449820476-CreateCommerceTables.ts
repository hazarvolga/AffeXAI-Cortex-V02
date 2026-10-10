import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateCommerceTables1771449820476 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Products Table
        await queryRunner.createTable(new Table({
            name: "products",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, isGenerated: true, generationStrategy: "uuid" },
                { name: "stripeProductId", type: "varchar", isNullable: true, isUnique: true },
                { name: "name", type: "varchar" },
                { name: "description", type: "text", isNullable: true },
                { name: "active", type: "boolean", default: true },
                { name: "isPublic", type: "boolean", default: true },
                { name: "metadata", type: "jsonb", isNullable: true }, // For limits
                { name: "features", type: "jsonb", isNullable: true },
                { name: "createdAt", type: "timestamp", default: "now()" },
                { name: "updatedAt", type: "timestamp", default: "now()" }
            ]
        }), true); // ifNotExists: true

        // 2. Prices Table
        await queryRunner.createTable(new Table({
            name: "prices",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, isGenerated: true, generationStrategy: "uuid" },
                { name: "stripePriceId", type: "varchar", isNullable: true, isUnique: true },
                { name: "productId", type: "uuid" },
                { name: "amount", type: "decimal", precision: 10, scale: 2 },
                { name: "currency", type: "varchar", default: "'usd'" },
                { name: "interval", type: "varchar", default: "'month'" }, // month, year
                { name: "active", type: "boolean", default: true },
                { name: "createdAt", type: "timestamp", default: "now()" }
            ]
        }), true);

        // Check if FK exists before creating to avoid errors if table existed but FK didn't? 
        // TypeORM's createTable doesn't handle FK idempotency inside the table options well if table exists.
        // So we add FK separately with checks, OR just trust createTable(..., true).
        // Let's add them separately for safety.

        const pricesTable = await queryRunner.getTable("prices");
        const foreignKey = pricesTable.foreignKeys.find(fk => fk.columnNames.indexOf("productId") !== -1);
        if (!foreignKey) {
            await queryRunner.createForeignKey("prices", new TableForeignKey({
                columnNames: ["productId"],
                referencedColumnNames: ["id"],
                referencedTableName: "products",
                onDelete: "CASCADE"
            }));
        }

        // 3. Subscriptions Table
        await queryRunner.createTable(new Table({
            name: "subscriptions",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, isGenerated: true, generationStrategy: "uuid" },
                { name: "tenantId", type: "varchar" }, // Links to Tenant
                { name: "stripeSubscriptionId", type: "varchar", isUnique: true },
                { name: "stripeCustomerId", type: "varchar", isNullable: true },
                { name: "priceId", type: "uuid" },
                { name: "status", type: "varchar", default: "'active'" }, // active, past_due, canceled
                { name: "currentPeriodStart", type: "timestamp", isNullable: true },
                { name: "currentPeriodEnd", type: "timestamp", isNullable: true },
                { name: "cancelAtPeriodEnd", type: "boolean", default: false },
                { name: "createdAt", type: "timestamp", default: "now()" },
                { name: "updatedAt", type: "timestamp", default: "now()" }
            ]
        }), true);

        const subscriptionsTable = await queryRunner.getTable("subscriptions");
        const subForeignKey = subscriptionsTable.foreignKeys.find(fk => fk.columnNames.indexOf("priceId") !== -1);
        if (!subForeignKey) {
            await queryRunner.createForeignKey("subscriptions", new TableForeignKey({
                columnNames: ["priceId"],
                referencedColumnNames: ["id"],
                referencedTableName: "prices",
                onDelete: "RESTRICT"
            }));
        }

        // 4. Usage Records Table
        await queryRunner.createTable(new Table({
            name: "usage_records",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, isGenerated: true, generationStrategy: "uuid" },
                { name: "tenantId", type: "varchar" },
                { name: "serviceName", type: "varchar" }, // 'ai', 'email'
                { name: "action", type: "varchar" },
                { name: "tokensUsed", type: "int", default: 0 },
                { name: "timestamp", type: "timestamp", default: "now()" }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Safe Drop
        await queryRunner.dropTable("usage_records", true);
        await queryRunner.dropTable("subscriptions", true);
        await queryRunner.dropTable("prices", true);
        await queryRunner.dropTable("products", true);
    }

}
