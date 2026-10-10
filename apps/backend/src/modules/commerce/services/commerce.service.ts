import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Price } from '../entities/price.entity';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { UsageRecord } from '../entities/usage-record.entity';
import { StripeProvider } from './stripe.provider';

import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../../users/entities/user.entity';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class CommerceService {
    constructor(
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
        @InjectRepository(Price)
        private priceRepo: Repository<Price>,
        @InjectRepository(Subscription)
        private subscriptionRepo: Repository<Subscription>,
        @InjectRepository(UsageRecord)
        private usageRepo: Repository<UsageRecord>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private stripeProvider: StripeProvider,
        @Inject(forwardRef(() => MailService))
        private mailService: MailService,
    ) { }

    // --- Product Catalog ---
    async getProducts() {
        const products = await this.productRepo.find({
            relations: ['prices'],
            where: { active: true, isPublic: true }
        });
        return products.map(product => ({
            ...product,
            prices: product.prices?.filter(price => price.active) ?? [],
        }));
    }

    async createProduct(data: Partial<Product>) {
        const product = this.productRepo.create(data);
        return this.productRepo.save(product);
    }

    // --- Subscriptions ---
    async getSubscription(tenantId: string) {
        return this.subscriptionRepo.findOne({
            where: { tenantId, status: SubscriptionStatus.ACTIVE },
            relations: ['price', 'price.product'],
            order: { createdAt: 'DESC' }
        });
    }

    async createCheckoutSession(tenantId: string, userId: string, priceId: string, userEmail?: string) {
        const price = await this.priceRepo.findOne({
            where: { id: priceId },
            relations: ['product'],
        });
        if (!price) throw new NotFoundException('Price not found');
        if (!price.active || !price.product?.active || !price.product.isPublic) {
            throw new BadRequestException('Price is not available for checkout');
        }

        // FRONTEND_URL must be set in .env — never hardcode a port here
        const frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl) {
            console.warn('[CommerceService] FRONTEND_URL is not set in environment. Checkout redirect URLs will be broken.');
        }
        const base = frontendUrl || '';
        const successUrl = `${base}/pricing?checkout=success`;
        const cancelUrl = `${base}/pricing?checkout=cancel`;

        const session = await this.stripeProvider.createCheckoutSession(
            price.stripePriceId, // Assuming Price entity has this, if not we need to map or use priceId if it IS the stripe id
            tenantId,
            userId,
            successUrl,
            cancelUrl,
            userEmail
        );
        return session;
    }

    async handleCheckoutSuccess(session: any) {
        const tenantId = session.client_reference_id || session.metadata?.tenantId;
        const stripeSubscriptionId = session.subscription as string;
        const stripeCustomerId = session.customer as string;

        if (!tenantId) {
            console.error('Webhook received without tenantId');
            return;
        }

        // Fetch subscription details from Stripe to get strict dates
        const stripe = this.stripeProvider.getClient();
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

        // Cancel existing active subscriptions locally
        await this.subscriptionRepo.update(
            { tenantId, status: SubscriptionStatus.ACTIVE },
            { status: SubscriptionStatus.CANCELED, updatedAt: new Date() }
        );

        // Find the local Price entity matching the Stripe Price ID
        // For MVP, we might need to store stripePriceId in our Price entity
        // Or assume we can find it. 
        // Let's assume the first item's price ID corresponds to our local Price.stripePriceId
        const item = stripeSub.items.data[0];
        const localPrice = await this.priceRepo.findOne({ where: { stripePriceId: item.price.id } });

        if (!localPrice) {
            console.warn(`Local price not found for Stripe Price ID: ${item.price.id}. Subscription might be desynced.`);
        }

        const newSub = this.subscriptionRepo.create({
            tenantId,
            stripeSubscriptionId,
            stripeCustomerId,
            price: localPrice, // Nullable if not found, but ideally mapped
            priceId: localPrice?.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date((stripeSub as any).current_period_start * 1000),
            currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
            cancelAtPeriodEnd: (stripeSub as any).cancel_at_period_end
        });

        await this.subscriptionRepo.save(newSub);
        console.log(`[Commerce] Provisioned subscription for tenant ${tenantId}`);
    }

    async assignPlan(tenantId: string, priceId: string) {
        // ... (Legacy implementation kept for Admin/Seed usage)
        const price = await this.priceRepo.findOne({ where: { id: priceId }, relations: ['product'] });
        if (!price) throw new NotFoundException('Price not found');

        // Cancel existing active subscriptions
        await this.subscriptionRepo.update(
            { tenantId, status: SubscriptionStatus.ACTIVE },
            { status: SubscriptionStatus.CANCELED, updatedAt: new Date() }
        );

        const sub = this.subscriptionRepo.create({
            tenantId,
            price,
            priceId: price.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            // Default 30 days for internal ledger
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        return this.subscriptionRepo.save(sub);
    }

    // --- Governance / Rate Limiting ---
    async checkUserLimit(tenantId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
        if (!tenantId) return { allowed: true, remaining: 10, limit: 10 };

        const sub = await this.getSubscription(tenantId);
        // Default 3 users if no subscription
        let limit = 3;
        if (sub && sub.price.product.metadata?.max_users) {
            limit = sub.price.product.metadata.max_users;
        }

        // Count ACTIVE users only
        const activeUsers = await this.userRepo.count({
            where: { tenantId, isActive: true }
        });

        return {
            allowed: activeUsers < limit,
            remaining: Math.max(0, limit - activeUsers),
            limit
        };
    }

    async getUsageStats(tenantId: string) {
        const check = await this.checkLimit(tenantId);
        const sub = await this.getSubscription(tenantId);

        // Calculate used from reversed check logic or just subtraction
        const used = check.limit - check.remaining;

        return {
            used,
            limit: check.limit,
            remaining: check.remaining,
            periodEnd: sub?.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };
    }

    async checkLimit(tenantId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
        if (!tenantId) {
            console.warn('[CommerceService] checkLimit called without tenantId');
            return { allowed: true, remaining: 50000, limit: 50000 };
        }
        const sub = await this.getSubscription(tenantId);

        // Default limits if no subscription (Early Access / Fallback)
        let limit = 50000; // Starter/Default
        if (sub && sub.price.product.metadata?.ai_tokens) {
            limit = sub.price.product.metadata.ai_tokens;
        }

        // Strict Billing Cycle: Use subscription period start, or fallback to 30 days rolling
        let periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (sub && sub.currentPeriodStart) {
            periodStart = sub.currentPeriodStart;
        }

        try {
            const usage = await this.usageRepo.createQueryBuilder('usage')
                .where('usage.tenantId = :tenantId', { tenantId })
                .andWhere('usage.timestamp >= :date', { date: periodStart })
                .select('SUM(usage.tokensUsed)', 'total')
                .getRawOne();

            const used = parseInt(usage?.total || '0', 10);

            return {
                allowed: used < limit,
                remaining: Math.max(0, limit - used),
                limit
            };
        } catch (error) {
            console.error(`[CommerceService] Critical error checking limits for tenant ${tenantId}:`, error);
            // Fallback to allow operation during DB failure
            return {
                allowed: true,
                remaining: limit,
                limit
            };
        }
    }

    async logUsage(tenantId: string, tokens: number, action: string, serviceName: string) {
        const record = this.usageRepo.create({
            tenantId,
            tokensUsed: tokens,
            action,
            serviceName
        });
        await this.usageRepo.save(record);
    }

    async createPortalSession(tenantId: string, returnUrl: string) {
        const sub = await this.getSubscription(tenantId);
        if (!sub || !sub.stripeCustomerId) {
            throw new BadRequestException('No billing account found');
        }

        const session = await this.stripeProvider.createPortalSession(
            sub.stripeCustomerId,
            returnUrl
        );
        return session;
    }

    @Cron(CronExpression.EVERY_HOUR)
    async checkUsageAlerts() {
        console.log('[CommerceService] Checking usage alerts...');
        const subs = await this.subscriptionRepo.find({
            where: { status: SubscriptionStatus.ACTIVE },
            relations: ['price', 'price.product']
        });

        for (const sub of subs) {
            try {
                const stats = await this.getUsageStats(sub.tenantId);
                const percentage = stats.used / stats.limit;

                if (percentage >= 1.0) {
                    await this.triggerAlert(sub.tenantId, '100', stats);
                } else if (percentage >= 0.8) {
                    await this.triggerAlert(sub.tenantId, '80', stats);
                }
            } catch (e) {
                console.error(`Error checking alert for tenant ${sub.tenantId}:`, e);
            }
        }
    }

    private async triggerAlert(tenantId: string, threshold: '80' | '100', stats: any) {
        const action = `alert_${threshold}`;
        const service = 'commerce_alerts';

        const sub = await this.getSubscription(tenantId);
        const periodStart = sub?.currentPeriodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const exists = await this.usageRepo.findOne({
            where: {
                tenantId,
                action,
                serviceName: service,
                timestamp: MoreThan(periodStart),
            } as any
        });

        if (!exists) {
            const admin = await this.userRepo.findOne({
                where: { tenantId } as any,
                order: { createdAt: 'ASC' }
            });

            if (admin && admin.email) {
                const subject = threshold === '100'
                    ? '🚨 Action Required: Usage Limit Reached'
                    : '⚠️ Usage Warning: 80% Limit Reached';

                const message = threshold === '100'
                    ? `You have used ${stats.used} of ${stats.limit} tokens. Services may be paused.`
                    : `You have used ${stats.used} of ${stats.limit} tokens.`;

                await this.mailService.sendMail({
                    to: { email: admin.email },
                    subject,
                    html: `<p>${message}</p><p>Please upgrade your plan to continue.</p>`,
                    channel: 'system' as any
                });

                await this.logUsage(tenantId, 0, action, service);
                console.log(`[CommerceService] Sent ${threshold}% alert to ${admin.email}`);
            }
        }
    }

    // ─────────────────────────────────────────────
    // ADMIN / AUDITOR ENDPOINTS
    // ─────────────────────────────────────────────

    async getRevenueSummary() {
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        thisMonthStart.setHours(0, 0, 0, 0);

        const [activeSubs, recentlyCanceled] = await Promise.all([
            this.subscriptionRepo.find({
                where: { status: SubscriptionStatus.ACTIVE },
                relations: ['price', 'price.product'],
            }),
            this.subscriptionRepo.find({
                where: {
                    status: SubscriptionStatus.CANCELED,
                    updatedAt: MoreThan(thisMonthStart),
                },
                relations: ['price'],
            }),
        ]);

        // MRR: sum of all active subscriptions. Price.amount stored in minor units (cents).
        const totalMRR = activeSubs.reduce((acc, sub) => {
            const amount = (sub.price?.amount ?? 0) / 100; // cents → dollars
            const interval = sub.price?.interval ?? 'month';
            const monthly = interval === 'year' ? amount / 12 : amount;
            return acc + monthly;
        }, 0);

        const estimatedBurn = totalMRR * 0.20;
        const netMargin = totalMRR > 0 ? ((totalMRR - estimatedBurn) / totalMRR) * 100 : 0;

        const tenants = activeSubs.map(sub => ({
            tenantId: sub.tenantId,
            planName: sub.price?.product?.name ?? 'Unknown Plan',
            status: sub.status,
            monthlyValue: sub.price?.interval === 'year'
                ? (sub.price?.amount ?? 0) / 100 / 12
                : (sub.price?.amount ?? 0) / 100,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        }));

        return {
            totalMRR: Math.round(totalMRR * 100) / 100,
            estimatedBurn: Math.round(estimatedBurn * 100) / 100,
            netMargin: Math.round(netMargin * 10) / 10,
            activeTenantCount: activeSubs.length,
            churnedThisMonth: recentlyCanceled.length,
            tenants,
        };
    }

    async getAdminInvoices() {
        try {
            const stripe = this.stripeProvider.getClient();
            const invoiceList = await stripe.invoices.list({ limit: 30 });
            return invoiceList.data.map(inv => ({
                id: inv.id,
                number: inv.number,
                amount: (inv.amount_due ?? 0) / 100,
                currency: (inv.currency ?? 'usd').toUpperCase(),
                status: inv.status,
                created: new Date((inv.created ?? 0) * 1000).toISOString(),
                dueDate: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
                customerEmail: inv.customer_email,
                hostedUrl: inv.hosted_invoice_url,
            }));
        } catch (err) {
            console.error('[CommerceService] getAdminInvoices failed:', err.message);
            return [];
        }
    }

    async getTokenEconomics() {
        // ... (existing code)
    }

    /**
     * Centrally check if a tenant has access to a specific feature based on their current product metadata
     */
    async checkFeatureAccess(tenantId: string, featureKey: string): Promise<boolean> {
        const sub = await this.getSubscription(tenantId);
        if (!sub || !sub.price || !sub.price.product) {
            return false;
        }

        const metadata = sub.price.product.metadata;
        if (!metadata) return false;

        return metadata[featureKey] === true || metadata[featureKey] === 'true';
    }
}
