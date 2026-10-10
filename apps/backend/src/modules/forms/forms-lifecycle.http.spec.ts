import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/guards/permissions.guard';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';

describe('Forms lifecycle HTTP contract', () => {
  let app: INestApplication;
  const tenantId = 'xyz-company-ui';
  const formId = randomUUID();
  const published = {
    id: formId,
    name: 'Contact',
    description: null,
    structure: { rows: [], settings: {} },
    settings: {},
  };
  const formsService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: formId, tenantId }),
    create: jest.fn().mockResolvedValue({ id: formId, tenantId, status: 'draft' }),
    update: jest.fn().mockResolvedValue({ id: formId, tenantId, status: 'draft' }),
    remove: jest.fn().mockResolvedValue(undefined),
    findSubmissions: jest.fn().mockResolvedValue([]),
    submit: jest.fn().mockResolvedValue({ id: randomUUID() }),
    findPublished: jest.fn().mockResolvedValue(published),
    publish: jest.fn().mockResolvedValue({ ...published, status: 'published' }),
    unpublish: jest.fn().mockResolvedValue({ ...published, status: 'draft' }),
  };
  const authGuard: CanActivate = {
    canActivate(context: ExecutionContext) {
      context.switchToHttp().getRequest().user = { id: randomUUID(), tenantId };
      return true;
    },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [FormsController],
      providers: [{ provide: FormsService, useValue: formsService }],
    })
      .overrideGuard(JwtAuthGuard).useValue(authGuard)
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('serves the exact published public route and delegates tenant plus form UUIDs', async () => {
    const response = await request(app.getHttpServer())
      .get(`/forms/public/${tenantId}/${formId}`)
      .expect(200);

    expect(response.body).toEqual(published);
    expect(formsService.findPublished).toHaveBeenCalledWith(formId, tenantId);
  });

  it.each([
    `/forms/public/Bad.Slug!/${formId}`,
    `/forms/public/${tenantId}/not-a-uuid`,
    `/forms/public/Bad.Slug!/${formId}/submissions`,
    `/forms/public/${tenantId}/not-a-uuid/submissions`,
  ])('rejects malformed public tenant or form params at %s', async (path) => {
    const method = path.endsWith('/submissions') ? 'post' : 'get';
    await request(app.getHttpServer())[method](path).send({ data: {} }).expect(400);
  });

  it('exposes explicit publish and unpublish endpoints with UUID validation', async () => {
    await request(app.getHttpServer()).post(`/forms/${formId}/publish`).expect(201);
    await request(app.getHttpServer()).post(`/forms/${formId}/unpublish`).expect(201);
    await request(app.getHttpServer()).post('/forms/not-a-uuid/publish').expect(400);

    expect(formsService.publish).toHaveBeenCalledWith(formId, tenantId);
    expect(formsService.unpublish).toHaveBeenCalledWith(formId, tenantId);
  });

  it('keeps authenticated CRUD and submission reads scoped to the guard tenant', async () => {
    await request(app.getHttpServer()).get('/forms').expect(200);
    await request(app.getHttpServer()).get(`/forms/${formId}`).expect(200);
    await request(app.getHttpServer()).post('/forms').send({ name: 'Draft', structure: {} }).expect(201);
    await request(app.getHttpServer()).patch(`/forms/${formId}`).send({ name: 'Renamed' }).expect(200);
    await request(app.getHttpServer()).delete(`/forms/${formId}`).expect(200);
    await request(app.getHttpServer()).get(`/forms/${formId}/submissions`).expect(200);

    expect(formsService.findAll).toHaveBeenCalledWith(tenantId);
    expect(formsService.findOne).toHaveBeenCalledWith(formId, tenantId);
    expect(formsService.create).toHaveBeenCalledWith(tenantId, expect.objectContaining({ name: 'Draft' }));
    expect(formsService.update).toHaveBeenCalledWith(formId, tenantId, { name: 'Renamed' });
    expect(formsService.remove).toHaveBeenCalledWith(formId, tenantId);
    expect(formsService.findSubmissions).toHaveBeenCalledWith(formId, tenantId);
  });
});
