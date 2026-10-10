import { EmailDispatchPolicy } from './email-dispatch-policy';

describe('marketing dispatch consent and tenant policy', () => {
  const subscriber = { id: 'subscriber-a', tenantId: 'tenant-a', email: 'member@example.test', status: 'active', isDoubleOptIn: true, marketingEmails: true, emailNotifications: true };
  const subscribers = { findOne: jest.fn() };
  const campaigns = { findOne: jest.fn() };
  const policy = new EmailDispatchPolicy(subscribers as never, campaigns as never);
  const data = { to: subscriber.email, campaignId: 'campaign-a', recipientId: subscriber.id };
  beforeEach(() => { jest.clearAllMocks(); subscribers.findOne.mockResolvedValue(subscriber); campaigns.findOne.mockResolvedValue({ id: 'campaign-a', tenantId: 'tenant-a' }); });
  it('requires tenant before any database lookup', async () => {
    await expect(policy.authorize('', data)).rejects.toThrow();
    expect(subscribers.findOne).not.toHaveBeenCalled();
  });
  it('loads recipient and campaign only inside the supplied tenant', async () => {
    await policy.authorize('tenant-a', data);
    expect(subscribers.findOne).toHaveBeenCalledWith({ where: { email: data.to, tenantId: 'tenant-a' } });
    expect(campaigns.findOne).toHaveBeenCalledWith({ where: { id: data.campaignId, tenantId: 'tenant-a' } });
  });
  it('rejects a missing or foreign recipient', async () => {
    subscribers.findOne.mockResolvedValue(null);
    await expect(policy.authorize('tenant-b', data)).rejects.toThrow();
  });
  it('rejects a missing or foreign campaign', async () => {
    campaigns.findOne.mockResolvedValue(null);
    await expect(policy.authorize('tenant-a', data)).rejects.toThrow();
  });
  it.each([{ status: 'unsubscribed' }, { isDoubleOptIn: false }, { isDoubleOptIn: undefined }, { marketingEmails: false }, { emailNotifications: false }])('rejects withdrawn consent %j', async change => {
    subscribers.findOne.mockResolvedValue({ ...subscriber, ...change });
    await expect(policy.authorize('tenant-a', data)).rejects.toThrow();
  });
  it('rejects recipient ID substitution', async () => {
    await expect(policy.authorize('tenant-a', { ...data, recipientId: 'someone-else' })).rejects.toThrow();
  });
  it('accepts the legacy campaign queue email identity only when it matches the recipient', async () => {
    await expect(policy.authorize('tenant-a', { ...data, recipientId: data.to })).resolves.toBe(subscriber.id);
  });
  it('requires consent for direct marketing mail too', async () => {
    subscribers.findOne.mockResolvedValue(null);
    await expect(policy.authorize('tenant-a', { to: data.to })).rejects.toThrow();
  });
});
