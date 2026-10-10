import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProvisioningService } from './provisioning.service';

const service = (retrieve = jest.fn()) => new ProvisioningService(
  { transaction: jest.fn() } as never,
  {} as never, {} as never, {} as never, {} as never, {} as never,
  { sendAccountCreated: jest.fn() } as never,
  {} as never,
  { get: jest.fn() } as never,
  { getClient: () => ({ subscriptions: { retrieve } }) } as never,
);

describe('Stripe provisioning trust boundaries', () => {
  it.each([
    [{ mode: 'subscription', payment_status: 'unpaid', client_reference_id: 'tenant-a', subscription: 'sub-1' }, BadRequestException],
    [{ mode: 'payment', payment_status: 'paid', client_reference_id: 'tenant-a', subscription: 'sub-1' }, BadRequestException],
    [{ mode: 'subscription', payment_status: 'paid', subscription: 'sub-1' }, BadRequestException],
  ])('rejects untrusted checkout state before database writes', async (session, ErrorType) => {
    const instance = service();
    await expect(instance.provisionTenantFromCheckout(session as never)).rejects.toBeInstanceOf(ErrorType);
    expect((instance as any).dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects mismatched signed tenant metadata', async () => {
    const instance = service();
    await expect(instance.provisionTenantFromCheckout({
      mode: 'subscription', payment_status: 'paid', client_reference_id: 'tenant-a',
      metadata: { tenantId: 'tenant-b', initiatorUserId: 'user-a' }, subscription: 'sub-1',
    } as never)).rejects.toBeInstanceOf(ForbiddenException);
    expect((instance as any).dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects checkout state without a signed initiator identity', async () => {
    const instance = service();
    await expect(instance.provisionTenantFromCheckout({
      mode: 'subscription', payment_status: 'paid', client_reference_id: 'tenant-a',
      metadata: { tenantId: 'tenant-a' }, subscription: 'sub-1',
    } as never)).rejects.toBeInstanceOf(BadRequestException);
    expect((instance as any).dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects a Stripe subscription without the exact signed tenant metadata', async () => {
    const retrieve = jest.fn().mockResolvedValue({
      id: 'sub-1',
      status: 'active',
      customer: 'cus-1',
      metadata: { initiatorUserId: 'user-a' },
      items: { data: [{ price: { id: 'price-1' }, current_period_start: 1, current_period_end: 2 }] },
    });
    const instance = service(retrieve);
    await expect(instance.provisionTenantFromCheckout({
      mode: 'subscription',
      payment_status: 'paid',
      client_reference_id: 'tenant-a',
      metadata: { tenantId: 'tenant-a', initiatorUserId: 'user-a' },
      subscription: 'sub-1',
      customer: 'cus-1',
      customer_details: { email: 'owner@example.com' },
    } as never)).rejects.toBeInstanceOf(ForbiddenException);
    expect((instance as any).dataSource.transaction).not.toHaveBeenCalled();
  });
});
