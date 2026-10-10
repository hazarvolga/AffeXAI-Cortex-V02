jest.mock('@nestjs/mapped-types', () => ({ PartialType: require('@nestjs/swagger').PartialType }));
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { TenantModule } from '../../core/tenant/tenant.module';
import { UsersService } from '../users/users.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { S3Service } from './s3.service';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jVxkAAAAASUVORK5CYII=', 'base64');
describe('media multipart HTTP boundary', () => {
  let app: INestApplication; let jwt: JwtService;
  const write = jest.fn(); const persist = jest.fn();
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [TenantModule, JwtModule.register({ secret: 'isolated-media-http-secret' })], controllers: [MediaController], providers: [
      { provide: MediaService, useValue: { createFromUpload: persist, findAll: persist, create: persist, update: persist, remove: persist } }, { provide: S3Service, useValue: { uploadFile: write } }, { provide: ConfigService, useValue: {} },
      { provide: UsersService, useValue: { findOne: async (id: string) => ({ id, tenantId: 'tenant-a', tokenVersion: 1, isActive: true, roleNames: [id] }) } },
    ] }).compile(); app = module.createNestApplication(); app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })); await app.init(); jwt = module.get(JwtService);
  });
  beforeEach(() => { jest.clearAllMocks(); write.mockResolvedValue('https://cdn.example.test/tenant-a/image.png'); persist.mockImplementation(async value => value); });
  afterAll(async () => app.close());
  const token = (sub = 'editor') => jwt.sign({ sub, type: 'access', tokenVersion: 1 });
  it('rejects unsigned upload before storage', async () => {
    await request(app.getHttpServer()).post('/media/upload').attach('file', png, { filename: 'valid.png', contentType: 'image/png' }).expect(401);
    expect(write).not.toHaveBeenCalled();
  });
  it.each([['attack.svg', 'image/svg+xml'], ['attack.png', 'image/png']])('rejects script bytes presented as %s', async (filename, contentType) => {
    await request(app.getHttpServer()).post('/media/upload').auth(token(), { type: 'bearer' }).attach('file', Buffer.from('<svg onload="alert(1)"/>'), { filename, contentType }).expect(400);
    expect(write).not.toHaveBeenCalled();
  });
  it('uploads actual PNG multipart with fresh verified tenant', async () => {
    await request(app.getHttpServer()).post('/media/upload').auth(token(), { type: 'bearer' }).attach('file', png, { filename: 'valid.png', contentType: 'image/png' }).expect(201);
    expect(write).toHaveBeenCalledWith(expect.any(String), png, 'image/png', 'tenant-a', expect.anything());
    expect(persist).toHaveBeenCalledWith(expect.objectContaining({ size: png.length }), 'tenant-a');
  });
  it.each(['customer', 'viewer'])('denies %s library listing, metadata mutations and upload before storage', async role => {
    await request(app.getHttpServer()).get('/media').auth(token(role), { type: 'bearer' }).expect(403);
    await request(app.getHttpServer()).post('/media').auth(token(role), { type: 'bearer' }).send({}).expect(403);
    await request(app.getHttpServer()).patch('/media/image-id').auth(token(role), { type: 'bearer' }).send({ title: 'Changed' }).expect(403);
    await request(app.getHttpServer()).delete('/media/image-id').auth(token(role), { type: 'bearer' }).expect(403);
    await request(app.getHttpServer()).post('/media/upload').auth(token(role), { type: 'bearer' }).attach('file', png, { filename: 'valid.png', contentType: 'image/png' }).expect(403);
    expect(write).not.toHaveBeenCalled(); expect(persist).not.toHaveBeenCalled();
  });
  it.each(['admin', 'editor', 'marketing_manager'])('allows authorized %s library access', async role => {
    await request(app.getHttpServer()).get('/media').auth(token(role), { type: 'bearer' }).expect(200);
    expect(persist).toHaveBeenCalled();
  });

});
