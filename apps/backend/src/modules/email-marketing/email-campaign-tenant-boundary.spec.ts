import { createHash } from 'crypto';
import { EmailCampaignService } from './email-campaign.service';

describe('EmailCampaignService tenant-safe dispatch', () => {
  it('uses deterministic recipient jobs and publishes the owning tenant', async () => {
    const campaign = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      subject: 'Hello',
      content: 'World',
      status: 'draft',
    };
    const repository = {
      findOne: jest.fn().mockResolvedValue(campaign),
      save: jest.fn(async value => value),
    };
    const queue = { add: jest.fn().mockResolvedValue({}) };
    const cache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
    };
    const events = { publishCampaignSent: jest.fn() };
    const subscribers = {
      findAll: jest.fn().mockResolvedValue([{ email: 'ada@example.test', status: 'active' }]),
      isEmailSuppressed: jest.fn().mockResolvedValue(false),
    };
    const tenants = { getTenantId: jest.fn().mockReturnValue('tenant-a') };
    const strategy = { emitSignal: jest.fn().mockResolvedValue(undefined) };
    const commerce = { checkLimit: jest.fn().mockResolvedValue({ allowed: true }) };
    const service = new EmailCampaignService(
      repository as never,
      queue as never,
      cache as never,
      events as never,
      subscribers as never,
      tenants as never,
      strategy as never,
      commerce as never,
    );

    await service.sendCampaign(campaign.id);

    const recipientHash = createHash('sha256').update('ada@example.test').digest('hex');
    expect(queue.add).toHaveBeenCalledWith(
      'sendCampaignEmail',
      expect.objectContaining({ tenantId: 'tenant-a', to: 'ada@example.test' }),
      { jobId: `campaign-${campaign.id}-${recipientHash}` },
    );
    expect(events.publishCampaignSent).toHaveBeenCalledWith(
      campaign.id,
      1,
      'tenant-a',
      'system',
    );
  });
});
