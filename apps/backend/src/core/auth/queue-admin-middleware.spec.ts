import express from 'express';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ModuleRef } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { createQueueAdminMiddleware } from './queue-admin-middleware';

const id = '7f9b2f7c-5ec4-4a67-8424-f0d20e89a693';
describe('platform queue dashboard boundary', () => {
  const previous = process.env.PLATFORM_ADMIN_USER_IDS;
  const jwt = new JwtService({ secret: 'queue-boundary-test-secret-with-at-least-32-chars' });
  let app: express.Express;
  let identity: Record<string, unknown>;
  beforeEach(() => {
    process.env.PLATFORM_ADMIN_USER_IDS = id;
    identity = { id, tenantId: 'platform', isActive: true, tokenVersion: 2, roles: [] };
    const users = { findOne: jest.fn(async () => identity) };
    const guard = new JwtAuthGuard(jwt, { get: () => users } as unknown as ModuleRef, new Reflector());
    guard.onModuleInit();
    app = express();
    app.use('/admin/queues', createQueueAdminMiddleware(guard));
    app.all('/admin/queues/api/jobs', (_req, res) => res.json({ protected: true }));
  });
  afterEach(() => { if (previous === undefined) delete process.env.PLATFORM_ADMIN_USER_IDS; else process.env.PLATFORM_ADMIN_USER_IDS = previous; });
  const token = (extra = {}) => jwt.sign({ sub: id, type: 'access', tokenVersion: 2, ...extra });
  it('rejects anonymous dashboard and queue actions', async () => {
    await request(app).get('/admin/queues/api/jobs').expect(401);
    await request(app).post('/admin/queues/api/jobs').expect(401);
  });
  it('rejects tenant administrators even with the reserved role name', async () => {
    identity = { ...identity, id: 'tenant-admin', roleNames: ['super_admin'] };
    await request(app).get('/admin/queues/api/jobs').set('Authorization', `Bearer ${token()}`).expect(403);
  });
  it.each([{ type: 'refresh' }, { tokenVersion: 1 }])('rejects wrong-purpose or revoked tokens %j', async claims => {
    await request(app).post('/admin/queues/api/jobs').set('Authorization', `Bearer ${token(claims)}`).expect(401);
  });
  it('allows only a current server-provisioned platform identity', async () => {
    await request(app).get('/admin/queues/api/jobs').set('Authorization', `Bearer ${token()}`).expect(200);
    identity = { ...identity, isActive: false };
    await request(app).post('/admin/queues/api/jobs').set('Authorization', `Bearer ${token()}`).expect(401);
  });
});
