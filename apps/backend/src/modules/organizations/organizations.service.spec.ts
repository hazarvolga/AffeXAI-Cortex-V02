import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Organization } from './entities/organization.entity';
import { OrganizationAuditLog } from './entities/organization-audit-log.entity';
import { OrganizationsService } from './organizations.service';
import { User } from '../users/entities/user.entity';

describe('OrganizationsService lifecycle contract', () => {
  const organization = {
    id: '11111111-1111-4111-8111-111111111111', name: 'XYZ Company', slug: 'xyz-company', isActive: true, settings: {},
  } as Organization;
  const actorId = '22222222-2222-4222-8222-222222222222';
  const userId = '33333333-3333-4333-8333-333333333333';

  function setup(options: { tenantContext?: object; roleState?: object } = {}) {
    const auditSave = jest.fn().mockResolvedValue(undefined);
    const organizationSave = jest.fn().mockImplementation(async value => ({ id: organization.id, ...value }));
    const organizationTxRepo = {
      findOne: jest.fn().mockResolvedValue(null), create: jest.fn().mockImplementation(value => value),
      save: organizationSave, update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const execute = jest.fn().mockResolvedValue({ affected: 1 });
    const queryBuilder: any = {
      update: jest.fn().mockReturnThis(), set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(), execute,
    };
    const userTxRepo = {
      findOne: jest.fn().mockResolvedValue({ id: userId, tenantId: organization.slug, organizationId: organization.id, isActive: true }),
      update: jest.fn().mockResolvedValue({ affected: 1 }), createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === Organization) return organizationTxRepo;
        if (entity === User) return userTxRepo;
        if (entity === OrganizationAuditLog) return { save: auditSave };
        throw new Error('Unexpected repository');
      }),
      query: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('FROM organizations')) return [{ id: organization.id }];
        if (sql.includes('SELECT id,"organizationId"')) return [{ id: userId, organizationId: organization.id, isActive: true }];
        return [options.roleState ?? { is_admin: false, admin_count: 1 }];
      }),
    };
    const organizations: any = {
      manager: { transaction: jest.fn((callback: any) => callback(manager)) },
      findOne: jest.fn().mockResolvedValue(organization),
    };
    const users: any = { find: jest.fn().mockResolvedValue([]) };
    const tenants: any = {
      getTenantContext: jest.fn().mockReturnValue(options.tenantContext ?? { tenantId: organization.slug, source: 'authenticated' }),
    };
    return {
      service: new OrganizationsService(organizations, users, tenants), organizations, organizationTxRepo,
      userTxRepo, auditSave, execute,
    };
  }

  it('requires an authenticated tenant context', async () => {
    const { service } = setup({ tenantContext: { tenantId: 'xyz-company', source: 'public' } });
    await expect(service.getCurrent()).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('normalizes the slug and records organization creation atomically', async () => {
    const { service, organizations, organizationTxRepo, auditSave } = setup();
    const result = await service.createOrganization({ name: ' XYZ Company ', slug: 'XYZ-Company' }, actorId);
    expect(organizations.manager.transaction).toHaveBeenCalledTimes(1);
    expect(organizationTxRepo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'XYZ Company', slug: 'xyz-company', isActive: true }));
    expect(auditSave).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'xyz-company', organizationId: organization.id, actorId, action: 'organization.created',
    }));
    expect(result.slug).toBe('xyz-company');
  });

  it('rejects removal of the last active organization administrator before mutation', async () => {
    const { service, execute, auditSave } = setup({ roleState: { is_admin: true, admin_count: 1 } });
    await expect(service.removeMember(userId, actorId)).rejects.toBeInstanceOf(BadRequestException);
    expect(execute).not.toHaveBeenCalled();
    expect(auditSave).not.toHaveBeenCalled();
  });

  it('revokes the member session and records removal in the same transaction', async () => {
    const { service, execute, auditSave } = setup({ roleState: { is_admin: false, admin_count: 1 } });
    await service.removeMember(userId, actorId);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(auditSave).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: organization.slug, organizationId: organization.id, targetUserId: userId, actorId,
      action: 'organization.member_removed',
    }));
  });

  it('revokes linked sessions when the platform deactivates an organization', async () => {
    const { service, organizationTxRepo, userTxRepo, auditSave } = setup();
    organizationTxRepo.findOne.mockResolvedValue(organization);
    const result = await service.setStatus(organization.id, false, actorId);
    expect(userTxRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(organizationTxRepo.update).toHaveBeenCalledWith({ id: organization.id }, { isActive: false });
    expect(auditSave).toHaveBeenCalledWith(expect.objectContaining({ action: 'organization.deactivated', metadata: { previousStatus: true } }));
    expect(result.isActive).toBe(false);
  });
});
