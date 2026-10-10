import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeProvider {
    private stripe: Stripe;
    private readonly logger = new Logger(StripeProvider.name);

    constructor() {
        if (!process.env.STRIPE_SECRET_KEY) {
            this.logger.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will fail.');
            // Initialize with a dummy key to prevent crash, but warn heavily
            // In real production, this should likely fail fast or be optional.
            // For now, allow application to boot but methods will fail.
        }

        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
            apiVersion: '2026-02-25.clover', // Latest API version as required by SDK
        });
    }

    public getClient(): Stripe {
        return this.stripe;
    }

    async createCheckoutSession(
        priceId: string,
        tenantId: string,
        initiatorUserId: string,
        successUrl: string,
        cancelUrl: string,
        customerEmail?: string
    ) {
        try {
            const session = await this.stripe.checkout.sessions.create({
                mode: 'subscription',
                line_items: [{ price: priceId, quantity: 1 }],
                client_reference_id: tenantId,
                customer_email: customerEmail,
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: { tenantId, initiatorUserId },
                subscription_data: {
                    metadata: { tenantId, initiatorUserId }
                }
            });
            return session;
        } catch (error) {
            this.logger.error(`Failed to create Checkout Session: ${error.message}`, error.stack);
            throw error;
        }
    }

    async createPortalSession(customerId: string, returnUrl: string) {
        try {
            return await this.stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl,
            });
        } catch (error) {
            this.logger.error(`Failed to create Portal Session: ${error.message}`, error.stack);
            throw error;
        }
    }

    async syncProduct(
        name: string,
        description: string,
        amountInCents: number,
        metadata: Record<string, string>,
        stripeProductId?: string,
        stripePriceId?: string
    ) {
        let product: Stripe.Product;
        let price: Stripe.Price;

        if (stripeProductId) {
            // Update existing
            product = await this.stripe.products.update(stripeProductId, {
                name,
                description,
                metadata
            });
        } else {
            // Create new
            product = await this.stripe.products.create({
                name,
                description,
                metadata
            });
        }

        // Price handling is trickier as prices are immutable in Stripe mostly.
        // If price differs, we usually create a new price and archive the old one.
        // For simplicity in this MVP sync, we'll create a new price if one doesn't exist 
        // or if we strictly need to change it.
        // Here we assume if stripePriceId is missing or we want to force a change, we create a new one.
        // A robust sync would check if the active price matches amountInCents.

        if (!stripePriceId) {
            price = await this.stripe.prices.create({
                product: product.id,
                unit_amount: amountInCents,
                currency: 'usd',
                recurring: { interval: 'month' }
            });
        } else {
            // We can't update unit_amount of an existing price.
            // We'd need to archive and create new.
            // For this MVP, we assume price is passed if it exists and is correct.
            // If we need to update price, the caller should handle archiving.
            price = await this.stripe.prices.retrieve(stripePriceId);
        }

        return { product, price };
    }

    async archiveProduct(stripeProductId: string) {
        try {
            return await this.stripe.products.update(stripeProductId, { active: false });
        } catch (error) {
            this.logger.error(`Failed to archive Stripe product ${stripeProductId}: ${error.message}`);
            throw error;
        }
    }

    constructEvent(payload: string | Buffer, signature: string, secret: string): Stripe.Event {
        try {
            return this.stripe.webhooks.constructEvent(payload, signature, secret);
        } catch (err) {
            this.logger.error(`Webhook signature verification failed: ${err.message}`);
            throw err;
        }
    }
}
