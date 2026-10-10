import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SubscriberService } from '../src/modules/email-marketing/subscriber/subscriber.service';
import { TenantService } from '../src/core/tenant/tenant.service';
import { NotFoundException } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const subscriberService = app.get(SubscriberService);
    const tenantService = app.get(TenantService);

    console.log('--- Starting Multi-Tenancy Isolation Verification (Email Marketing) ---');

    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';
    const emailA = 'subscriber-test-a@example.com';
    const emailB = 'subscriber-test-b@example.com';

    try {
        // Test Case 1: Tenant A
        console.log(`\nTest Case 1: Creating subscriber for ${tenantA}`);
        await tenantService.runWithTenant({ tenantId: tenantA }, async () => {
            // Create subscriber for Tenant A
            await subscriberService.create({ email: emailA });
            console.log(`✓ Created ${emailA} for ${tenantA}`);

            const sub = await subscriberService.findByEmail(emailA);
            if (sub) {
                console.log(`✓ Verified ${emailA} exists in ${tenantA}`);
            }
        });

        // Test Case 2: Tenant B
        console.log(`\nTest Case 2: Checking isolation for ${tenantB}`);
        await tenantService.runWithTenant({ tenantId: tenantB }, async () => {
            // Attempt to find subscriber from tenant A - should fail
            try {
                await subscriberService.findByEmail(emailA);
                console.error(`✗ Error: Found ${emailA} in ${tenantB}! Isolation failed.`);
                process.exit(1);
            } catch (error) {
                if (error instanceof NotFoundException) {
                    console.log(`✓ Success: ${emailA} not found in ${tenantB} (as expected)`);
                } else {
                    // If the service returns null instead of throwing, handle that too
                    console.error(`✗ Unexpected error type:`, error);
                    throw error;
                }
            }

            // Create subscriber for tenant B
            await subscriberService.create({ email: emailB });
            console.log(`✓ Created ${emailB} for ${tenantB}`);
        });

        // Test Case 3: Final Isolation Verification
        console.log(`\nTest Case 3: Verifying final isolation state`);

        await tenantService.runWithTenant({ tenantId: tenantA }, async () => {
            const subs = await subscriberService.findAll();
            const subEmails = subs.map(s => s.email);
            if (subEmails.includes(emailA) && !subEmails.includes(emailB)) {
                console.log(`✓ Tenant A sees only its own subscriber(s). Found: ${subEmails.join(', ')}`);
            } else {
                console.error(`✗ Tenant A isolation check failed. Found: ${subEmails.join(', ')}`);
                process.exit(1);
            }
        });

        await tenantService.runWithTenant({ tenantId: tenantB }, async () => {
            const subs = await subscriberService.findAll();
            const subEmails = subs.map(s => s.email);
            if (subEmails.includes(emailB) && !subEmails.includes(emailA)) {
                console.log(`✓ Tenant B sees only its own subscriber(s). Found: ${subEmails.join(', ')}`);
            } else {
                console.error(`✗ Tenant B isolation check failed. Found: ${subEmails.join(', ')}`);
                process.exit(1);
            }
        });

        console.log('\n--- Verification Completed Successfully ---');
    } catch (error) {
        console.error('An error occurred during verification:', error);
        process.exit(1);
    } finally {
        await app.close();
    }
}

bootstrap().catch(err => {
    console.error('Fatal error during bootstrap:', err);
    process.exit(1);
});
