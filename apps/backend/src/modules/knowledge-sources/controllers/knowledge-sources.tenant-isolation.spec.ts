import { BadRequestException } from '@nestjs/common';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserRole } from '../../users/enums/user-role.enum';
import { KnowledgeSourcesController } from './knowledge-sources.controller';

const user = { id: 'user-1', tenantId: 'tenant-alpha' };

function setup() {
  const service = {
    create: jest.fn().mockResolvedValue({ id: 'source-1' }),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    search: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue({ id: 'source-1' }),
    update: jest.fn().mockResolvedValue({ id: 'source-1' }),
    archive: jest.fn().mockResolvedValue({ id: 'source-1' }),
    delete: jest.fn().mockResolvedValue(undefined),
    updateUsageStats: jest.fn().mockResolvedValue(undefined),
    getStatistics: jest.fn().mockResolvedValue({ total: 0 }),
  };
  return {
    service,
    controller: new KnowledgeSourcesController(service as never, {} as never),
  };
}

describe('KnowledgeSourcesController tenant isolation', () => {
  it('restricts the module to trusted tenant knowledge managers', () => {
    expect(Reflect.getMetadata('__guards__', KnowledgeSourcesController)).toEqual(
      expect.arrayContaining([RolesGuard]),
    );
    expect(Reflect.getMetadata('roles', KnowledgeSourcesController)).toEqual([
      UserRole.ADMIN,
      UserRole.EDITOR,
      UserRole.SUPPORT_MANAGER,
    ]);
  });

  it('passes the authenticated tenant to read, search, mutation and stats services', async () => {
    const { controller, service } = setup();

    await controller.findAll({}, user);
    await controller.search({ query: 'billing' }, user);
    await controller.findOne('source-1', user);
    await controller.update('source-1', { title: 'Updated' }, user);
    await controller.archive('source-1', user);
    await controller.delete('source-1', user);
    await controller.updateUsage('source-1', true, 0.8, user);
    await controller.getStatistics(user);

    expect(service.findAll).toHaveBeenCalledWith(user.tenantId, {});
    expect(service.search).toHaveBeenCalledWith(user.tenantId, { query: 'billing' });
    expect(service.findById).toHaveBeenCalledWith(user.tenantId, 'source-1');
    expect(service.update).toHaveBeenCalledWith(user.tenantId, 'source-1', { title: 'Updated' });
    expect(service.archive).toHaveBeenCalledWith(user.tenantId, 'source-1', user.id);
    expect(service.delete).toHaveBeenCalledWith(user.tenantId, 'source-1');
    expect(service.updateUsageStats).toHaveBeenCalledWith(user.tenantId, 'source-1', true, 0.8);
    expect(service.getStatistics).toHaveBeenCalledWith(user.tenantId);
  });

  it('ignores forged uploader and tenant values during create', async () => {
    const { controller, service } = setup();
    const input = {
      title: 'Policy',
      sourceType: 'text',
      extractedContent: 'content',
      uploadedById: 'attacker',
      tenantId: 'attacker-tenant',
    } as never;

    await controller.create(input, user);

    expect(service.create).toHaveBeenCalledWith(user.tenantId, expect.objectContaining({
      uploadedById: user.id,
    }));
    expect(service.create.mock.calls[0][1]).not.toHaveProperty('tenantId');
  });

  it('rejects a missing tenant before invoking the service', async () => {
    const { controller, service } = setup();

    await expect(controller.findOne('source-1', { id: 'user-1' })).rejects.toBeInstanceOf(BadRequestException);
    expect(service.findById).not.toHaveBeenCalled();
  });
});
