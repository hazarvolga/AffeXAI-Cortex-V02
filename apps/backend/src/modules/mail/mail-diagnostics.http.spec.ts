import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { UsersService } from '../users/users.service';
import { TenantModule } from '../../core/tenant/tenant.module';

describe('tenant mail diagnostics authorization', () => {
 let app: INestApplication; let jwt: JwtService;
 const mail = { sendMail: jest.fn(), testConnection: jest.fn().mockResolvedValue(true) };
 beforeAll(async () => {
  const mod = await Test.createTestingModule({ imports: [TenantModule, JwtModule.register({ secret: 'local-mail-diagnostics-test-only' })], controllers: [MailController], providers: [
   { provide: MailService, useValue: mail }, { provide: UsersService, useValue: { findOne: async (id: string) => ({ id, email: 'owner@example.test', tenantId: 'tenant-a', organizationId: 'org-a', organization: { id: 'org-a', slug: 'tenant-a', isActive: true }, isActive: true, tokenVersion: 1, roles: [{ permissions: id === 'manager' ? ['settings.manage'] : [] }], roleNames: ['member'] }) } },
  ] }).compile(); app = mod.createNestApplication(); app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })); await app.init(); jwt = mod.get(JwtService);
 });
 afterAll(async () => app.close()); beforeEach(() => { jest.clearAllMocks(); mail.sendMail.mockResolvedValue({ success: true, messageId: 'provider-id' }); });
 const token = (sub: string) => jwt.sign({ sub, tokenVersion: 1, type: 'access' });
 const payload = { to: 'owner@example.test', subject: 'Diagnostics', message: '<img src=x onerror=alert(1)>' };
 it('rejects anonymous diagnostics', async () => { await request(app.getHttpServer()).get('/mail/test-connection').expect(401); });
 it('denies ordinary members connection diagnostics', async () => { await request(app.getHttpServer()).get('/mail/test-connection').auth(token('viewer'), { type: 'bearer' }).expect(403); expect(mail.testConnection).not.toHaveBeenCalled(); });
 it('denies ordinary members system-channel sending', async () => { await request(app.getHttpServer()).post('/mail/send-test').auth(token('viewer'), { type: 'bearer' }).send(payload).expect(403); expect(mail.sendMail).not.toHaveBeenCalled(); });
 it('limits test recipient to the authenticated settings manager', async () => { await request(app.getHttpServer()).post('/mail/send-test').auth(token('manager'), { type: 'bearer' }).send({ ...payload, to: 'other@example.test' }).expect(403); expect(mail.sendMail).not.toHaveBeenCalled(); });
 it('escapes diagnostic content and passes verified tenant', async () => { await request(app.getHttpServer()).post('/mail/send-test').auth(token('manager'), { type: 'bearer' }).send(payload).expect(201); expect(mail.sendMail).toHaveBeenCalledWith(expect.objectContaining({ html: expect.stringContaining('&lt;img') }), 'tenant-a'); expect(mail.sendMail.mock.calls[0][0].html).not.toContain('Aluplan'); });
 it('does not report provider failure as accepted delivery or expose its error', async () => { mail.sendMail.mockResolvedValue({ success: false, error: 'sensitive-provider-detail' }); const response = await request(app.getHttpServer()).post('/mail/send-test').auth(token('manager'), { type: 'bearer' }).send(payload).expect(503); expect(JSON.stringify(response.body)).not.toContain('sensitive-provider-detail'); });
});
