import { validateMediaMetadata, validateRasterUpload } from './media-upload-policy';
import { MediaService } from './media.service';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { EventBusService } from '../platform-integration/services/event-bus.service';
import { TenantService } from '../../core/tenant/tenant.service';

describe('media metadata tenant boundary', () => {
  const repo = { create: jest.fn(value => value), save: jest.fn(async value => value), update: jest.fn(async () => ({ affected: 1 })), find: jest.fn(), findOne: jest.fn() };
  const events = { publishMediaUploaded: jest.fn() };
  let tenant: string | undefined = 'tenant-a';
  const service = new MediaService(repo as unknown as Repository<Media>, events as unknown as EventBusService, { getTenantId: () => tenant } as TenantService);
  beforeEach(() => { jest.clearAllMocks(); tenant = 'tenant-a'; delete process.env.MEDIA_ALLOWED_EXTERNAL_ORIGINS; });
  const dto = { filename: 'image.png', originalName: 'image.png', mimeType: 'image/png', size: 64, url: 'https://cdn.example.test/image.png' };
  it('requires configured external origin for metadata-only registration', async () => {
    await expect(service.create(dto)).rejects.toThrow(); expect(repo.save).not.toHaveBeenCalled();
    process.env.MEDIA_ALLOWED_EXTERNAL_ORIGINS = 'https://cdn.example.test';
    await expect(service.create(dto)).resolves.toMatchObject({ tenantId: 'tenant-a' });
  });
  it('requires tenant context even for server-issued upload metadata', async () => {
    tenant = undefined;
    await expect(service.createFromUpload(dto, 'tenant-a')).rejects.toMatchObject({ status: 401 });
    expect(repo.save).not.toHaveBeenCalled();
  });
  it('rejects foreign explicit scope and missing context on reads', async () => {
    await expect(service.findOne('id', 'tenant-b')).rejects.toMatchObject({ status: 403 });
    tenant = undefined;
    await expect(service.findAll()).rejects.toMatchObject({ status: 401 });
    expect(repo.find).not.toHaveBeenCalled();
  });
  it('rejects mass assignment even on internal create', async () => {
    await expect(service.createFromUpload({ ...dto, tenantId: 'tenant-b' } as typeof dto, 'tenant-a')).rejects.toThrow();
  });
  it('updates presentation only without replaying identity or stale storage fields', async () => {
    repo.findOne.mockResolvedValue({ id: 'image-id', tenantId: 'tenant-a', ...dto });
    await expect(service.update('image-id', { url: 'https://foreign.example/image.png' })).rejects.toThrow();
    await service.update('image-id', { title: 'New title' });
    expect(repo.update).toHaveBeenCalledWith({ id: 'image-id', tenantId: 'tenant-a' }, { title: 'New title' });
    expect(repo.save).not.toHaveBeenCalled();
  });
  it('rejects public active content and malformed links independently of upload transport', () => {
    for (const url of ['//evil.example/file.png', '/uploads/private/secret.pdf', '/uploads/public/attack.svg', 'https://cdn.example.test/attack%2Esvg', '/uploads/tickets/../secret', 'https://cdn.example.test/file.svg']) {
      expect(() => validateMediaMetadata({ url }, true)).toThrow();
    }
    expect(() => validateMediaMetadata({ mimeType: 'image/svg+xml' }, true)).toThrow();
    expect(() => validateMediaMetadata({ url: '/uploads/tickets/private-reference.pdf' })).not.toThrow();
  });
});

describe('raster file signatures', () => {
  it('accepts matching GIF envelope and rejects oversized buffer', () => {
    const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
    expect(validateRasterUpload({ originalname: 'pixel.GIF', mimetype: 'image/gif', buffer, size: buffer.length })).toEqual({ extension: '.gif', mimeType: 'image/gif' });
    expect(() => validateRasterUpload({ originalname: 'large.png', mimetype: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1), size: 1 })).toThrow();
  });
});

it('recognizes JPEG and WebP signatures and rejects extension/body disagreement', () => {
  const jpeg = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex');
  expect(validateRasterUpload({ originalname: 'photo.jpeg', mimetype: 'image/jpeg', buffer: jpeg, size: jpeg.length }).extension).toBe('.jpg');
  const webp = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA=', 'base64');
  expect(validateRasterUpload({ originalname: 'photo.webp', mimetype: 'image/webp', buffer: webp, size: webp.length }).mimeType).toBe('image/webp');
  expect(() => validateRasterUpload({ originalname: 'photo.gif', mimetype: 'image/gif', buffer: webp, size: webp.length })).toThrow();
});
it('rejects unsupported metadata fields, invalid URL encodings and nonstring URLs', () => {
  for (const input of [{ id: 'other' }, { url: 42 }, { url: 'not-a-url' }, { url: 'https://cdn.example.test/%GG' }, { url: 'https://cdn.example.test/a b' }]) {
    expect(() => validateMediaMetadata(input)).toThrow();
  }
  expect(() => validateMediaMetadata({ title: 'Safe presentation' })).not.toThrow();
});
