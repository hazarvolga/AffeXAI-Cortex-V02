import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { InsightEngineController } from './insight-engine.controller';
import { InsightEngineService } from './services/insight-engine.service';
import { UsersService } from '../users/users.service';
import { TenantModule } from '../../core/tenant/tenant.module';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';

describe('manual insight authority', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const analyze = jest.fn().mockResolvedValue({ accepted: true });
  const identity = { id: 'tenant-user', tenantId: 'tenant-a', isActive: true, tokenVersion: 1, roles: [{ name: 'admin' }], roleNames: ['admin'] };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [TenantModule, JwtModule.register({ secret: 'isolated-insight-http-test-secret-32chars' })],
      controllers: [InsightEngineController], providers: [JwtAuthGuard, RolesGuard,
        { provide: UsersService, useValue: { findOne: jest.fn().mockResolvedValue(identity) } },
        { provide: InsightEngineService, useValue: { triggerManualAnalysis: analyze } },
      ],
    }).compile();
    app = module.createNestApplication(); await app.init(); jwt = module.get(JwtService);
  });
  afterAll(async () => app?.close());
  beforeEach(() => analyze.mockClear());
  const token = () => jwt.sign({ sub: identity.id, type: 'access', tokenVersion: 1 });
  it('rejects anonymous paid analysis triggers', async () => {
    await request(app.getHttpServer()).post('/insight-engine/analyze/manual').send({ tenantId: 'tenant-b' }).expect(401);
    expect(analyze).not.toHaveBeenCalled();
  });
  it('rejects a requested foreign tenant even with an authenticated admin', async () => {
    await request(app.getHttpServer()).post('/insight-engine/analyze/manual').set('Authorization', `Bearer ${token()}`).send({ tenantId: 'tenant-b' }).expect(403);
    expect(analyze).not.toHaveBeenCalled();
  });
  it('derives the analysis tenant from verified identity', async () => {
    await request(app.getHttpServer()).post('/insight-engine/analyze/manual').set('Authorization', `Bearer ${token()}`).send({}).expect(201);
    expect(analyze).toHaveBeenCalledWith('tenant-a');
  });
});
