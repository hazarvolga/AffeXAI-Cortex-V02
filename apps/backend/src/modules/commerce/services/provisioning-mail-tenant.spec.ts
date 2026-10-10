import { ForbiddenException } from '@nestjs/common';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { Price } from '../entities/price.entity';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { ProvisioningService } from './provisioning.service';

const checkoutSession = {
  mode: 'subscription',
  payment_status: 'paid',
  client_reference_id: 'xyz-company',
  metadata: { tenantId: 'xyz-company', initiatorUserId: 'owner-id' },
  customer_details: { email: 'owner@xyz-company.test' },
  subscription: 'sub-fixture',
  customer: 'cus-fixture',
};

const stripeSubscription = {
  id: 'sub-fixture',
  status: 'active',
  customer: 'cus-fixture',
  metadata: { tenantId: 'xyz-company', initiatorUserId: 'owner-id' },
  items: { data: [{
    price: { id: 'price-fixture' },
    current_period_start: 1_700_000_000,
    current_period_end: 1_702_592_000,
  }] },
  cancel_at_period_end: false,
};

const createFixture = (overrides: Record<string, unknown> = {}) => {
  const organization = { id: 'organization-id', slug: 'xyz-company', isActive: true };
  const user = {
    id: 'owner-id',
    tenantId: 'xyz-company',
    organizationId: organization.id,
    email: 'owner@xyz-company.test',
    isActive: true,
  };
  const price = {
    id: 'local-price-id',
    stripePriceId: 'price-fixture',
    active: true,
    product: { metadata: { show_branding: false } },
  };
  const manager = {
    query: jest.fn(async (sql: string) => {
      if (sql.includes('AS authorized')) return [{ authorized: overrides.authorized ?? true }];
      if (sql.includes('SELECT tenant_id FROM commerce_customer_bindings')) {
        return [{ tenant_id: overrides.bindingTenant ?? 'xyz-company' }];
      }
      return [];
    }),
    findOne: jest.fn(async (entity, options) => {
      if (entity === Subscription) {
        if (options?.where?.stripeSubscriptionId) return overrides.existingSubscription ?? null;
        if (options?.where?.stripeCustomerId) return overrides.customerBinding ?? null;
      }
      if (entity === Organization) return overrides.organization === undefined ? organization : overrides.organization;
      if (entity === User) return overrides.user === undefined ? user : overrides.user;
      if (entity === Price) return overrides.price === undefined ? price : overrides.price;
      return null;
    }),
    update: jest.fn(),
    create: jest.fn((_entity, value) => ({ ...value, id: 'created-subscription' })),
    save: jest.fn(async value => value),
  };
  const dataSource = { transaction: jest.fn(async callback => callback(manager)) };
  const mail = { sendAccountCreated: jest.fn() };
  const settings = { updateCommerceBrandingSetting: jest.fn() };
  const stripe = {
    getClient: () => ({
      subscriptions: { retrieve: jest.fn().mockResolvedValue(overrides.stripeSubscription ?? stripeSubscription) },
    }),
  };
  const service = new ProvisioningService(
    dataSource as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    mail as never,
    settings as never,
    {} as never,
    stripe as never,
  );
  return { dataSource, mail, manager, service, settings };
};

describe('existing tenant Stripe provisioning', () => {
  it('binds a verified subscription to the signed active tenant', async () => {
    const { mail, manager, service, settings } = createFixture();

    await expect(service.provisionTenantFromCheckout(checkoutSession as never)).resolves.toEqual({
      duplicate: false,
      subscriptionId: 'sub-fixture',
      tenantId: 'xyz-company',
    });

    expect(manager.update).toHaveBeenCalledWith(
      Subscription,
      expect.objectContaining({ tenantId: 'xyz-company' }),
      { status: SubscriptionStatus.CANCELED },
    );
    expect(manager.create).toHaveBeenCalledWith(Subscription, expect.objectContaining({
      tenantId: 'xyz-company',
      stripeCustomerId: 'cus-fixture',
      stripeSubscriptionId: 'sub-fixture',
      priceId: 'local-price-id',
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(1_700_000_000 * 1000),
      currentPeriodEnd: new Date(1_702_592_000 * 1000),
    }));
    expect(settings.updateCommerceBrandingSetting).toHaveBeenCalledWith('xyz-company', false);
    expect(mail.sendAccountCreated).not.toHaveBeenCalled();
  });

  it('does not create organizations, users, roles, or plaintext-password mail', async () => {
    const { mail, manager, service } = createFixture();
    await service.provisionTenantFromCheckout(checkoutSession as never);

    const createdEntities = manager.create.mock.calls.map(([entity]) => entity);
    expect(createdEntities).toEqual([Subscription]);
    expect(mail.sendAccountCreated).not.toHaveBeenCalled();
  });

  it('accepts a verified no-payment trial and preserves its Stripe billing period', async () => {
    const trial = {
      ...stripeSubscription,
      status: 'trialing',
      items: { data: [{
        price: { id: 'price-fixture' },
        current_period_start: 1_800_000_000,
        current_period_end: 1_800_604_800,
      }] },
    };
    const { manager, service } = createFixture({ stripeSubscription: trial });
    await service.provisionTenantFromCheckout({
      ...checkoutSession,
      payment_status: 'no_payment_required',
    } as never);
    expect(manager.create).toHaveBeenCalledWith(Subscription, expect.objectContaining({
      status: SubscriptionStatus.TRIALING,
      currentPeriodStart: new Date(1_800_000_000 * 1000),
      currentPeriodEnd: new Date(1_800_604_800 * 1000),
    }));
  });

  it('rejects an email that is not an active member of the signed tenant', async () => {
    const { manager, service } = createFixture({ user: null });
    await expect(service.provisionTenantFromCheckout(checkoutSession as never))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(manager.create).not.toHaveBeenCalled();
  });

  it('rechecks billing authority after checkout creation', async () => {
    const { manager, service } = createFixture({ authorized: false });
    await expect(service.provisionTenantFromCheckout(checkoutSession as never))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(manager.create).not.toHaveBeenCalled();
  });

  it('does not duplicate a previously provisioned Stripe subscription', async () => {
    const { mail, manager, service, settings } = createFixture({
      existingSubscription: { id: 'existing', tenantId: 'xyz-company' },
    });

    await expect(service.provisionTenantFromCheckout(checkoutSession as never)).resolves.toEqual({
      duplicate: true,
      subscriptionId: 'sub-fixture',
      tenantId: 'xyz-company',
    });
    expect(manager.create).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
    expect(mail.sendAccountCreated).not.toHaveBeenCalled();
    expect(settings.updateCommerceBrandingSetting).not.toHaveBeenCalled();
  });

  it('re-applies audited branding on a duplicate webhook after an earlier settings failure', async () => {
    const { service, settings } = createFixture({
      existingSubscription: {
        id: 'existing',
        tenantId: 'xyz-company',
        price: { product: { metadata: { show_branding: 'true' } } },
      },
    });

    await service.provisionTenantFromCheckout(checkoutSession as never);

    expect(settings.updateCommerceBrandingSetting).toHaveBeenCalledWith('xyz-company', true);
  });
});
