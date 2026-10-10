import { GroupService } from './group.service';
import { SegmentService } from './segment.service';
import { SubscriberService } from './subscriber.service';
const dependency = <T>(value: unknown): T => value as T;
describe('recipient tenant and relation integrity', () => {
  const tenant = { getTenantId: () => 'tenant-a' };
  const repo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn(async value => value), create: jest.fn(value => value), update: jest.fn(), delete: jest.fn() };
  beforeEach(() => jest.clearAllMocks());
  it.each([GroupService, SegmentService])('%s rejects explicit foreign tenant overrides', async Service => {
    const service = new Service(dependency(repo), dependency(tenant));
    await expect(service.findAll('tenant-b')).rejects.toThrow(); expect(repo.find).not.toHaveBeenCalled();
  });
  it.each([GroupService, SegmentService])('%s rejects identity reassignment on updates', async Service => {
    repo.findOne.mockResolvedValue({ id: 'id-a', tenantId: 'tenant-a', name: 'A' });
    const service = new Service(dependency(repo), dependency(tenant));
    await expect(service.update('id-a', dependency({ tenantId: 'tenant-b', id: 'id-b' }))).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled(); expect(repo.update).not.toHaveBeenCalled();
  });
  const groups = { find: jest.fn(async () => [{ id: 'group-a' }]) };
  const segments = { find: jest.fn(async () => [{ id: 'segment-a' }]) };
  const optIn = { subscribeWithDoubleOptIn: jest.fn(async () => ({ requiresConfirmation: true })) };
  const service = () => new SubscriberService(dependency(repo), dependency({}), dependency({ validateEmail: jest.fn() }), dependency(tenant), dependency(groups), dependency(segments), dependency(optIn));
  it.each([{ groups: ['group-b'] }, { segments: ['segment-b'] }])('rejects foreign recipient relations %p before persistence', async relations => {
    await expect(service().create({ email: 'a@example.com', mailerCheckResult: 'valid', ...relations })).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });
  it('accepts local relations and scopes lookup to the current tenant', async () => {
    const result = await service().create({ email: 'a@example.com', mailerCheckResult: 'valid', groups: ['group-a'], segments: ['segment-a'] });
    expect(result.tenantId).toBe('tenant-a');
    expect(groups.find).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a' }) }));
  });
  it('rejects relation replacement and token/tenant injection on subscriber update', async () => {
    repo.findOne.mockResolvedValue({ id: 'sub-a', tenantId: 'tenant-a', groups: [] });
    await expect(service().update('sub-a', { groups: ['group-b'] })).rejects.toThrow();
    await expect(service().update('sub-a', dependency({ optInToken: 'attacker', tenantId: 'tenant-b' }))).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });
  it('updates only requested fields without replaying a stale consent snapshot', async () => {
    const snapshot = { id: 'sub-a', tenantId: 'tenant-a', email: 'a@example.com', marketingEmails: true, optInToken: 'old' };
    const current = { ...snapshot, marketingEmails: false, optInToken: null, firstName: 'New' };
    repo.findOne.mockResolvedValueOnce(snapshot).mockResolvedValueOnce(current);
    repo.update.mockResolvedValue({ affected: 1 });
    const result = await service().update('sub-a', { firstName: 'New' });
    expect(repo.update).toHaveBeenCalledWith({ id: 'sub-a', tenantId: 'tenant-a' }, { firstName: 'New' });
    expect(repo.save).not.toHaveBeenCalled(); expect(result.marketingEmails).toBe(false); expect(result.optInToken).toBeNull();
  });
  it('does not transfer mailbox consent when an administrator changes email', async () => {
    repo.findOne.mockResolvedValue({ id: 'sub-a', tenantId: 'tenant-a', email: 'a@example.com', isDoubleOptIn: true });
    await expect(service().update('sub-a', { email: 'new-owner@example.com' })).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled(); expect(repo.save).not.toHaveBeenCalled();
  });
  it('legacy admin subscribe requests confirmation without directly activating a mailbox', async () => {
    repo.findOne.mockResolvedValue({ id: 'sub-a', tenantId: 'tenant-a', email: 'a@example.com', status: 'pending', isDoubleOptIn: false });
    const result = await service().subscribe('a@example.com');
    expect(optIn.subscribeWithDoubleOptIn).toHaveBeenCalledWith('a@example.com', {}, undefined);
    expect(result.status).toBe('pending'); expect(repo.save).not.toHaveBeenCalled();
  });
  it('unsubscribe and bounce updates never persist an old full entity', async () => {
    repo.findOne.mockResolvedValue({ id: 'sub-a', tenantId: 'tenant-a', email: 'a@example.com', status: 'active', optInToken: 'old', unsubscribeToken: 'old', isDoubleOptIn: true });
    repo.update.mockResolvedValue({ affected: 1 });
    await service().unsubscribe('a@example.com');
    await service().updateStatusFromWebhook('a@example.com', 'bounced', {}, 'tenant-a');
    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith({ id: 'sub-a', tenantId: 'tenant-a' }, expect.objectContaining({ status: expect.any(Function), isDoubleOptIn: false, marketingEmails: false }));
    expect(repo.update).toHaveBeenCalledWith({ id: 'sub-a', tenantId: 'tenant-a' }, expect.objectContaining({ status: 'bounced', isDoubleOptIn: false, marketingEmails: false }));
  });
  it('propagates webhook persistence errors for provider retry', async () => {
    repo.findOne.mockResolvedValue({ id: 'sub-a', tenantId: 'tenant-a' });
    repo.update.mockRejectedValueOnce(new Error('subscriber update failure'));
    await expect(service().updateStatusFromWebhook('a@example.com', 'bounced', {}, 'tenant-a')).rejects.toThrow('subscriber update failure');
  });
  it('fails closed suppression check without tenant', async () => {
    const noTenant = new SubscriberService(dependency(repo), dependency({}), dependency({}), dependency({ getTenantId: () => undefined }), dependency(groups), dependency(segments), dependency(optIn));
    await expect(noTenant.isEmailSuppressed('a@example.com')).rejects.toThrow();
  });
});
