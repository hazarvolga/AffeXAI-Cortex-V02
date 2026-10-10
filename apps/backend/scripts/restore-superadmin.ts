
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import { Notification } from '../src/modules/notifications/entities/notification.entity';
import { Role } from '../src/modules/roles/entities/role.entity';
import { RoleTemplate } from '../src/modules/roles/entities/role-template.entity';
import { UserRole } from '../src/modules/users/entities/user-role.entity';
import { Organization } from '../src/modules/organizations/entities/organization.entity';
import { AuthUtilsService } from '../src/shared/auth-utils.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

function requiredStrongPassword(name: string): string {
    const value = process.env[name];
    if (!value || value.length < 16) {
        throw new Error(`${name} must be set to a password of at least 16 characters`);
    }
    return value;
}

async function restoreSuperAdmin() {
    console.log('🚀 Starting SuperAdmin Restoration...');

    const SUPER_EMAIL = process.env.SUPERUSER_EMAIL || 'superuser@affexai.com';
    const superuserPassword = requiredStrongPassword('SUPERUSER_PASSWORD');

    const AppDataSource = new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5434', 10),
        username: process.env.DATABASE_USERNAME || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'affexai_dev',
        entities: [User, Notification, Role, RoleTemplate, UserRole, Organization],
        synchronize: false,
    });

    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected.');
    } catch (err: any) {
        console.error('❌ Failed to connect to DB:', err.message);
        process.exit(1);
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const roleRepository = AppDataSource.getRepository(Role);
        const userRoleRepository = AppDataSource.getRepository(UserRole);
        const authUtils = new AuthUtilsService();

        const ROLE_NAME = 'super_admin';
        const DEFAULT_TENANT_ID = 'default';
        const DEFAULT_ORG_NAME = 'Affexai';
        const DEFAULT_ORG_ID = '201c634b-ab68-48bb-82b0-2df807ffefab';

        // 1. Ensure Organization Exists
        let org = await AppDataSource.getRepository(Organization).findOne({ where: { slug: DEFAULT_TENANT_ID } });
        if (!org) {
            console.log(`🔹 Creating organization: ${DEFAULT_ORG_NAME}...`);
            org = AppDataSource.getRepository(Organization).create({
                id: DEFAULT_ORG_ID,
                name: DEFAULT_ORG_NAME,
                slug: DEFAULT_TENANT_ID,
                isActive: true,
            });
            await AppDataSource.getRepository(Organization).save(org);
        } else if (org.name !== DEFAULT_ORG_NAME) {
            console.log(`🔹 Updating organization name to: ${DEFAULT_ORG_NAME}...`);
            org.name = DEFAULT_ORG_NAME;
            await AppDataSource.getRepository(Organization).save(org);
        }
        console.log('✅ Organization verified.');

        // 2. Ensure Role Exists (Infrastructure Level)
        let superRole = await roleRepository.findOne({ where: { name: ROLE_NAME, tenantId: null } });
        if (!superRole) {
            console.log(`🔹 Creating infrastructure role: ${ROLE_NAME}...`);
            superRole = roleRepository.create({
                name: ROLE_NAME,
                displayName: 'Super Administrator',
                description: 'Global infrastructure administrator',
                tenantId: null,
                isCustom: false,
                permissions: ['*'],
            });
            superRole = await roleRepository.save(superRole);
        }
        console.log('✅ SuperAdmin role verified.');

        // 2. Resolve User
        let superUser = await userRepository.findOne({ where: { email: SUPER_EMAIL } });
        const hashedPassword = await authUtils.hashPassword(superuserPassword);

        if (superUser) {
            console.log(`🔹 Updating existing user: ${SUPER_EMAIL}...`);
            superUser.tenantId = DEFAULT_TENANT_ID;
            superUser.organizationId = org.id;
            superUser.password = hashedPassword;
            superUser.isActive = true;
            superUser.emailVerified = true;
            superUser = await userRepository.save(superUser);
        } else {
            console.log(`🔹 Creating new SuperAdmin user: ${SUPER_EMAIL}...`);
            superUser = userRepository.create({
                email: SUPER_EMAIL,
                password: hashedPassword,
                firstName: 'Super',
                lastName: 'Admin',
                tenantId: DEFAULT_TENANT_ID,
                organizationId: org.id,
                isActive: true,
                emailVerified: true,
            });
            superUser = await userRepository.save(superUser);
        }
        console.log('✅ SuperUser account verified.');

        // 3. Link Role
        const existingLink = await userRoleRepository.findOne({
            where: { userId: superUser.id, roleId: superRole.id }
        });

        if (!existingLink) {
            console.log('🔹 Creating role assignment...');
            const userRole = userRoleRepository.create({
                userId: superUser.id,
                roleId: superRole.id,
                isPrimary: true,
            });
            await userRoleRepository.save(userRole);
        }
        console.log('✅ Role assignment verified.');

        console.log('\n🎉 SUPERADMIN RESTORATION COMPLETE!');
        console.log(`📧 Email: ${SUPER_EMAIL}`);
        console.log('🔑 Password was read from SUPERUSER_PASSWORD and was not logged.');

    } catch (error: any) {
        console.error('\n❌ RESTORATION FAILED:', error.message);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

restoreSuperAdmin();
