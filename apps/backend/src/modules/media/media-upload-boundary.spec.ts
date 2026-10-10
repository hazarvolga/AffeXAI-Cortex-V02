jest.mock('@nestjs/mapped-types', () => ({ PartialType: require('@nestjs/swagger').PartialType }));
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { S3Service } from './s3.service';
import { ConfigService } from '@nestjs/config';
import { MediaModule } from '@affexai/shared-types';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jVxkAAAAASUVORK5CYII=', 'base64');
describe('public media upload security boundary', () => {
  const media = { create: jest.fn(), createFromUpload: jest.fn(), update: jest.fn() };
  const storage = { uploadFile: jest.fn() };
  const controller = new MediaController(media as unknown as MediaService, storage as unknown as S3Service, {} as ConfigService);
  beforeEach(() => { jest.resetAllMocks(); storage.uploadFile.mockResolvedValue('https://assets.example.test/tenant-a/file.png'); media.createFromUpload.mockImplementation(async value => value); });
  const file = (originalname = 'image.png', mimetype = 'image/png', buffer = png) => ({ originalname, mimetype, buffer, size: buffer.length });
  it.each([
    file('image.svg', 'image/svg+xml', Buffer.from('<svg onload="alert(1)"/>')),
    file('image.png', 'image/png', Buffer.from('<html><script>alert(1)</script></html>')),
    file('image.jpg', 'image/jpeg', png),
    file('image.png', 'text/html', png),
    file('image.png', 'image/png', Buffer.alloc(0)),
  ])('rejects untrusted bytes/mime/extension before any public write', async input => {
    await expect(controller.uploadFile(input, { tenantId: 'tenant-a' })).rejects.toThrow();
    expect(storage.uploadFile).not.toHaveBeenCalled(); expect(media.create).not.toHaveBeenCalled();
  });
  it('uploads valid bytes with trusted scope and measured size', async () => {
    const result = await controller.uploadFile({ ...file(), size: 99999 }, { tenantId: 'tenant-a' });
    expect(result.size).toBe(png.length);
    expect(storage.uploadFile).toHaveBeenCalledWith(expect.stringMatching(/\.png$/), png, 'image/png', 'tenant-a', expect.anything());
  });
  it('rejects missing tenant and invalid path category', async () => {
    await expect(controller.uploadFile(file(), {})).rejects.toThrow();
    await expect(controller.uploadFile(file(), { tenantId: 'tenant-a' }, '../other' as MediaModule)).rejects.toThrow();
    expect(storage.uploadFile).not.toHaveBeenCalled();
  });
  it.each(['javascript:alert(1)', 'data:text/html,hi', 'file:///etc/passwd', 'https://user:pass@example.test/file.png'])('rejects active or credential-bearing metadata URL %s', async url => {
    await expect(Promise.resolve().then(() => controller.create({ filename: 'x.png', originalName: 'x.png', mimeType: 'image/png', size: 1, url }))).rejects.toThrow();
    expect(media.create).not.toHaveBeenCalled();
  });
});
