import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PERMISSIONS } from '../../../lib/permissions';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import { WebhooksController } from './webhooks.controller';

describe('WebhooksController security metadata', () => {
  it('requires authentication and settings management permission for every route', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, WebhooksController);
    const permissions = Reflect.getMetadata('permissions', WebhooksController);

    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, PermissionsGuard]));
    expect(permissions).toEqual([PERMISSIONS.SETTINGS_MANAGE]);
  });

  it('redacts secrets from list, read, create, and update responses', async () => {
    const stored = {
      id: 'webhook-1',
      tenantId: 'tenant-a',
      authConfig: { token: 'stored-secret' },
      customHeaders: { 'X-Secret': 'stored-header-secret' },
    } as any;
    const redacted = {
      id: 'webhook-1',
      tenantId: 'tenant-a',
      authConfig: { configured: true },
      customHeaders: { 'X-Secret': '[REDACTED]' },
    };
    const service = {
      findAll: jest.fn().mockResolvedValue([stored]),
      findActive: jest.fn().mockResolvedValue([stored]),
      findOne: jest.fn().mockResolvedValue(stored),
      create: jest.fn().mockResolvedValue(stored),
      update: jest.fn().mockResolvedValue(stored),
      redactForResponse: jest.fn().mockReturnValue(redacted),
    } as any;
    const controller = new WebhooksController(service);
    const user = { tenantId: 'tenant-a' } as any;

    await expect(controller.findAll(user)).resolves.toEqual([redacted]);
    await expect(controller.findActive(user)).resolves.toEqual([redacted]);
    await expect(controller.findOne('webhook-1', user)).resolves.toEqual(redacted);
    await expect(controller.create({} as any, user)).resolves.toEqual(redacted);
    await expect(controller.update('webhook-1', {} as any, user)).resolves.toEqual(redacted);
    expect(service.redactForResponse).toHaveBeenCalledTimes(5);
  });
});
