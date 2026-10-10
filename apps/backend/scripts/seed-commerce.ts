import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ProductManagementService } from '../src/modules/commerce/services/product-management.service';
import { CommerceService } from '../src/modules/commerce/services/commerce.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    // Try to get ProductManagementService, if not available (module not imported?), fallback or error.
    let productManagementService: ProductManagementService;
    let commerceService: CommerceService;

    try {
        productManagementService = app.get(ProductManagementService);
    } catch (e) {
        console.warn('ProductManagementService not found. Falling back to CommerceService (No Stripe Sync).');
        commerceService = app.get(CommerceService);
    }

    console.log('🌱 Seeding Commerce Data (4-Tier Structure)...');

    const tiers = [
        {
            name: 'Demo / Trial',
            description: 'Experience the power of AffeXAI. Free for 14 days.',
            priceAmount: 0,
            features: ['5,000 AI Tokens', '1GB Storage', 'Basic Support', '1 User'],
            metadata: { ai_tokens: 5000, storage_gb: 1, badges: ['TRIAL'], tier: 0 },
            isPublic: true
        },
        {
            name: 'Starter',
            description: 'Perfect for individuals and freelancers.',
            priceAmount: 2900, // $29.00
            features: ['50,000 AI Tokens', '10GB Storage', 'Standard Support', '3 Users'],
            metadata: { ai_tokens: 50000, storage_gb: 10, badges: ['STARTER'], tier: 1 },
            isPublic: true
        },
        {
            name: 'Pro',
            description: 'For growing teams and agencies.',
            priceAmount: 9900, // $99.00
            features: ['250,000 AI Tokens', '100GB Storage', 'Priority Support', '10 Users', 'Advanced Analytics'],
            metadata: { ai_tokens: 250000, storage_gb: 100, badges: ['PRO'], tier: 2 },
            isPublic: true
        },
        {
            name: 'Enterprise',
            description: 'Custom solutions for large organizations.',
            priceAmount: 0, // Contact Sales
            features: ['Custom AI Tokens', 'Unlimited Storage', 'Dedicated Account Manager', 'SSO', 'SLA'],
            metadata: { ai_tokens: -1, storage_gb: -1, badges: ['ENTERPRISE'], tier: 3 },
            isPublic: true
        }
    ];

    for (const t of tiers) {
        try {
            if (productManagementService) {
                // Determine priceInterval. Default month.
                // Enterprise might need special handling.
                await productManagementService.createProduct({
                    name: t.name,
                    description: t.description,
                    metadata: t.metadata,
                    features: t.features,
                    isPublic: t.isPublic,
                    priceAmount: t.priceAmount,
                    priceInterval: 'month'
                });
                console.log(`✅ Created/Synced Product: ${t.name}`);
            } else {
                // Fallback legacy create
                await commerceService.createProduct({
                    name: t.name,
                    description: t.description,
                    metadata: t.metadata,
                    features: t.features,
                    isPublic: t.isPublic
                });
                console.log(`✅ Created Product (Local Only): ${t.name}`);
            }
        } catch (error) {
            console.error(`❌ Failed to create ${t.name}:`, error.message);
            // If it failed due to Stripe, it might still have created local?
            // ProductManagementService throws, so we assume failure.
        }
    }

    console.log('🚀 Seeding Complete.');
    await app.close();
}

bootstrap();
