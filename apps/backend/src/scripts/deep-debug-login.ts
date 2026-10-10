import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { AuthService } from '../core/auth/auth.service';
import { TenantService } from '../core/tenant/tenant.service';

/*
  DEEP DEBUG LOGIN SCRIPT
  Replicates AuthService.login logic step-by-step
*/
async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);
    const authService = app.get(AuthService);
    const tenantService = app.get(TenantService);

    const email = 'superuser@affexai.com';
    const password = 'SuperUser123!';

    console.log('🐞 Starting Deep Debug of Login Flow...');

    // Simulate Tenant Context as 'default' (like Middleware does)
    await tenantService.runWithTenant({ tenantId: 'default' }, async () => {
        console.log('🌍 Context: Tenant = default');

        // 1. replicate AuthService.validateUser
        console.log('\n--- Step 1: validateUser ---');
        // We manually assume the logic inside validateUser because we want to see intermediate values
        // Logic: scoped find -> null -> global find -> user

        let user = await usersService.findByEmail(email, undefined, true); // Scoped, skip cache
        if (user) {
            console.log('❌ UNEXPECTED: Scoped find (default tenant) found user?');
            console.log('User Tenant:', user.tenantId);
        } else {
            console.log('✅ Scoped find (default tenant) returned null (Correct)');
        }

        if (!user) {
            console.log('👉 Trying Global Find...');
            user = await usersService.findByEmail(email, undefined, false, true); // Global
        }

        if (!user) {
            console.error('❌ Global Find returned null! Aborting.');
            return;
        }

        console.log('✅ User Found via Global Search');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   TenantId: '${user.tenantId}' (Type: ${typeof user.tenantId})`);

        // Verify properties after spread (simulating return result of validateUser)
        const { password: _, ...result } = user;
        console.log('   Result Object keys:', Object.keys(result));
        console.log(`   Result TenantId: '${(result as any).tenantId}'`);

        // 2. replicate AuthService.login
        console.log('\n--- Step 2: AuthService.login (findOne) ---');
        const validatedUser = result as any;

        console.log(`👉 Calling usersService.findOne(${validatedUser.id}, '${validatedUser.tenantId}')`);

        try {
            const fullUser = await usersService.findOne(validatedUser.id, validatedUser.tenantId);
            console.log('✅ findOne Succeeded!');
            console.log(`   Fetched User Tenant: ${fullUser.tenantId}`);
        } catch (e) {
            console.error('❌ findOne FAILED');
            console.error('   Error:', e.message);
            console.error('   Stack:', e.stack);

            // Diagnosis
            if (validatedUser.tenantId === undefined) {
                console.error('🚨 DIAGNOSIS: tenantId was undefined, so findOne fell back to context "default"');
            } else if (validatedUser.tenantId === 'default') {
                console.error('🚨 DIAGNOSIS: tenantId was "default", which is wrong for this user');
            } else {
                console.error('🚨 DIAGNOSIS: tenantId was passed correctly but TypeORM query failed?');
            }
        }

    });

    await app.close();
}

bootstrap();
