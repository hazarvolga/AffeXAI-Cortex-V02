import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { IntegrationController } from './integration.controller';
import { EventBusService } from '../services/event-bus.service';
import { UsersService } from '../../users/users.service';
import { TenantModule } from '../../../core/tenant/tenant.module';

describe('integration read authorization', () => {
 let app: INestApplication; let jwt: JwtService;
 const mail = Object.fromEntries(['getRecentEvents','getEventsByType','getEventsBySource','getEventsWithAutomation','getEventStats'].map(key => [key, jest.fn().mockResolvedValue([])]));
 beforeAll(async () => {
  const mod = await Test.createTestingModule({ imports: [TenantModule, JwtModule.register({ secret: 'local-mail-diagnostics-test-only' })], controllers: [IntegrationController], providers: [
   { provide: EventBusService, useValue: mail }, { provide: UsersService, useValue: { findOne: async (id: string) => ({ id, email: 'owner@example.test', tenantId: 'tenant-a', organizationId: 'org-a', organization: { id: 'org-a', slug: 'tenant-a', isActive: true }, isActive: true, tokenVersion: 1, roles: [{ permissions: id === 'manager' ? ['settings.manage'] : [] }], roleNames: ['member'] }) } },
  ] }).compile(); app = mod.createNestApplication(); app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })); await app.init(); jwt = mod.get(JwtService);
 });
 afterAll(async () => app.close()); beforeEach(() => { jest.clearAllMocks(); });
 const token = (sub: string) => jwt.sign({ sub, tokenVersion: 1, type: 'access' });
 const paths = ['/integration/events', '/integration/events/type/page.published', '/integration/events/source/cms', '/integration/events/automated', '/integration/events/stats'];
 it.each(paths)('denies anonymous access %s', async path => { await request(app.getHttpServer()).get(path).expect(401); });
 it.each(paths)('denies unprivileged member %s', async path => { await request(app.getHttpServer()).get(path).auth(token('viewer'), { type: 'bearer' }).expect(403); });
 it.each(paths)('permits settings manager with server-derived tenant %s', async path => { await request(app.getHttpServer()).get(path).set('x-tenant-id', 'tenant-b').auth(token('manager'), { type: 'bearer' }).expect(403); });
 it('returns scoped stats for settings manager', async () => { await request(app.getHttpServer()).get('/integration/events/stats').auth(token('manager'), { type: 'bearer' }).expect(200); expect(mail.getEventStats).toHaveBeenCalledWith('tenant-a', undefined, undefined); });
});
