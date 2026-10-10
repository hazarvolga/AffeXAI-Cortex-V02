import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../core/auth/auth.service';
import { TenantService } from '../core/tenant/tenant.service';

async function bootstrap() {
    console.log('🐞 Starting Real AuthService Debug...');

    // Create application context (no HTTP server)
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(AuthService);
    const tenantService = app.get(TenantService);

    const email = 'superuser@affexai.com';
    const password = 'SuperUser123!';

    // Simulate "default" tenant context (as if request came from public domain)
    await tenantService.runWithTenant({ tenantId: 'default' }, async () => {
        console.log('\n🌍 Context: Tenant = default');
        console.log(`👉 Calling AuthService.validateUser('${email}')...`);

        try {
            const user = await authService.validateUser(email, password);

            if (user) {
                console.log('✅ validateUser SUCCEEDED!');
                console.log('   User ID:', user.id);
                console.log('   User Tenant:', user.tenantId);
                console.log('   User Role:', user.roleEntity?.name);
            } else {
                console.error('❌ validateUser returned NULL');
            }
        } catch (error) {
            console.error('❌ validateUser THREW Error:', error);
        }
    });

    await app.close();
}

bootstrap();
