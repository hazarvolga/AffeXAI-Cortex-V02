import { WebhookService } from './webhook.service';
import { EmailWebhookEventType } from '../interfaces/webhook-event.interface';
const dependency = <T>(value: unknown): T => value as T;
describe('webhook persistence boundary', () => {
  const suppression = { findOne: jest.fn(async () => null), save: jest.fn(async value => value) };
  const subscribers = { updateStatusFromWebhook: jest.fn(async () => null) };
  const event = { provider: 'resend', eventType: EmailWebhookEventType.BOUNCED, email: 'recipient@example.com', messageId: 'message', timestamp: new Date(), metadata: { tenantId: 'tenant-a' } };
  const service = (tenantId?: string) => new WebhookService(dependency(suppression), dependency({}), dependency({}), dependency(subscribers), dependency({}), dependency({ getTenantId: () => tenantId }), dependency({ emit: jest.fn() }));
  beforeEach(() => jest.clearAllMocks());
  it('rejects missing verified tenant and foreign event metadata without persisting', async () => {
    await expect(service().processWebhookEvent(event)).rejects.toThrow();
    await expect(service('tenant-b').processWebhookEvent(event)).rejects.toThrow();
    expect(suppression.save).not.toHaveBeenCalled();
  });
  it('writes only the trusted scoped tenant', async () => {
    await service('tenant-a').processWebhookEvent(event);
    expect(suppression.save).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-a' }));
  });
  it('does not acknowledge success when suppression persistence fails', async () => {
    suppression.save.mockRejectedValueOnce(new Error('database failure'));
    await expect(service('tenant-a').processWebhookEvent(event)).rejects.toThrow('database failure');
  });
  it.each([EmailWebhookEventType.BOUNCED, EmailWebhookEventType.COMPLAINED, EmailWebhookEventType.UNSUBSCRIBED])('does not acknowledge subscriber persistence failure for %s', async eventType => {
    subscribers.updateStatusFromWebhook.mockRejectedValueOnce(new Error('subscriber update failure'));
    await expect(service('tenant-a').processWebhookEvent({ ...event, eventType })).rejects.toThrow('subscriber update failure');
  });
  it('direct inbound service calls cannot impersonate a staff member', async () => {
    await expect(service('tenant-a').handleInboundEmail(dependency({ from: 'attacker@example.com', to: 'ticket-123@example.com', headers: { 'x-tenant-id': 'tenant-a' } }))).rejects.toThrow('feature unavailable');
  });
});
