
import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from '../src/modules/users/users.service';
import { UserRolesService } from '../src/modules/users/user-roles.service';
import { TenantModule } from '../src/core/tenant/tenant.module';
import { TenantService } from '../src/core/tenant/tenant.service';
import { User } from '../src/modules/users/entities/user.entity';
import { UserRole } from '../src/modules/users/entities/user-role.entity';
import { Role } from '../src/modules/roles/entities/role.entity';
import { CreateUserDto } from '../src/modules/users/dto/create-user.dto';
import { AuthUtilsService } from '../src/shared/auth-utils.service';
import { CacheService } from '../src/shared/services/cache.service';
import { RolesService } from '../src/modules/roles/roles.service';
import { CrmService } from '../src/modules/crm/crm.service';
import { UserEmailService } from '../src/modules/users/services/user-email.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as path from 'path';

// Mock Services (Vanilla JS)
const mockAuthUtilsService = {
    hashPassword: async () => 'hashed_password',
};

const mockCacheService = {
    get: async () => null,
    set: async () => true,
    del: async () => true,
};

const mockRolesService = {
    findAll: async () => [
        { id: 'role-viewer-id', name: 'viewer' },
        { id: 'role-customer-id', name: 'customer' }
    ],
    findOne: async () => ({ id: 'role-viewer-id', name: 'viewer' }),
    findByIds: async () => [{ id: 'role-viewer-id', name: 'viewer' }],
};

const mockCrmService = {
    isCustomerEmail: async () => false,
};

const mockUserEmailService = {
    sendWelcomeEmail: async () => true,
};

const mockEventEmitter = {
    emit: () => { },
};

async function bootstrap() {
    console.log('🚀 Starting Tenant Isolation Verification...');

    const entitiesPath = path.join(__dirname, '../src/**/*.entity.ts');

    const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env'],
            }),
            TenantModule,
            TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432', 10),
                username: process.env.DATABASE_USERNAME || process.env.DB_USERNAME || 'postgres',
                password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
                database: process.env.DATABASE_NAME || process.env.DB_NAME || 'affexai_dev',
                entities: [entitiesPath],
                synchronize: false,
                autoLoadEntities: true,
                logging: ['error'],
            }),
            TypeOrmModule.forFeature([User, UserRole, Role]),
        ],
        providers: [
            UsersService,
            UserRolesService,
            { provide: AuthUtilsService, useValue: mockAuthUtilsService },
            { provide: CacheService, useValue: mockCacheService },
            { provide: RolesService, useValue: mockRolesService },
            { provide: CrmService, useValue: mockCrmService },
            { provide: UserEmailService, useValue: mockUserEmailService },
            { provide: EventEmitter2, useValue: mockEventEmitter },
        ],
    }).compile();

    const usersService = moduleRef.get<UsersService>(UsersService);
    const tenantService = moduleRef.get<TenantService>(TenantService);

    const testEmail = `test-iso-mock-${Date.now()}@example.com`;
    const tenantA = 'tenant-a-uuid';
    const tenantB = 'tenant-b-uuid';

    try {
        console.log('--- STARTING VERIFICATION LOGS ---');

        // 1. Create User in Tenant A
        console.log(`\n🔹 Test 1: Creating user in Tenant A (${tenantA})...`);
        tenantService.setTenantId(tenantA);

        const userA = await usersService.create({
            firstName: 'Tenant',
            lastName: 'A User',
            email: testEmail,
            password: 'Password123!',
        } as any);
        console.log(`✅ User A created: ID=${userA.id}, Tenant=${userA.tenantId}`);

        // 2. Create User in Tenant B
        console.log(`\n🔹 Test 2: Creating user in Tenant B (${tenantB})...`);
        tenantService.setTenantId(tenantB);

        const userB = await usersService.create({
            firstName: 'Tenant',
            lastName: 'B User',
            email: testEmail, // Same email allowed in different tenants
            password: 'Password123!',
        } as any);
        console.log(`✅ User B created: ID=${userB.id}, Tenant=${userB.tenantId}`);

        // 3. Verify Isolation from Tenant A
        console.log(`\n🔹 Test 3: Verifying isolation from Tenant A context...`);
        tenantService.setTenantId(tenantA);
        const usersInA = await usersService.findAll();
        console.log(`Found ${usersInA.length} users in Tenant A`);

        const foundBInA = usersInA.find(u => u.id === userB.id);
        if (foundBInA) {
            console.error('❌ FAILURE: Tenant B user leaked into Tenant A!');
            process.exit(1);
        } else {
            console.log('✅ SUCCESS: Tenant B user is NOT visible in Tenant A.');
        }

        // 4. Verify findOne Isolation
        console.log(`\n🔹 Test 4: Verifying findOne isolation...`);
        const result = await usersService.findOne(userB.id);
        if (result) {
            console.error('❌ FAILURE: findOne retrieved user from another tenant!');
            process.exit(1);
        } else {
            console.log('✅ SUCCESS: findOne correctly returned null for cross-tenant access.');
        }

        console.log('\n🎉 ALL TENANT ISOLATION TESTS PASSED!');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        process.exit(1);
    } finally {
        await moduleRef.close();
    }
}

bootstrap();
