
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Product } from '../modules/commerce/entities/product.entity';
import { Price } from '../modules/commerce/entities/price.entity';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'affexai_dev',
    entities: [Product, Price],
    synchronize: false,
});

const packages = [
    {
        name: 'Starter',
        description: 'Perfect for small teams getting started.',
        stripeProductId: 'prod_starter', // Placeholder, will be updated by sync logic later or manually
        active: true,
        metadata: {
            max_users: 3,
            max_emails_monthly: 5000,
            max_ai_requests_monthly: 1000,
            max_storage_gb: 10
        },
        features: ['basic_analytics', 'community_support'],
        prices: [
            { amount: 3900, currency: 'eur', interval: 'month', stripePriceId: 'price_starter_month' },
            { amount: 2900 * 12, currency: 'eur', interval: 'year', stripePriceId: 'price_starter_year' }
        ]
    },
    {
        name: 'Growth',
        description: 'For growing brands and agencies.',
        stripeProductId: 'prod_growth',
        active: true,
        metadata: {
            max_users: 10,
            max_emails_monthly: 50000,
            max_ai_requests_monthly: 10000,
            max_storage_gb: 50
        },
        features: ['advanced_analytics', 'priority_support', 'automation_rules'],
        prices: [
            { amount: 12900, currency: 'eur', interval: 'month', stripePriceId: 'price_growth_month' },
            { amount: 9900 * 12, currency: 'eur', interval: 'year', stripePriceId: 'price_growth_year' }
        ]
    },
    {
        name: 'Scale',
        description: 'For high-volume enterprises.',
        stripeProductId: 'prod_scale',
        active: true,
        metadata: {
            max_users: 30, // Or unlimited logic handled in service
            max_emails_monthly: 250000,
            max_ai_requests_monthly: 50000,
            max_storage_gb: 500
        },
        features: ['sla', 'dedicated_onboarding', 'custom_ai_models'],
        prices: [
            { amount: 39900, currency: 'eur', interval: 'month', stripePriceId: 'price_scale_month' }
            // Custom yearly
        ]
    },
    {
        name: 'AI Add-on (+5k)',
        description: 'Additional 5,000 AI requests.',
        stripeProductId: 'prod_ai_5k',
        active: true,
        metadata: {
            ai_credits: 5000,
            type: 'addon'
        },
        features: [],
        prices: [
            { amount: 1900, currency: 'eur', interval: 'month', stripePriceId: 'price_ai_5k' }
        ]
    }
];

async function seed() {
    await AppDataSource.initialize();
    console.log('Database connected.');

    const productRepo = AppDataSource.getRepository(Product);
    const priceRepo = AppDataSource.getRepository(Price);

    for (const pkg of packages) {
        let product = await productRepo.findOne({ where: { name: pkg.name } });

        if (!product) {
            console.log(`Creating product: ${pkg.name}`);
            product = productRepo.create({
                name: pkg.name,
                description: pkg.description,
                stripeProductId: pkg.stripeProductId,
                active: pkg.active,
                metadata: pkg.metadata,
                features: pkg.features,
                isPublic: true
            });
            await productRepo.save(product);
        } else {
            console.log(`Updating product: ${pkg.name}`);
            product.metadata = pkg.metadata;
            product.features = pkg.features;
            await productRepo.save(product);
        }

        // Create Prices
        for (const priceData of pkg.prices) {
            const existingPrice = await priceRepo.findOne({
                where: { stripePriceId: priceData.stripePriceId }
            });

            if (!existingPrice) {
                console.log(`Creating price for ${pkg.name}: ${priceData.amount} ${priceData.currency}`);
                const price = priceRepo.create({
                    ...priceData,
                    product: product,
                    amount: priceData.amount / 100 // Convert cents to decimal if entity uses decimal, or keep as is? Entity uses decimal(10,2). 3900 -> 39.00
                });
                await priceRepo.save(price);
            }
        }
    }

    console.log('Seeding complete.');
    await AppDataSource.destroy();
}

seed().catch(console.error);
