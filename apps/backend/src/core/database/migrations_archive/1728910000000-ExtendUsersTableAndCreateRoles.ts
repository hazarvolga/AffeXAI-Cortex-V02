import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableColumn } from "typeorm";
import { MigrationHelpers } from '../utils/migration-helpers';

export class ExtendUsersTableAndCreateRoles1728910000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add roleId column to users table
        await MigrationHelpers.addColumnIfNotExists(queryRunner, 'users', new TableColumn({
            name: 'role_id',
            type: 'uuid',
            isNullable: true,
        }));

        // Add foreign key to roles table
        await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 'users', new TableForeignKey({
            columnNames: ['role_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'roles',
            onDelete: 'SET NULL',
        }));

        // Seed default system roles
        // Note: Using is_active (snake_case) to match DB schema
        // Note: Removed isSystem as it doesn't represent the current schema (is_custom exists, defaults to false)
        await queryRunner.query(`
            INSERT INTO roles (id, name, "displayName", description, permissions, is_active, created_at, updated_at)
            VALUES
            -- Admin Role
            (
                'a1b2c3d4-e5f6-4789-abcd-000000000001',
                'admin',
                'Admin',
                'Tüm sistem üzerinde tam yetkiye sahip.',
                '["users.view","users.create","users.edit","users.delete","roles.view","roles.manage","events.view","events.create","events.edit","events.delete","events.manage_attendees","certificates.view","certificates.create","certificates.edit","certificates.revoke","support.view_all","support.assign","support.reply","marketing.manage_campaigns","marketing.manage_newsletters","marketing.manage_social","cms.view","cms.create","cms.edit","cms.delete","cms.manage_menus","settings.manage"]'::jsonb,
                true,
                NOW(),
                NOW()
            ),
            -- Editor Role
            (
                'a1b2c3d4-e5f6-4789-abcd-000000000002',
                'editor',
                'Editor',
                'İçerik (CMS), etkinlik ve sertifika yönetimi yapabilir.',
                '["events.view","events.create","events.edit","events.delete","events.manage_attendees","certificates.view","certificates.create","certificates.edit","certificates.revoke","cms.view","cms.create","cms.edit","cms.delete","cms.manage_menus"]'::jsonb,
                true,
                NOW(),
                NOW()
            ),
            -- Customer Role
            (
                'a1b2c3d4-e5f6-4789-abcd-000000000003',
                'customer',
                'Customer',
                'Normal müşteri kullanıcı.',
                '["events.view","certificates.view"]'::jsonb,
                true,
                NOW(),
                NOW()
            ),
            -- Support Team Role
            (
                'a1b2c3d4-e5f6-4789-abcd-000000000004',
                'support',
                'Support Team',
                'Destek taleplerini yönetir ve yanıtlar.',
                '["support.view_all","support.assign","support.reply"]'::jsonb,
                true,
                NOW(),
                NOW()
            ),
            -- Viewer Role
            (
                'a1b2c3d4-e5f6-4789-abcd-000000000005',
                'viewer',
                'Viewer',
                'Sadece görüntüleme yetkisi.',
                '["users.view","events.view","certificates.view"]'::jsonb,
                true,
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO NOTHING
        `);

        // Update existing users' role field to roleId (map string roles to role IDs)
        await queryRunner.query(`
            UPDATE users SET "role_id" = (
                CASE 
                    WHEN role = 'Admin' THEN 'a1b2c3d4-e5f6-4789-abcd-000000000001'::uuid
                    WHEN role = 'Editor' THEN 'a1b2c3d4-e5f6-4789-abcd-000000000002'::uuid
                    WHEN role = 'Customer' THEN 'a1b2c3d4-e5f6-4789-abcd-000000000003'::uuid
                    WHEN role = 'Support Team' THEN 'a1b2c3d4-e5f6-4789-abcd-000000000004'::uuid
                    WHEN role = 'Viewer' THEN 'a1b2c3d4-e5f6-4789-abcd-000000000005'::uuid
                    ELSE 'a1b2c3d4-e5f6-4789-abcd-000000000003'::uuid -- Default to Customer
                END
            )
            WHERE "role_id" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reset users roleId
        await queryRunner.query(`UPDATE users SET "role_id" = NULL`);

        // Delete seeded roles
        await queryRunner.query(`
            DELETE FROM roles WHERE id IN (
                'a1b2c3d4-e5f6-4789-abcd-000000000001',
                'a1b2c3d4-e5f6-4789-abcd-000000000002',
                'a1b2c3d4-e5f6-4789-abcd-000000000003',
                'a1b2c3d4-e5f6-4789-abcd-000000000004',
                'a1b2c3d4-e5f6-4789-abcd-000000000005'
            )
        `);
    }
}
