
import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from '../src/core/guards/tenant.guard';
import { TenantService } from '../src/core/tenant/tenant.service';

async function testGuard() {
    console.log('🚀 Starting Tenant Guard Security Verification...');

    const tenantService = new TenantService();
    const reflector = new Reflector();
    const guard = new TenantGuard(tenantService, reflector);

    const TENANT_A = 'tenant-a-uuid';
    const TENANT_B = 'tenant-b-uuid';

    // Helper to create mock context
    const createMockContext = (user: any, headerTenantId: string): ExecutionContext => ({
        switchToHttp: () => ({
            getRequest: () => ({
                user,
                headers: { 'x-tenant-id': headerTenantId }
            }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
    } as any);

    try {
        // Test 1: Authorized access
        console.log('\n🔹 Test 1: Validating authorized access (User A -> Tenant A)...');
        const context1 = createMockContext({ id: 'user-1', tenantId: TENANT_A, roles: [] }, TENANT_A);

        // Simulate middleware setting context
        await tenantService.runWithTenant({ tenantId: TENANT_A }, () => {
            const result = guard.canActivate(context1);
            if (result === true) {
                console.log('✅ SUCCESS: Access granted correctly.');
            } else {
                throw new Error('FAILED: Access denied for authorized user.');
            }
        });

        // Test 2: Cross-tenant attack
        console.log('\n🔹 Test 2: Validating cross-tenant protection (User A -> Tenant B)...');
        const context2 = createMockContext({ id: 'user-1', tenantId: TENANT_A, roles: [] }, TENANT_B);

        // Simulate middleware setting context to Tenant B (malicious header)
        await tenantService.runWithTenant({ tenantId: TENANT_B }, () => {
            try {
                guard.canActivate(context2);
                console.error('❌ FAILURE: Access granted to another tenant!');
                process.exit(1);
            } catch (e) {
                if (e instanceof ForbiddenException) {
                    console.log('✅ SUCCESS: Cross-tenant access blocked with ForbiddenException.');
                } else {
                    throw e;
                }
            }
        });

        // Test 3: SuperAdmin bypass
        console.log('\n🔹 Test 3: Validating SuperAdmin bypass...');
        const context3 = createMockContext({
            id: 'admin-1',
            tenantId: 'any',
            roles: [{ name: 'super_admin' }]
        }, TENANT_B);

        await tenantService.runWithTenant({ tenantId: TENANT_B }, () => {
            const result = guard.canActivate(context3);
            if (result === true) {
                console.log('✅ SUCCESS: SuperAdmin permitted cross-tenant access.');
            } else {
                throw new Error('FAILED: SuperAdmin blocked.');
            }
        });

        // Test 4: Missing user tenantId
        console.log('\n🔹 Test 4: Validating user without tenant context...');
        const context4 = createMockContext({ id: 'user-no-tenant', roles: [] }, TENANT_A);

        await tenantService.runWithTenant({ tenantId: TENANT_A }, () => {
            try {
                guard.canActivate(context4);
                console.error('❌ FAILURE: Access granted to user without tenant context!');
                process.exit(1);
            } catch (e) {
                if (e instanceof ForbiddenException) {
                    console.log('✅ SUCCESS: User without tenant blocked.');
                } else {
                    throw e;
                }
            }
        });

        console.log('\n🎉 ALL SECURITY GUARD TESTS PASSED!');

    } catch (error) {
        console.error('\n❌ SECURITY TEST FAILED:', error);
        process.exit(1);
    }
}

testGuard();
