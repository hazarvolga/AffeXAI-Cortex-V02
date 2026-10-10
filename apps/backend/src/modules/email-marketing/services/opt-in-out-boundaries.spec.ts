import { OptInOutService } from './opt-in-out.service';
import { Repository } from 'typeorm';
import { Subscriber } from '../entities/subscriber.entity';
import { MailService } from '../../mail/mail.service';
import { TenantService } from '../../../core/tenant/tenant.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscriberStatus } from '@affexai/shared-types';

describe('public subscription consent boundaries', () => {
  let record: Subscriber | null;
  let tenant: string | undefined;
  const repo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), update: jest.fn() };
  const mail = { sendMail: jest.fn() };
  let service: OptInOutService;
  beforeEach(() => {
    jest.resetAllMocks(); tenant = 'tenant-a'; record = null;
    repo.findOne.mockImplementation(async () => record);
    repo.create.mockImplementation(value => ({ id: 'subscriber-id', ...value }));
    repo.save.mockImplementation(async value => { record = value; return value; });
    repo.update.mockResolvedValue({ affected: 1 });
    mail.sendMail.mockResolvedValue({ success: true });
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:9006';
    service = new OptInOutService(repo as unknown as Repository<Subscriber>, mail as unknown as MailService,
      { getTenantId: () => tenant } as TenantService, { emit: jest.fn() } as unknown as EventEmitter2);
  });
  it('requires explicit tenant before looking up any email', async () => {
    tenant = undefined;
    await expect(service.subscribeWithDoubleOptIn('person@example.test')).rejects.toMatchObject({ status: 400 });
    expect(repo.findOne).not.toHaveBeenCalled();
  });
  it('returns same response for existing active and new subscriber', async () => {
    const created = await service.subscribeWithDoubleOptIn('person@example.test');
    record = { ...record, status: SubscriberStatus.ACTIVE, isDoubleOptIn: true } as Subscriber;
    await expect(service.subscribeWithDoubleOptIn('person@example.test')).resolves.toEqual(created);
  });
  it('rejects legacy UUID confirmation and unsubscribe before repository access', async () => {
    await expect(service.confirmOptIn('00000000-0000-4000-8000-000000000000')).rejects.toMatchObject({ status: 400 });
    await expect(service.unsubscribeWithToken('00000000-0000-4000-8000-000000000000')).rejects.toMatchObject({ status: 400 });
    expect(repo.findOne).not.toHaveBeenCalled();
  });
  it('issues purpose scoped expiring token and consumes atomically without ambient tenant', async () => {
    await service.subscribeWithDoubleOptIn('person@example.test');
    const token = record!.optInToken;
    expect(token).toMatch(/^v1\.confirm\./);
    tenant = undefined;
    await service.confirmOptIn(token);
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-a', optInToken: token }), expect.objectContaining({ status: SubscriberStatus.ACTIVE, optInToken: expect.any(Function) }));
    repo.update.mockResolvedValue({ affected: 0 });
    await expect(service.confirmOptIn(token)).rejects.toMatchObject({ status: 400 });
  });
  it('does not restore unsubscribed consent on arbitrary resubscribe request', async () => {
    record = { id: 'subscriber-id', email: 'person@example.test', tenantId: 'tenant-a', status: SubscriberStatus.UNSUBSCRIBED, marketingEmails: false, isDoubleOptIn: false } as Subscriber;
    await service.resubscribe('person@example.test');
    expect(record!.status).toBe(SubscriberStatus.UNSUBSCRIBED);
    expect(record!.marketingEmails).toBe(false);
  });
  it('does not claim confirmation mail sent when delivery returns failure', async () => {
    mail.sendMail.mockResolvedValue({ success: false });
    const response = await service.subscribeWithDoubleOptIn('person@example.test');
    expect(response.message).not.toMatch(/gönderildi|gönderilen/);
  });
  it.each(['expired', 'purpose', 'tenant'])('rejects %s token before repository lookup', async mutation => {
    await service.subscribeWithDoubleOptIn('person@example.test');
    const parts = record!.optInToken.split('.');
    if (mutation === 'expired') parts[3] = String(Date.now() - 1000);
    if (mutation === 'purpose') parts[1] = 'unsubscribe';
    if (mutation === 'tenant') tenant = 'tenant-b';
    repo.findOne.mockClear();
    await expect(service.confirmOptIn(parts.join('.'))).rejects.toMatchObject({ status: 400 });
    expect(repo.findOne).not.toHaveBeenCalled();
  });
  it('does not grant marketing consent when explicitly declined', async () => {
    await service.subscribeWithDoubleOptIn('person@example.test', { marketingEmails: false });
    await service.confirmOptIn(record!.optInToken);
    expect(repo.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ marketingEmails: false }));
  });
  it('preserves a valid unsubscribe token across concurrent mail preparation', async () => {
    await service.subscribeWithDoubleOptIn('person@example.test');
    record = { ...record, status: SubscriberStatus.ACTIVE, isDoubleOptIn: true, unsubscribeToken: 'legacy' } as Subscriber;
    repo.update.mockImplementation(async (_where, updates) => { record = { ...record, ...updates } as Subscriber; return { affected: 1 }; });
    const first = await service.ensureUnsubscribeToken(record.id, 'tenant-a');
    const second = await service.ensureUnsubscribeToken(record.id, 'tenant-a');
    expect(second).toBe(first);
    expect(repo.update).toHaveBeenCalledTimes(1);
  });
  it('CAS loser rereads winner token rather than returning an invalidated token', async () => {
    await service.subscribeWithDoubleOptIn('person@example.test');
    const winner = record!.optInToken.replace('.confirm.', '.unsubscribe.');
    record = { ...record, status: SubscriberStatus.ACTIVE, isDoubleOptIn: true, unsubscribeToken: 'legacy' } as Subscriber;
    repo.update.mockImplementation(async () => { record = { ...record, unsubscribeToken: winner } as Subscriber; return { affected: 0 }; });
    await expect(service.ensureUnsubscribeToken(record.id, 'tenant-a')).resolves.toBe(winner);
  });
  it('unsubscribe consumes token and cancels any outstanding reconfirmation', async () => {
    await service.subscribeWithDoubleOptIn('person@example.test');
    const token = record!.optInToken.replace('.confirm.', '.unsubscribe.');
    record = { ...record, unsubscribeToken: token } as Subscriber;
    await service.unsubscribeWithToken(token, 'No longer needed');
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-a', unsubscribeToken: token }), expect.objectContaining({ marketingEmails: false, emailNotifications: false, optInToken: expect.any(Function), unsubscribeToken: expect.any(Function) }));
  });
  it('preference changes cannot skip double opt-in or disclose stored tokens', async () => {
    await service.subscribeWithDoubleOptIn('person@example.test');
    await expect(service.updatePreferences('person@example.test', { marketingEmails: true })).rejects.toMatchObject({ status: 400 });
    const result = await service.updatePreferences('person@example.test', { marketingEmails: false });
    expect(result).not.toHaveProperty('optInToken'); expect(result).not.toHaveProperty('unsubscribeToken');
  });

  it.each(['', 'not-email', 'x'.repeat(255)])('rejects invalid email %s', async email => {
    await expect(service.subscribeWithDoubleOptIn(email)).rejects.toMatchObject({ status: 400 });
  });
  it('rejects oversized profile fields and handles missing token targets', async () => {
    await expect(service.subscribeWithDoubleOptIn('person@example.test', { firstName: 'x'.repeat(129) })).rejects.toMatchObject({ status: 400 });
    await service.subscribeWithDoubleOptIn('person@example.test');
    const token = record!.optInToken; record = null;
    await expect(service.confirmOptIn(token)).rejects.toMatchObject({ status: 400 });
    await expect(service.unsubscribeWithToken(token.replace('.confirm.', '.unsubscribe.'))).rejects.toMatchObject({ status: 400 });
    await expect(service.getPreferences('person@example.test')).rejects.toMatchObject({ status: 400 });
    await expect(service.updatePreferences('person@example.test', {})).rejects.toMatchObject({ status: 400 });
    await expect(service.ensureUnsubscribeToken('missing', 'tenant-a')).rejects.toMatchObject({ status: 400 });
  });
  it('checks marketing eligibility and does not expose stored token fields in reads', async () => {
    await expect(service.canReceiveMarketingEmails('person@example.test')).resolves.toBe(false);
    await expect(service.canReceiveTransactionalEmails('person@example.test')).resolves.toBe(true);
    await service.subscribeWithDoubleOptIn('person@example.test');
    record = { ...record, status: SubscriberStatus.ACTIVE, isDoubleOptIn: true, marketingEmails: true, emailNotifications: true, transactionalEmails: false } as Subscriber;
    await expect(service.canReceiveMarketingEmails('person@example.test')).resolves.toBe(true);
    await expect(service.canReceiveTransactionalEmails('person@example.test')).resolves.toBe(false);
    expect(await service.getPreferences('person@example.test')).not.toHaveProperty('optInToken');
    await expect(service.updatePreferences('person@example.test', { marketingEmails: false, emailNotifications: false })).resolves.toMatchObject({ marketingEmails: false, emailNotifications: false });
  });
  it('rejects expired unsubscribe replay and excessive reason', async () => {
    await service.subscribeWithDoubleOptIn('person@example.test');
    const token = record!.optInToken.replace('.confirm.', '.unsubscribe.');
    await expect(service.unsubscribeWithToken(token, 'x'.repeat(501))).rejects.toMatchObject({ status: 400 });
    repo.update.mockResolvedValue({ affected: 0 });
    await expect(service.unsubscribeWithToken(token)).rejects.toMatchObject({ status: 400 });
  });
  it('fails after bounded CAS contention without returning a loser token', async () => {
    await service.subscribeWithDoubleOptIn('person@example.test');
    record = { ...record, status: SubscriberStatus.ACTIVE, isDoubleOptIn: true, unsubscribeToken: 'legacy' } as Subscriber;
    repo.update.mockResolvedValue({ affected: 0 });
    await expect(service.ensureUnsubscribeToken(record.id, 'tenant-a')).rejects.toMatchObject({ status: 400 });
    expect(repo.update).toHaveBeenCalledTimes(3);
  });

  it('preference write never restores a concurrent unsubscribe or overwrites lifecycle tokens', async () => {
    await service.subscribeWithDoubleOptIn('person@example.test');
    record = { ...record, status: SubscriberStatus.ACTIVE, isDoubleOptIn: true } as Subscriber;
    repo.save.mockClear(); repo.update.mockResolvedValue({ affected: 0 });
    await expect(service.updatePreferences('person@example.test', { marketingEmails: true })).rejects.toMatchObject({ status: 400 });
    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ status: SubscriberStatus.ACTIVE, isDoubleOptIn: true }), { marketingEmails: true });
  });
  it('reissues consent for legacy active unconfirmed without saving stale account state', async () => {
    record = { id: 'subscriber-id', tenantId: 'tenant-a', email: 'person@example.test', status: SubscriberStatus.ACTIVE, isDoubleOptIn: false, optInToken: 'old' } as Subscriber;
    await service.subscribeWithDoubleOptIn('person@example.test');
    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ optInToken: 'old', isDoubleOptIn: false }), expect.objectContaining({ optInToken: expect.stringMatching(/^v1\.confirm\./) }));
  });
  it('concurrent signup duplicate is acknowledged without exposing account existence', async () => {
    repo.save.mockRejectedValue({ code: '23505' });
    await expect(service.subscribeWithDoubleOptIn('person@example.test')).resolves.toMatchObject({ requiresConfirmation: true });
    expect(mail.sendMail).not.toHaveBeenCalled();
  });

  it.each([SubscriberStatus.BOUNCED, SubscriberStatus.COMPLAINED])('cannot restore suppressed %s account through public consent', async status => {
    await service.subscribeWithDoubleOptIn('person@example.test');
    const token = record!.optInToken;
    record = { ...record, status } as Subscriber;
    repo.save.mockClear(); repo.update.mockClear(); mail.sendMail.mockClear();
    await service.resubscribe('person@example.test');
    expect(repo.update).not.toHaveBeenCalled(); expect(mail.sendMail).not.toHaveBeenCalled();
    await expect(service.confirmOptIn(token)).rejects.toMatchObject({ status: 400 });
  });

});
