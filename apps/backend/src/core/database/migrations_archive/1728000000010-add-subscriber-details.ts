import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";
import { MigrationHelpers } from '../utils/migration-helpers';

export class AddSubscriberDetails1728000000010 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('subscribers');

        // Check and add firstName column
        if (!table?.findColumnByName('firstName')) {
            await MigrationHelpers.addColumnIfNotExists(queryRunner, 'subscribers', new TableColumn({
                name: 'first_name',
                type: 'varchar',
                isNullable: true,
                length: '255',
            }));
        }

        // Check and add lastName column
        if (!table?.findColumnByName('lastName')) {
            await MigrationHelpers.addColumnIfNotExists(queryRunner, 'subscribers', new TableColumn({
                name: 'last_name',
                type: 'varchar',
                isNullable: true,
                length: '255',
            }));
        }

        // Check and add company column
        if (!table?.findColumnByName('company')) {
            await MigrationHelpers.addColumnIfNotExists(queryRunner, 'subscribers', new TableColumn({
                name: 'company',
                type: 'varchar',
                isNullable: true,
                length: '255',
            }));
        }

        // Check and add phone column
        if (!table?.findColumnByName('phone')) {
            await MigrationHelpers.addColumnIfNotExists(queryRunner, 'subscribers', new TableColumn({
                name: 'phone',
                type: 'varchar',
                isNullable: true,
                length: '20',
            }));
        }

        // Check and add customerStatus column
        if (!table?.findColumnByName('customerStatus')) {
            await MigrationHelpers.addColumnIfNotExists(queryRunner, 'subscribers', new TableColumn({
                name: 'customer_status',
                type: 'varchar',
                isNullable: true,
                length: '50',
            }));
        }

        // Check and add subscriptionType column
        if (!table?.findColumnByName('subscriptionType')) {
            await MigrationHelpers.addColumnIfNotExists(queryRunner, 'subscribers', new TableColumn({
                name: 'subscription_type',
                type: 'varchar',
                isNullable: true,
                length: '100',
            }));
        }

        // Check and add mailerCheckResult column
        if (!table?.findColumnByName('mailerCheckResult')) {
            await MigrationHelpers.addColumnIfNotExists(queryRunner, 'subscribers', new TableColumn({
                name: 'mailer_check_result',
                type: 'varchar',
                isNullable: true,
                length: '20',
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('subscribers');

        if (table?.findColumnByName('mailerCheckResult')) {
            await queryRunner.dropColumn('subscribers', 'mailerCheckResult');
        }

        if (table?.findColumnByName('subscriptionType')) {
            await queryRunner.dropColumn('subscribers', 'subscriptionType');
        }

        if (table?.findColumnByName('customerStatus')) {
            await queryRunner.dropColumn('subscribers', 'customerStatus');
        }

        if (table?.findColumnByName('phone')) {
            await queryRunner.dropColumn('subscribers', 'phone');
        }

        if (table?.findColumnByName('company')) {
            await queryRunner.dropColumn('subscribers', 'company');
        }

        if (table?.findColumnByName('lastName')) {
            await queryRunner.dropColumn('subscribers', 'lastName');
        }

        if (table?.findColumnByName('firstName')) {
            await queryRunner.dropColumn('subscribers', 'firstName');
        }
    }
}