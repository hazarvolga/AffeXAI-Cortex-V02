import { EmailCampaignController } from './email-campaign.controller';
import { EmailCampaignService } from './email-campaign.service';
import { CampaignSchedulerService } from './campaign-scheduler.service';
import { AutomationController } from './controllers/automation.controller';
import { AutomationService } from './services/automation.service';
import { AutomationQueueService } from './services/automation-queue.service';
// Use Swagger's equivalent mapped DTO helper in the CommonJS Jest harness.
jest.mock('@nestjs/mapped-types', () => ({ PartialType: require('@nestjs/swagger').PartialType }));
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { TenantModule } from '../../core/tenant/tenant.module';
import { UsersService } from '../users/users.service';
import { GroupController } from './group.controller';
import { SegmentController } from './segment.controller';
import { SubscriberController } from './subscriber.controller';
import { AnalyticsController } from './analytics.controller';
import { EmailMarketingController } from './email-marketing.controller';
import { IpReputationController } from './ip-reputation.controller';
import { StatsController } from './controllers/stats.controller';
import { GroupService } from './group.service';
import { Group } from './entities/group.entity';
import { SegmentService } from './segment.service';
import { SubscriberService } from './subscriber.service';
import { AnalyticsService } from './analytics.service';
import { EmailMarketingService } from './email-marketing.service';
import { IpReputationService } from './services/ip-reputation.service';
import { StatsService } from './services/stats.service';
import { AdvancedEmailValidationService } from './services/advanced-email-validation.service';

const routes = ['groups', 'segments', 'subscribers', 'analytics/overview', 'queue/status', 'ip-reputation/8.8.8.8', 'stats/recipients'];
describe('email marketing authorization HTTP boundary', () => {
  let app: INestApplication; let jwt: JwtService;
  const rows = [{ id: 'a', tenantId: 'tenant-a', name: 'A' }, { id: 'b', tenantId: 'tenant-b', name: 'B' }];
  const calls = jest.fn(() => []);
  const repository = { find: jest.fn(async ({ where }) => rows.filter(row => row.tenantId === where.tenantId)), findOne: jest.fn(async ({ where }) => rows.find(row => row.id === where.id && row.tenantId === where.tenantId)), save: jest.fn(), remove: jest.fn(), create: jest.fn(value => value) };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TenantModule, JwtModule.register({ secret: 'email-boundary-test-only-secret' })],
      controllers: [EmailCampaignController, AutomationController, GroupController, SegmentController, SubscriberController, AnalyticsController, EmailMarketingController, IpReputationController, StatsController],
      providers: [{ provide: EmailCampaignService, useValue: { send: calls, findAll: calls } }, { provide: CampaignSchedulerService, useValue: {} }, { provide: AutomationService, useValue: { findAll: calls } }, { provide: AutomationQueueService, useValue: { getQueueJobs: calls, getQueueMetrics: calls } }, GroupService, { provide: getRepositoryToken(Group), useValue: repository },
        { provide: UsersService, useValue: { findOne: async (id: string) => ({ id, tenantId: id === 'other' ? 'tenant-b' : 'tenant-a', isActive: true, tokenVersion: 1, roleNames: ['member'], roles: [{ name: 'member', permissions: id === 'viewer' ? [] : ['marketing.manage'] }] }) } },
        { provide: SegmentService, useValue: { findAll: calls } }, { provide: SubscriberService, useValue: { findAll: calls, unsubscribe: calls } },
        { provide: AnalyticsService, useValue: { getOverviewMetrics: calls } }, { provide: EmailMarketingService, useValue: { getQueueStatus: calls, sendEmail: calls } },
        { provide: IpReputationService, useValue: { checkIpReputation: calls } }, { provide: StatsService, useValue: { getRecipientStats: calls } },
        { provide: AdvancedEmailValidationService, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication(); app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })); await app.init(); jwt = module.get(JwtService);
  });
  afterAll(async () => app?.close());
  beforeEach(() => jest.clearAllMocks());
  const token = (sub = 'manager') => jwt.sign({ sub, tokenVersion: 1, type: 'access' });
  it.each(routes)('denies unauthenticated header-only access to %s', async path => {
    await request(app.getHttpServer()).get(`/email-marketing/${path}`).set('x-tenant-id', 'tenant-a').expect(401);
    expect(calls).not.toHaveBeenCalled();
  });
  it.each(routes)('denies authenticated user without marketing permissions to %s', async path => {
    await request(app.getHttpServer()).get(`/email-marketing/${path}`).auth(token('viewer'), { type: 'bearer' }).expect(403);
    expect(calls).not.toHaveBeenCalled();
  });
  it('denies arbitrary public unsubscribe by email', async () => {
    await request(app.getHttpServer()).post('/email-marketing/subscribers/unsubscribe').set('x-tenant-id', 'tenant-a').send({ email: 'victim@example.com' }).expect(401);
    expect(calls).not.toHaveBeenCalled();
  });
  it('uses only verified tenant for listing and rejects forged header', async () => {
    await request(app.getHttpServer()).get('/email-marketing/groups').auth(token(), { type: 'bearer' }).expect(200, [rows[0]]);
    await request(app.getHttpServer()).get('/email-marketing/groups').auth(token('other'), { type: 'bearer' }).expect(200, [rows[1]]);
    await request(app.getHttpServer()).get('/email-marketing/groups').auth(token(), { type: 'bearer' }).set('x-tenant-id', 'tenant-b').expect(403);
  });
  it('prevents foreign ID reads/writes/deletes', async () => {
    await request(app.getHttpServer()).get('/email-marketing/groups/b').auth(token(), { type: 'bearer' }).expect(404);
    await request(app.getHttpServer()).patch('/email-marketing/groups/b').auth(token(), { type: 'bearer' }).send({ name: 'stolen' }).expect(404);
    await request(app.getHttpServer()).delete('/email-marketing/groups/b').auth(token(), { type: 'bearer' }).expect(404);
    expect(repository.save).not.toHaveBeenCalled(); expect(repository.remove).not.toHaveBeenCalled();
  });
  it.each([
    { to: 'invalid', subject: 'Hi', body: 'Hello' },
    { to: 'user@example.test', subject: '', body: 'Hello' },
    { to: 'user@example.test', subject: 'Hi', body: 'Hello', tenantId: 'tenant-b' },
  ])('rejects invalid send payload before queue access %j', async data => {
    await request(app.getHttpServer()).post('/email-marketing/send').auth(token(), { type: 'bearer' }).send(data).expect(400);
    expect(calls).not.toHaveBeenCalled();
  });
  it('denies global queue status to tenant marketing managers', async () => {
    await request(app.getHttpServer()).get('/email-marketing/queue/status').auth(token(), { type: 'bearer' }).expect(403);
    expect(calls).not.toHaveBeenCalled();
  });

  it.each(['/email-marketing/automations/queue/metrics', '/email-marketing/automations/queue/jobs/waiting'])('protects global automation queue %s', async path => {
    await request(app.getHttpServer()).get(path).expect(401);
    await request(app.getHttpServer()).get(path).auth(token(), { type: 'bearer' }).expect(403);
    expect(calls).not.toHaveBeenCalled();
  });
  it('denies campaign sends by ordinary tenant members', async () => {
    await request(app.getHttpServer()).post('/email-campaigns/campaign-a/send').auth(token('viewer'), { type: 'bearer' }).expect(403);
    expect(calls).not.toHaveBeenCalled();
  });
  it('denies automation reads without marketing permission', async () => {
    await request(app.getHttpServer()).get('/email-marketing/automations').auth(token('viewer'), { type: 'bearer' }).expect(403);
    expect(calls).not.toHaveBeenCalled();
  });

});
