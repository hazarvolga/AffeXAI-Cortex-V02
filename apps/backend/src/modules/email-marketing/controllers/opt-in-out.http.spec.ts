import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { OptInOutController } from './opt-in-out.controller';
import { OptInOutService } from '../services/opt-in-out.service';
import { TenantModule } from '../../../core/tenant/tenant.module';
import { UsersService } from '../../users/users.service';

describe('subscription HTTP authorization', () => {
  let app: INestApplication; let jwt: JwtService;
  const calls = { subscribeWithDoubleOptIn: jest.fn(), resubscribe: jest.fn(), getPreferences: jest.fn(), updatePreferences: jest.fn(), canReceiveMarketingEmails: jest.fn(), canReceiveTransactionalEmails: jest.fn(), confirmOptIn: jest.fn(), unsubscribeWithToken: jest.fn() };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [TenantModule, JwtModule.register({ secret: 'isolated-subscription-http-test-secret' })], controllers: [OptInOutController], providers: [
      { provide: OptInOutService, useValue: calls }, { provide: UsersService, useValue: { findOne: async () => ({ id: 'user-a', email: 'owner@example.test', tenantId: 'tenant-a', tokenVersion: 1, isActive: true, roleNames: [] }) } },
    ] }).compile();
    app = module.createNestApplication(); await app.init(); jwt = module.get(JwtService);
  });
  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());
  const token = () => jwt.sign({ sub: 'user-a', type: 'access', tokenVersion: 1 });
  it.each(['preferences', 'can-receive-marketing', 'can-receive-transactional'])('protects %s from anonymous enumeration and other account reads', async route => {
    await request(app.getHttpServer()).get(`/email-marketing/subscription/${route}/victim@example.test`).expect(401);
    await request(app.getHttpServer()).get(`/email-marketing/subscription/${route}/victim@example.test`).auth(token(), { type: 'bearer' }).expect(403);
  });
  it('prevents arbitrary preference writes and allows verified own account', async () => {
    await request(app.getHttpServer()).put('/email-marketing/subscription/preferences').send({ email: 'owner@example.test', marketingEmails: true }).expect(401);
    await request(app.getHttpServer()).put('/email-marketing/subscription/preferences').auth(token(), { type: 'bearer' }).send({ email: 'victim@example.test', marketingEmails: true }).expect(403);
    expect(calls.updatePreferences).not.toHaveBeenCalled();
    await request(app.getHttpServer()).put('/email-marketing/subscription/preferences').auth(token(), { type: 'bearer' }).send({ email: 'owner@example.test', marketingEmails: false }).expect(200);
    expect(calls.updatePreferences).toHaveBeenCalledWith('owner@example.test', { marketingEmails: false, emailNotifications: undefined });
  });
  it.each(['confirm', 'unsubscribe'])('GET %s cannot consume a token via mail scanner', async route => {
    await request(app.getHttpServer()).get(`/email-marketing/subscription/${route}/token`).expect(404);
    expect(calls.confirmOptIn).not.toHaveBeenCalled(); expect(calls.unsubscribeWithToken).not.toHaveBeenCalled();
  });
  it('routes explicit POST consent actions and public requests without assuming success', async () => {
    await request(app.getHttpServer()).post('/email-marketing/subscription/subscribe').send({ email: 'person@example.test' }).expect(200);
    expect(calls.subscribeWithDoubleOptIn).toHaveBeenCalledWith('person@example.test', expect.anything(), expect.any(String));
    await request(app.getHttpServer()).post('/email-marketing/subscription/resubscribe').send({ email: 'person@example.test' }).expect(200);
    expect(calls.resubscribe).toHaveBeenCalled();
    await request(app.getHttpServer()).post('/email-marketing/subscription/confirm/token').expect(201);
    expect(calls.confirmOptIn).toHaveBeenCalledWith('token', expect.any(String));
    await request(app.getHttpServer()).post('/email-marketing/subscription/unsubscribe/token').expect(201);
    expect(calls.unsubscribeWithToken).toHaveBeenCalledWith('token', undefined, expect.any(String));
  });
  it.each(['preferences', 'can-receive-marketing', 'can-receive-transactional'])('allows own %s read', async route => {
    await request(app.getHttpServer()).get(`/email-marketing/subscription/${route}/owner@example.test`).auth(token(), { type: 'bearer' }).expect(200);
  });

});
