import { MailService } from './mail.service';
import { TenantService } from '../../core/tenant/tenant.service';
import { EmailProvider } from '../settings/dto/email-settings.dto';
import { MailChannel } from './interfaces/mail-service.interface';
import { SesMailAdapter } from './adapters/ses-mail.adapter';
import { ResendMailAdapter } from './adapters/resend-mail.adapter';
jest.mock('./adapters/resend-mail.adapter', () => ({ ResendMailAdapter: jest.fn().mockImplementation(() => ({ sendMail: jest.fn().mockResolvedValue({ success: true }), sendBulk: jest.fn().mockResolvedValue([]), testConnection: jest.fn().mockResolvedValue(true) })) }));
jest.mock('./adapters/ses-mail.adapter', () => ({ SesMailAdapter: jest.fn().mockImplementation(() => ({ testConnection: jest.fn().mockResolvedValue(true) })) }));

describe('mail tenant routing boundary', () => {
 const tenants = new TenantService();
 let revision = 1;
 const settings = { getEmailSettings: jest.fn(), getEmailSettingsSnapshot: jest.fn(), getSiteSettings: jest.fn().mockResolvedValue({}) };
 let service: MailService;
 const message = { to: { email: 'fixture@example.test' }, subject: 'Fixture', html: '<p>Fixture</p>', from: { email: 'sender@example.test' }, channel: MailChannel.TRANSACTIONAL };
 beforeEach(() => {
  jest.clearAllMocks();
  settings.getEmailSettings.mockResolvedValue({ provider: EmailProvider.RESEND, resend: { apiKey: 'local-mocked-key' } });
  settings.getEmailSettingsSnapshot.mockImplementation(async (tenantId: string) => ({ revision, settings: await settings.getEmailSettings(tenantId) }));
  service = new MailService(settings as never, {} as never, tenants);
 });
 const operations = ['sendMail', 'sendBulk', 'testConnection'] as const;
 const call = (method: typeof operations[number], tenant?: string) => method === 'sendMail' ? service.sendMail(message, tenant) : method === 'sendBulk' ? service.sendBulk({ emails: [message] }, tenant) : service.testConnection(tenant);
 it.each(operations)('%s rejects missing scope before provider settings', async method => {
  await expect(call(method)).rejects.toThrow(); expect(settings.getEmailSettings).not.toHaveBeenCalled(); expect(ResendMailAdapter).not.toHaveBeenCalled();
 });
 it.each(operations)('%s does not promote public routing hints', async method => {
  await tenants.runWithTenant({ tenantId: 'tenant-a', source: 'public' }, async () => { await expect(call(method)).rejects.toThrow(); });
  expect(settings.getEmailSettings).not.toHaveBeenCalled();
 });
 it.each(operations)('%s rejects explicit foreign tenant', async method => {
  await tenants.runWithTenant({ tenantId: 'tenant-a', source: 'authenticated' }, async () => { await expect(call(method, 'tenant-b')).rejects.toThrow(); });
  expect(settings.getEmailSettings).not.toHaveBeenCalled();
 });
 it.each(operations)('%s resolves authenticated scope', async method => {
  await tenants.runWithTenant({ tenantId: 'tenant-a', source: 'authenticated' }, () => call(method));
  expect(settings.getEmailSettings).toHaveBeenCalledWith('tenant-a');
 });
 it.each(operations)('%s accepts explicit tenant in background execution', async method => {
  await call(method, 'tenant-b'); expect(settings.getEmailSettings).toHaveBeenCalledWith('tenant-b');
 });
 it.each(['', 'bad tenant', '../foreign'])('rejects malformed explicit tenant %p', async tenant => { await expect(service.sendMail(message, tenant)).rejects.toThrow(); expect(settings.getEmailSettings).not.toHaveBeenCalled(); });
 it('resolves explicitly trusted system scope', async () => { await tenants.runWithTenant({ tenantId: 'tenant-system', source: 'system' }, () => service.testConnection()); expect(settings.getEmailSettings).toHaveBeenCalledWith('tenant-system'); });
 it('permits explicitly bound public confirmation tenant', async () => { await tenants.runWithTenant({ tenantId: 'tenant-a', source: 'public' }, () => service.sendMail(message, 'tenant-a')); expect(settings.getEmailSettings).toHaveBeenCalledWith('tenant-a'); });
 it('refreshes cached adapter after credential rotation and reuses unchanged credentials', async () => {
  await service.testConnection('tenant-a'); await service.testConnection('tenant-a');
  expect(ResendMailAdapter).toHaveBeenCalledTimes(1);
  settings.getEmailSettings.mockResolvedValue({ provider: EmailProvider.RESEND, resend: { apiKey: 'rotated-local-fixture' } });
  await service.testConnection('tenant-a'); expect(ResendMailAdapter).toHaveBeenCalledTimes(2);
 });
 it('refreshes a cached adapter when the tenant revision changes even if values are equal', async () => {
  await service.testConnection('tenant-a'); revision += 1; await service.testConnection('tenant-a');
  expect(ResendMailAdapter).toHaveBeenCalledTimes(2);
 });
 it('does not reuse cached credentials after they are removed', async () => {
  await service.testConnection('tenant-a'); settings.getEmailSettings.mockResolvedValue({ provider: EmailProvider.RESEND, resend: {} });
  expect(await service.testConnection('tenant-a')).toBe(false);
 });
 it('isolates cached adapters even with identical configuration', async () => {
  await service.testConnection('tenant-a'); await service.testConnection('tenant-b');
  expect(ResendMailAdapter).toHaveBeenCalledTimes(2);
 });
 it('uses a single provider/settings snapshot per send', async () => {
  await service.sendMail(message, 'tenant-a'); expect(settings.getEmailSettings).toHaveBeenCalledTimes(1);
 });

 it('rotates provider and SES credential/region combinations without reusing the prior adapter', async () => {
  await service.testConnection('tenant-a');
  settings.getEmailSettings.mockResolvedValue({ provider: EmailProvider.SES, ses: { accessKey: 'fixture-access', secretKey: 'fixture-secret', region: 'eu-central-1' } });
  expect(await service.testConnection('tenant-a')).toBe(true);
  settings.getEmailSettings.mockResolvedValue({ provider: EmailProvider.SES, ses: { accessKey: 'fixture-access', secretKey: 'fixture-new-secret', region: 'us-east-1' } });
  expect(await service.testConnection('tenant-a')).toBe(true);
  expect(SesMailAdapter).toHaveBeenCalledTimes(2); expect(ResendMailAdapter).toHaveBeenCalledTimes(1);
 });
 it('a delayed old settings read cannot make later requests reuse stale credentials', async () => {
  let release!: (value: unknown) => void;
  settings.getEmailSettings.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  const oldRequest = service.testConnection('tenant-a');
  const fresh = { provider: EmailProvider.RESEND, resend: { apiKey: 'fresh-fixture' } };
  settings.getEmailSettings.mockResolvedValue(fresh);
  await service.testConnection('tenant-a');
  release({ provider: EmailProvider.RESEND, resend: { apiKey: 'old-fixture' } }); await oldRequest;
  await service.testConnection('tenant-a');
  expect(ResendMailAdapter).toHaveBeenLastCalledWith('fresh-fixture');
 });

});
