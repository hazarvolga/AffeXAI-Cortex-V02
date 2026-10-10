import { EmailMarketingService } from './email-marketing.service';
import { EmailProcessor } from './processors/email.processor';
import { TenantService } from '../../core/tenant/tenant.service';

describe('marketing enqueue and worker boundaries', () => {
  const queue = { add: jest.fn().mockResolvedValue({ id: 'job' }), getWaiting: jest.fn().mockResolvedValue([{}]), getActive: jest.fn().mockResolvedValue([]), getCompleted: jest.fn().mockResolvedValue([{}, {}]), getFailed: jest.fn().mockResolvedValue([]) };
  const policy = { authorize: jest.fn() };
  const mail = { sendMail: jest.fn().mockResolvedValue({ success: true, messageId: 'sent' }) };
  const subscriptions = { ensureUnsubscribeToken: jest.fn().mockResolvedValue('scoped-unsubscribe-token') };
  const organizations = { assertActiveTenant: jest.fn().mockResolvedValue(undefined) };
  const campaigns = { incrementSentCount: jest.fn() };
  const tenants = new TenantService();
  const service = new EmailMarketingService(queue as never, tenants, policy as never);
  const worker = new EmailProcessor(campaigns as never, mail as never, tenants, policy as never, subscriptions as never, organizations as never);
  const data = { tenantId: 'tenant-a', to: 'member@example.test', subject: 'Campaign', body: 'Content', campaignId: 'campaign-a', recipientId: 'member-a' };
  const previousOrigin = process.env.NEXT_PUBLIC_BASE_URL;
  afterAll(() => { if (previousOrigin === undefined) delete process.env.NEXT_PUBLIC_BASE_URL; else process.env.NEXT_PUBLIC_BASE_URL = previousOrigin; });
  beforeEach(() => { jest.clearAllMocks(); policy.authorize.mockResolvedValue('member-a'); organizations.assertActiveTenant.mockResolvedValue(undefined); process.env.NEXT_PUBLIC_BASE_URL = 'https://cortex.example.test'; });
  it('denies campaign enqueue before queue mutation when recipient authorization fails', async () => {
    policy.authorize.mockRejectedValue(new Error('Consent revoked'));
    await expect(tenants.runWithTenant({ tenantId: data.tenantId }, () => service.sendCampaignEmail(data.to, data.subject, data.body, data.campaignId, data.recipientId))).rejects.toThrow('Consent revoked');
    expect(queue.add).not.toHaveBeenCalled();
  });
  it('enqueues verified tenant data', async () => {
    await tenants.runWithTenant({ tenantId: data.tenantId }, () => service.sendCampaignEmail(data.to, data.subject, data.body, data.campaignId, data.recipientId));
    expect(queue.add).toHaveBeenCalledWith('sendCampaignEmail', data);
  });
  it('rejects a legacy tenantless job before delivery', async () => {
    await expect(worker.process({ id: 'job', data: { ...data, tenantId: undefined } } as never)).rejects.toThrow('tenant context');
    expect(mail.sendMail).not.toHaveBeenCalled();
  });
  it('rechecks consent at delivery and does not send or count a revoked recipient', async () => {
    policy.authorize.mockRejectedValue(new Error('Consent revoked'));
    await expect(worker.process({ id: 'job', data } as never)).rejects.toThrow('Consent revoked');
    expect(mail.sendMail).not.toHaveBeenCalled(); expect(campaigns.incrementSentCount).not.toHaveBeenCalled();
  });
  it('rejects queued delivery when the organization was deactivated after enqueue', async () => {
    organizations.assertActiveTenant.mockRejectedValue(new Error('Organization is inactive'));
    await expect(worker.process({ id: 'job', data } as never)).rejects.toThrow('inactive');
    expect(policy.authorize).not.toHaveBeenCalled();
    expect(mail.sendMail).not.toHaveBeenCalled();
  });
  it('passes the verified tenant to the mail service', async () => {
    await worker.process({ id: 'job', data } as never);
    expect(mail.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: { email: data.to } }), data.tenantId);
    expect(campaigns.incrementSentCount).toHaveBeenCalledWith(data.campaignId);
  });
  it('attaches a tenant-scoped unsubscribe link before any provider call', async () => {
    await worker.process({ id: 'job', data } as never);
    expect(subscriptions.ensureUnsubscribeToken).toHaveBeenCalledWith('member-a', 'tenant-a');
    expect(mail.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining('https://cortex.example.test/unsubscribe?token=scoped-unsubscribe-token'),
      unsubscribe: { url: 'https://cortex.example.test/unsubscribe?token=scoped-unsubscribe-token', oneClick: false },
    }), 'tenant-a');
  });
  it('fails closed when public email link configuration is missing', async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    await expect(worker.process({ id: 'job', data } as never)).rejects.toThrow();
    expect(mail.sendMail).not.toHaveBeenCalled();
  });

  it('enqueues direct marketing mail with verified tenant and consent', async () => {
    await tenants.runWithTenant({ tenantId: data.tenantId }, () => service.sendEmail(data.to, data.subject, data.body));
    expect(queue.add).toHaveBeenCalledWith('sendEmail', { to: data.to, subject: data.subject, body: data.body, tenantId: data.tenantId });
  });
  it('rejects direct enqueue without tenant context', async () => {
    await expect(service.sendEmail(data.to, data.subject, data.body)).rejects.toThrow('Tenant context required');
    expect(queue.add).not.toHaveBeenCalled();
  });
  it('reports real queue counts', async () => {
    await expect(service.getQueueStatus()).resolves.toEqual({ waiting: 1, active: 0, completed: 2, failed: 0 });
  });
  it.each([{ success: false, error: 'Provider unavailable' }, { success: false }, undefined])('does not count an unsuccessful provider result %j', async result => {
    mail.sendMail.mockResolvedValueOnce(result);
    await expect(worker.process({ id: 'job', data } as never)).rejects.toThrow();
    expect(campaigns.incrementSentCount).not.toHaveBeenCalled();
  });
  it('does not increment campaign counters for direct mail', async () => {
    await worker.process({ id: 'job', data: { ...data, campaignId: undefined, recipientId: undefined } } as never);
    expect(mail.sendMail).toHaveBeenCalled();
    expect(campaigns.incrementSentCount).not.toHaveBeenCalled();
  });
  it('rejects an unsafe configured public URL', async () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'javascript:alert(1)';
    await expect(worker.process({ id: 'job', data } as never)).rejects.toThrow('Invalid public URL');
    expect(mail.sendMail).not.toHaveBeenCalled();
  });

});
