import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../core/auth/auth.service';
import { TenantService } from '../core/tenant/tenant.service';
import { LoginDto } from '../core/auth/dto/login.dto';

async function bootstrap() {
    console.log('🐞 Starting Real AuthService Login Debug...');

    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(AuthService);
    const tenantService = app.get(TenantService);

    const loginDto: LoginDto = {
        email: 'superuser@affexai.com',
        password: 'SuperUser123!',
    };

    // Simulate "default" tenant context
    await tenantService.runWithTenant({ tenantId: 'default' }, async () => {
        console.log('\n🌍 Context: Tenant = default');
        console.log(`👉 Calling AuthService.login('${loginDto.email}')...`);

        try {
            const result = await authService.login(loginDto);

            if (result) {
                console.log('✅ login SUCCEEDED!');
                console.log('   Access Token:', result.access_token ? '(present)' : '(missing)');
                console.log('   User ID:', result.user?.id);
                console.log('   User Tenant:', (result.user as any)?.tenantId); // tenants might not be in user response depending on DTO
            } else {
                console.error('❌ login returned NULL');
            }
        } catch (error) {
            console.error('❌ login THREW Error:', error);
            if (error.response) {
                console.error('   Response:', error.response);
            }
        }
    });

    await app.close();
}

bootstrap();
