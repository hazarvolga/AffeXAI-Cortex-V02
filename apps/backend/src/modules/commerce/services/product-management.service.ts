import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Price } from '../entities/price.entity';
import { StripeProvider } from './stripe.provider';
import { usdToCents } from './usd-amount';

@Injectable()
export class ProductManagementService {
    private readonly logger = new Logger(ProductManagementService.name);

    constructor(
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
        @InjectRepository(Price)
        private priceRepo: Repository<Price>,
        private stripeProvider: StripeProvider,
    ) { }

    async createProduct(data: Partial<Product> & { priceAmount: number; priceInterval: string }) {
        const amountInCents = usdToCents(data.priceAmount);
        // 1. Create Local Product
        const product = this.productRepo.create({
            name: data.name,
            description: data.description,
            metadata: data.metadata,
            features: data.features,
            isPublic: data.isPublic ?? true,
            active: true
        });
        const savedProduct = await this.productRepo.save(product);

        // 2. Sync to Stripe
        try {
            const stripeResult = await this.stripeProvider.syncProduct(
                savedProduct.name,
                savedProduct.description,
                amountInCents,
                savedProduct.metadata as Record<string, string>,
                undefined, // New product
                undefined
            );

            // 3. Update Local with Stripe IDs
            savedProduct.stripeProductId = stripeResult.product.id;
            await this.productRepo.save(savedProduct);

            // 4. Create Local Price
            const price = this.priceRepo.create({
                product: savedProduct,
                productId: savedProduct.id,
                amount: data.priceAmount,
                interval: data.priceInterval || 'month',
                currency: 'usd',
                stripePriceId: stripeResult.price.id,
                active: true
            });
            await this.priceRepo.save(price);

            return { product: savedProduct, price };
        } catch (error) {
            this.logger.error(`Failed to sync product ${savedProduct.name} to Stripe`, error.stack);
            // Optionally rollback or mark as sync_failed
            throw error;
        }
    }

    async updateProduct(id: string, data: Partial<Product> & { priceAmount?: number }) {
        const product = await this.productRepo.findOne({ where: { id }, relations: ['prices'] });
        if (!product) throw new NotFoundException('Product not found');

        const activePrice = product.prices.find(p => p.active);
        const storedAmount = activePrice ? Number(activePrice.amount) : undefined;
        const priceAmount = data.priceAmount !== undefined ? data.priceAmount : storedAmount;
        const amountInCents = usdToCents(priceAmount);

        // Update fields
        if (data.name) product.name = data.name;
        if (data.description) product.description = data.description;
        if (data.metadata) product.metadata = data.metadata;
        if (data.features) product.features = data.features;
        if (data.isPublic !== undefined) product.isPublic = data.isPublic;

        await this.productRepo.save(product);

        // Sync to Stripe

        try {
            const stripeResult = await this.stripeProvider.syncProduct(
                product.name,
                product.description,
                amountInCents,
                product.metadata as Record<string, string>,
                product.stripeProductId,
                priceAmount !== storedAmount ? undefined : activePrice?.stripePriceId
            );

            // If price changed, we got a new stripe price ID.
            if (stripeResult.price.id !== activePrice?.stripePriceId) {
                // Archive old price locally
                if (activePrice) {
                    activePrice.active = false;
                    await this.priceRepo.save(activePrice);
                }

                // Create new price locally
                const newPrice = this.priceRepo.create({
                    product,
                    productId: product.id,
                    amount: priceAmount,
                    interval: activePrice?.interval || 'month',
                    currency: 'usd',
                    stripePriceId: stripeResult.price.id,
                    active: true
                });
                await this.priceRepo.save(newPrice);
            }

            return product;
        } catch (error) {
            this.logger.error(`Failed to sync update for ${product.name}`, error.stack);
            throw error;
        }
    }

    async getAdminProducts() {
        return this.productRepo.find({
            relations: ['prices'],
            order: { createdAt: 'ASC' }
        });
    }

    async getProductById(id: string) {
        const product = await this.productRepo.findOne({
            where: { id },
            relations: ['prices'],
        });
        if (!product) throw new NotFoundException('Product not found');
        return product;
    }

    async archiveProduct(id: string) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product) throw new NotFoundException('Product not found');

        product.active = false;
        await this.productRepo.save(product);

        // Archive on Stripe if synced
        if (product.stripeProductId) {
            try {
                await this.stripeProvider.archiveProduct(product.stripeProductId);
            } catch (error) {
                this.logger.warn(`Failed to archive on Stripe: ${error.message}`);
            }
        }

        return { archived: true, id };
    }
}
