import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Webhook } from 'svix';
import request from 'supertest';
import { ResendWebhookController } from './resend-webhook.controller';
import { WebhookService } from '../services/webhook.service';
import { TenantModule } from '../../../core/tenant/tenant.module';
import { TenantService } from '../../../core/tenant/tenant.service';

const secret = `whsec_${Buffer.from('isolated-webhook-secret-32-bytes!!').toString('base64')}`;
const body = { type: 'email.bounced', created_at: new Date().toISOString(), data: { email_id: 'provider-message-id', to: ['recipient@example.com'], bounce: { type: 'hard', message: 'mailbox not found' } } };
describe('Resend signature and tenant boundary HTTP', () => {
  let app: NestExpressApplication; let tenants: TenantService;
  const received = jest.fn();
  const process = jest.fn(async event => received(event, tenants.getTenantId()));
  const inbound = jest.fn();
  const old = { secret: global.process.env.RESEND_WEBHOOK_SECRET, tenant: global.process.env.RESEND_WEBHOOK_TENANT_ID, mode: global.process.env.NODE_ENV };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [TenantModule], controllers: [ResendWebhookController], providers: [{ provide: WebhookService, useValue: { processWebhookEvent: process, handleInboundEmail: inbound } }] }).compile();
    app = module.createNestApplication<NestExpressApplication>({ rawBody: true });
    app.useBodyParser('json', { limit: '10mb' });
    app.useBodyParser('urlencoded', { extended: true, limit: '10mb' });
    tenants = module.get(TenantService); await app.init();
  });
  beforeEach(() => { jest.clearAllMocks(); global.process.env.RESEND_WEBHOOK_SECRET = secret; global.process.env.RESEND_WEBHOOK_TENANT_ID = 'tenant-a'; global.process.env.NODE_ENV = 'test'; });
  afterAll(async () => { await app?.close(); for (const [key, value] of Object.entries({ RESEND_WEBHOOK_SECRET: old.secret, RESEND_WEBHOOK_TENANT_ID: old.tenant, NODE_ENV: old.mode })) { if (value === undefined) delete global.process.env[key]; else global.process.env[key] = value; } });
  const send = (path: string, raw: string, time = new Date()) => request(app.getHttpServer()).post(path).set('content-type', 'application/json').set('svix-id', 'msg_test').set('svix-timestamp', String(Math.floor(time.getTime()/1000))).set('svix-signature', new Webhook(secret).sign('msg_test', time, raw)).send(raw);
  it.each(['test', 'production'])('rejects unsigned outbound and inbound in %s', async mode => {
    global.process.env.NODE_ENV = mode;
    for (const path of ['/webhooks/resend', '/webhooks/resend/inbound']) await request(app.getHttpServer()).post(path).send(body).expect(400);
    expect(process).not.toHaveBeenCalled(); expect(inbound).not.toHaveBeenCalled();
  });
  it('fails closed on missing secret even for production inbound', async () => {
    delete global.process.env.RESEND_WEBHOOK_SECRET; global.process.env.NODE_ENV = 'production';
    await request(app.getHttpServer()).post('/webhooks/resend/inbound').send(body).expect(503); expect(inbound).not.toHaveBeenCalled();
  });
  it('verifies exact original bytes including whitespace', async () => {
    global.process.env.NODE_ENV = 'production';
    await send('/webhooks/resend', JSON.stringify(body, null, 2)).expect(201);
    expect(received).toHaveBeenCalledWith(expect.objectContaining({ metadata: expect.objectContaining({ tenantId: 'tenant-a' }) }), 'tenant-a');
  });
  it('rejects expired signatures and altered payloads', async () => {
    await send('/webhooks/resend', JSON.stringify(body), new Date(Date.now()-600000)).expect(400);
    await request(app.getHttpServer()).post('/webhooks/resend').set('content-type','application/json').set('svix-id','msg_test').set('svix-timestamp',String(Math.floor(Date.now()/1000))).set('svix-signature',new Webhook(secret).sign('msg_test',new Date(),JSON.stringify(body))).send(JSON.stringify({ ...body, type: 'email.complained' })).expect(400);
    expect(process).not.toHaveBeenCalled();
  });
  it('requires server binding and cannot route by forged tenant header', async () => {
    delete global.process.env.RESEND_WEBHOOK_TENANT_ID;
    await send('/webhooks/resend', JSON.stringify(body)).set('x-tenant-id','tenant-b').expect(503);
    expect(process).not.toHaveBeenCalled();
  });
  it('uses configured tenant even with a foreign unsigned routing hint', async () => {
    await send('/webhooks/resend',JSON.stringify(body)).set('x-tenant-id','tenant-b').expect(201);
    expect(received).toHaveBeenCalledWith(expect.objectContaining({ metadata: expect.objectContaining({ tenantId: 'tenant-a' }) }), 'tenant-a');
  });
  it('rejects unknown event types and malformed recipient payloads', async () => {
    await send('/webhooks/resend',JSON.stringify({ ...body, type: 'email.unknown' })).expect(400);
    await send('/webhooks/resend',JSON.stringify({ ...body, data: { ...body.data, to: ['not an email'] } })).expect(400);
    expect(process).not.toHaveBeenCalled();
  });
  it('keeps a soft bounce from becoming permanent suppression', async () => {
    await send('/webhooks/resend',JSON.stringify({ ...body, data: { ...body.data, bounce: { type: 'soft', message: 'mailbox full' } } })).expect(201);
    expect(received).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'soft_bounced' }), 'tenant-a');
  });
  it('fails honestly for signed inbound until reply capability support exists', async () => {
    await send('/webhooks/resend/inbound',JSON.stringify({ data: { from: 'attacker@example.com', to: 'ticket-123@example.com', headers: { 'x-tenant-id':'tenant-b' } } })).expect(503);
    expect(inbound).not.toHaveBeenCalled();
  });
});
