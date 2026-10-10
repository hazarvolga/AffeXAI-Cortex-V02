import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { DataSource, In, Repository } from 'typeorm';

import { MailService } from '../../mail/mail.service';
import { Organization } from '../../organizations/entities/organization.entity';
import { Role } from '../../roles/entities/role.entity';
import { SettingsService } from '../../settings/settings.service';
import { User } from '../../users/entities/user.entity';
import { Price } from '../entities/price.entity';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { StripeProvider } from './stripe.provider';
import { ORGANIZATION_ADMIN_ROLES } from '../../organizations/organization-admin-invariant';

type TrustedCheckoutContext = {
    customerId: string;
    email: string;
    initiatorUserId: string;
    subscriptionId: string;
    tenantId: string;
};

type ProvisioningResult = {
    duplicate: boolean;
    subscriptionId: string;
    tenantId: string;
};

@Injectable()
export class ProvisioningService {
    private readonly logger = new Logger(ProvisioningService.name);

    constructor(
        private dataSource: DataSource,
        @InjectRepository(Organization)
        private orgRepo: Repository<Organization>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Role)
        private roleRepo: Repository<Role>,
        @InjectRepository(Subscription)
        private subRepo: Repository<Subscription>,
        @InjectRepository(Price)
        private priceRepo: Repository<Price>,
        @Inject(forwardRef(() => MailService))
        private mailService: MailService,
        @Inject(forwardRef(() => SettingsService))
        private settingsService: SettingsService,
        private configService: ConfigService,
        private stripeProvider: StripeProvider,
    ) { }

    async provisionTenantFromCheckout(
        session: Stripe.Checkout.Session,
    ): Promise<ProvisioningResult> {
        return this.provisionExistingTenant(session);
    }

    async provisionWithPrice(
        session: Stripe.Checkout.Session,
        stripePriceId: string,
    ): Promise<ProvisioningResult> {
        if (!stripePriceId?.trim()) {
            throw new BadRequestException('Stripe price ID is required');
        }
        return this.provisionExistingTenant(session, stripePriceId.trim());
    }

    private async provisionExistingTenant(
        session: Stripe.Checkout.Session,
        expectedStripePriceId?: string,
    ): Promise<ProvisioningResult> {
        const context = this.requireTrustedCheckoutContext(session);
        const stripeSubscription = await this.retrieveAndValidateSubscription(
            context,
            expectedStripePriceId,
        );
        const stripePriceId = stripeSubscription.items.data[0].price.id;
        const stripeStatus = stripeSubscription.status === 'trialing'
            ? SubscriptionStatus.TRIALING
            : SubscriptionStatus.ACTIVE;
        const stripeItem = stripeSubscription.items.data[0];
        const periodStart = this.readPeriodDate(stripeItem, 'current_period_start');
        const periodEnd = this.readPeriodDate(stripeItem, 'current_period_end');

        const transactionResult = await this.dataSource.transaction(async manager => {
            const lockKeys = [`commerce-customer:${context.customerId}`, `commerce-tenant:${context.tenantId}`].sort();
            for (const key of lockKeys) {
                await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [key]);
            }
            const organization = await manager.findOne(Organization, {
                where: { slug: context.tenantId, isActive: true },
                lock: { mode: 'pessimistic_write' },
            });
            if (!organization) {
                throw new NotFoundException('Active organization not found for checkout tenant');
            }

            const existingSubscription = await manager.findOne(Subscription, {
                where: { stripeSubscriptionId: context.subscriptionId },
                relations: ['price', 'price.product'],
            });
            if (existingSubscription) {
                if (existingSubscription.tenantId !== context.tenantId) {
                    throw new ConflictException('Stripe subscription is already bound to another tenant');
                }
                return { duplicate: true, showBranding: existingSubscription.price?.product?.metadata?.show_branding };
            }

            const user = await manager.findOne(User, {
                where: {
                    email: context.email,
                    id: context.initiatorUserId,
                    tenantId: context.tenantId,
                    organizationId: organization.id,
                    isActive: true,
                },
            });
            if (!user) {
                throw new ForbiddenException('Checkout customer is not an active member of the tenant');
            }
            const [authority] = await manager.query(
                `SELECT EXISTS(
                   SELECT 1 FROM user_roles ur
                   JOIN roles r ON r.id=ur."roleId" AND r.tenant_id=ur.tenant_id
                   WHERE ur."userId"=$1 AND ur.tenant_id=$2 AND ur.deleted_at IS NULL
                     AND r.deleted_at IS NULL AND r.is_active=true AND r.name=ANY($3::varchar[])
                 ) AS authorized`,
                [context.initiatorUserId, context.tenantId, ORGANIZATION_ADMIN_ROLES],
            );
            if (!authority?.authorized) {
                throw new ForbiddenException('Checkout initiator no longer has billing authority');
            }

            await manager.query(
                `INSERT INTO commerce_customer_bindings(stripe_customer_id,tenant_id)
                 VALUES($1,$2) ON CONFLICT(stripe_customer_id) DO NOTHING`,
                [context.customerId, context.tenantId],
            );
            const [customerBinding] = await manager.query(
                'SELECT tenant_id FROM commerce_customer_bindings WHERE stripe_customer_id=$1',
                [context.customerId],
            );
            if (customerBinding?.tenant_id !== context.tenantId) {
                throw new ConflictException('Stripe customer is already bound to another tenant');
            }

            const price = await manager.findOne(Price, {
                where: { stripePriceId, active: true },
                relations: ['product'],
            });
            if (!price) {
                throw new NotFoundException('Active local price not found for Stripe subscription');
            }

            await manager.update(
                Subscription,
                {
                    tenantId: context.tenantId,
                    status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]),
                },
                { status: SubscriptionStatus.CANCELED },
            );

            const subscription = manager.create(Subscription, {
                tenantId: context.tenantId,
                stripeSubscriptionId: context.subscriptionId,
                stripeCustomerId: context.customerId,
                price,
                priceId: price.id,
                status: stripeStatus,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            });
            await manager.save(subscription);

            return {
                duplicate: false,
                showBranding: price.product?.metadata?.show_branding,
            };
        });

        if (transactionResult.showBranding !== undefined) {
            await this.settingsService.updateCommerceBrandingSetting(
                context.tenantId,
                transactionResult.showBranding === true || transactionResult.showBranding === 'true',
            );
        }

        this.logger.log(
            `${transactionResult.duplicate ? 'Confirmed existing' : 'Provisioned'} subscription ${context.subscriptionId} for tenant ${context.tenantId}`,
        );
        return {
            duplicate: transactionResult.duplicate,
            subscriptionId: context.subscriptionId,
            tenantId: context.tenantId,
        };
    }

    private requireTrustedCheckoutContext(
        session: Stripe.Checkout.Session,
    ): TrustedCheckoutContext {
        if (session.mode !== 'subscription') {
            throw new BadRequestException('Checkout session is not a subscription');
        }
        if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
            throw new BadRequestException('Checkout payment is not complete');
        }

        const tenantId = session.client_reference_id?.trim();
        const metadataTenantId = session.metadata?.tenantId?.trim();
        const initiatorUserId = session.metadata?.initiatorUserId?.trim();
        if (!tenantId || !metadataTenantId || !initiatorUserId) {
            throw new BadRequestException('Checkout tenant metadata is missing');
        }
        if (tenantId !== metadataTenantId) {
            throw new ForbiddenException('Checkout tenant metadata does not match');
        }

        const subscriptionId = this.stripeId(session.subscription);
        const customerId = this.stripeId(session.customer);
        const email = session.customer_details?.email?.trim().toLowerCase();
        if (!subscriptionId || !customerId || !email) {
            throw new BadRequestException('Checkout customer or subscription identity is missing');
        }

        return {
            customerId,
            email,
            initiatorUserId,
            subscriptionId,
            tenantId,
        };
    }

    private async retrieveAndValidateSubscription(
        context: TrustedCheckoutContext,
        expectedStripePriceId?: string,
    ): Promise<Stripe.Subscription> {
        const subscription = await this.stripeProvider
            .getClient()
            .subscriptions.retrieve(context.subscriptionId);

        if (subscription.status !== 'active' && subscription.status !== 'trialing') {
            throw new BadRequestException('Stripe subscription is not active');
        }
        if (this.stripeId(subscription.customer) !== context.customerId) {
            throw new ForbiddenException('Stripe subscription customer does not match checkout');
        }
        const subscriptionTenantId = subscription.metadata?.tenantId?.trim();
        if (subscriptionTenantId !== context.tenantId) {
            throw new ForbiddenException('Stripe subscription tenant does not match checkout');
        }
        if (subscription.metadata?.initiatorUserId?.trim() !== context.initiatorUserId) {
            throw new ForbiddenException('Stripe subscription initiator does not match checkout');
        }

        const priceId = subscription.items.data[0]?.price?.id;
        if (!priceId) {
            throw new BadRequestException('Stripe subscription has no price');
        }
        if (expectedStripePriceId && priceId !== expectedStripePriceId) {
            throw new ForbiddenException('Stripe subscription price does not match requested price');
        }
        return subscription;
    }

    private stripeId(value: string | { id: string } | null): string | undefined {
        if (typeof value === 'string') return value.trim() || undefined;
        return value?.id?.trim() || undefined;
    }

    private readPeriodDate(
        subscriptionItem: Stripe.SubscriptionItem,
        field: 'current_period_start' | 'current_period_end',
    ): Date | null {
        const value = (subscriptionItem as unknown as Record<string, unknown>)[field];
        if (typeof value !== 'number') {
            throw new BadRequestException('Stripe subscription billing period is missing');
        }
        return new Date(value * 1000);
    }
}
