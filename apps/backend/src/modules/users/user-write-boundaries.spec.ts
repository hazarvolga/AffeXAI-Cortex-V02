import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { UserRolesService } from './user-roles.service';
import { User } from './entities/user.entity';
import { AuthUtilsService } from '../../core/shared/auth-utils.service';
import { CacheService } from '../../core/shared/services/cache.service';
import { RolesService } from '../roles/roles.service';
import { CrmService } from '../crm/crm.service';
import { UserEmailService } from './services/user-email.service';
import { TenantService } from '../../core/tenant/tenant.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommerceService } from '../commerce/services/commerce.service';

jest.mock('../commerce/services/commerce.service', () => ({
  CommerceService: class {},
}));
jest.mock('../crm/crm.service', () => ({ CrmService: class {} }));
jest.mock('./services/user-email.service', () => ({
  UserEmailService: class {},
}));
jest.mock('../../core/shared/services/cache.service', () => ({
  CacheService: class {},
}));
const platformId = '11111111-1111-4111-8111-111111111111';
function setup() {
  const role = {
    id: 'r',
    tenantId: 'a',
    name: 'viewer',
    permissions: ['cms.read'],
  };
  const user = {
    id: platformId,
    tenantId: 'a',
    email: 'test@example.invalid',
    roleId: 'r',
    isActive: true,
    deletedAt: new Date(),
  };
  const repo = {
    create: jest.fn((x) => ({ ...x, id: 'new' })),
    save: jest.fn(async (x) => x),
    update: jest.fn(),
    findOne: jest.fn(async () => user),
    softDelete: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
    manager: { transaction: jest.fn() },
  };
  const roles = {
    findAll: jest.fn(async () => [role]),
    findByIds: jest.fn(async () => [role]),
  };
  const assignments = { assignRoles: jest.fn(async () => []) };
  const events = { emit: jest.fn() };
  const service = new UsersService(
    repo as unknown as Repository<User>,
    {
      hashPassword: jest.fn(async () => 'hashed'),
    } as unknown as AuthUtilsService,
    { del: jest.fn() } as unknown as CacheService,
    roles as unknown as RolesService,
    assignments as unknown as UserRolesService,
    { isCustomerEmail: jest.fn(async () => false) } as unknown as CrmService,
    {} as UserEmailService,
    { getTenantId: () => 'a' } as TenantService,
    events as unknown as EventEmitter2,
    {
      checkUserLimit: jest.fn(async () => ({ allowed: true })),
    } as unknown as CommerceService,
  );
  jest.spyOn(service, 'findByEmail').mockResolvedValue(null);
  jest.spyOn(service, 'findOne').mockResolvedValue(user as User);
  return { service, repo, roles, role, assignments, events, user };
}
const dto = {
  email: 'new@example.invalid',
  password: 'a-long-password',
  firstName: 'A',
  lastName: 'B',
  roleId: 'r',
};
describe('User creation and protected platform identities', () => {
  const previous = process.env.PLATFORM_ADMIN_USER_IDS;
  beforeEach(() => {
    process.env.PLATFORM_ADMIN_USER_IDS = platformId;
  });
  afterEach(() => {
    if (previous === undefined) delete process.env.PLATFORM_ADMIN_USER_IDS;
    else process.env.PLATFORM_ADMIN_USER_IDS = previous;
    jest.restoreAllMocks();
  });
  it.each(['foreign', 'platform-name', 'platform-permission', 'missing'])(
    'rejects %s legacy role before first user write',
    async (kind) => {
      const { service, repo, role, roles } = setup();
      if (kind === 'foreign') role.tenantId = 'b';
      if (kind === 'platform-name') role.name = 'super_admin';
      if (kind === 'platform-permission') role.permissions = ['system.admin'];
      if (kind === 'missing') roles.findByIds.mockResolvedValue([]);
      await expect(service.create({ ...dto }, 'a')).rejects.toThrow();
      expect(repo.save).not.toHaveBeenCalled();
      expect(repo.manager.transaction).not.toHaveBeenCalled();
    },
  );
  it('validates extra role references even when primary is safe', async () => {
    const { service, repo } = setup();
    await expect(
      service.create(
        { ...dto, primaryRoleId: 'r', additionalRoleIds: ['missing'] },
        'a',
      ),
    ).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });
  it('propagates assignment failure and rolls back user persistence without events', async () => {
    const { service, repo, assignments, events } = setup();
    const failure = new Error('role persistence failed');
    assignments.assignRoles.mockRejectedValue(failure as never);
    jest
      .spyOn(UserRolesService.prototype, 'assignRoles')
      .mockRejectedValue(failure);
    let committed = false;
    repo.manager.transaction.mockImplementation(async (callback) => {
      const result = await callback({ getRepository: () => repo });
      committed = true;
      return result;
    });
    await expect(service.create({ ...dto }, 'a')).rejects.toThrow(
      'role persistence failed',
    );
    expect(repo.manager.transaction).toHaveBeenCalled();
    expect(committed).toBe(false);
    expect(events.emit).not.toHaveBeenCalled();
  });
  it.each([
    'update',
    'remove',
    'hardDelete',
    'restore',
    'toggleActive',
    'changeRole',
  ] as const)(
    'tenant admin cannot %s configured platform account',
    async (method) => {
      const { service, repo } = setup();
      const result =
        method === 'update'
          ? service.update(platformId, { email: 'other@example.invalid' }, 'a')
          : method === 'changeRole'
            ? service.changeRole(platformId, { roleId: 'r' }, 'a')
            : service[method](platformId, 'a');
      await expect(result).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.update).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
      expect(repo.softDelete).not.toHaveBeenCalled();
      expect(repo.remove).not.toHaveBeenCalled();
      expect(repo.restore).not.toHaveBeenCalled();
    },
  );
  it('isGlobal alone does not authorize protected account CRUD', async () => {
    const { service } = setup();
    await expect(
      service.update(platformId, { email: 'other@example.invalid' }, 'a', true),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('retains dedicated internal auth token update path', async () => {
    const { service, repo } = setup();
    await service.updateUser(
      platformId,
      { refreshToken: 'test-token' },
      'a',
      true,
    );
    expect(repo.update).toHaveBeenCalledWith(
      { id: platformId, tenantId: 'a' },
      expect.objectContaining({ refreshToken: 'test-token' }),
    );
  });
  it('internal auth wrapper rejects role-management fields', async () => {
    const { service, repo } = setup();
    await expect(
      service.updateUser(platformId, { roleId: 'r' } as any, 'a', true),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });
  it('commits a validated user and roles atomically', async () => {
    const { service, repo, events } = setup();
    jest.spyOn(UserRolesService.prototype, 'assignRoles').mockResolvedValue([]);
    repo.manager.transaction.mockImplementation(async (callback) =>
      callback({ getRepository: () => repo }),
    );
    const created = await service.create({ ...dto }, 'a');
    expect(created.roleId).toBe('r');
    expect(repo.manager.transaction).toHaveBeenCalledTimes(1);
    expect(events.emit).not.toHaveBeenCalled();
  });
  it('creates an invitation with a hashed purpose token and no administrator-selected password', async () => {
    const { service, repo, events } = setup();
    jest.spyOn(UserRolesService.prototype, 'assignRoles').mockResolvedValue([]);
    repo.manager.transaction.mockImplementation(async callback => callback({ getRepository: () => repo }));
    await service.invite({
      email: 'invited@example.invalid',
      firstName: 'Invited',
      lastName: 'User',
      primaryRoleId: 'r',
    }, 'a');
    expect(repo.update).toHaveBeenCalledWith(
      { id: platformId, tenantId: 'a' },
      expect.objectContaining({
        emailVerificationToken: expect.stringMatching(/^invite_hash_[a-f0-9]{64}$/),
        emailVerificationExpires: expect.any(Date),
      }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      'user.invited',
      expect.objectContaining({
        tenantId: 'a',
        invitationToken: expect.stringMatching(/^invite_[a-f0-9]{64}$/),
      }),
    );
  });
  it('permits verified platform actor management', async () => {
    const { service, repo } = setup();
    await service.remove(platformId, 'a', { isPlatformAdmin: true });
    expect(repo.softDelete).toHaveBeenCalled();
  });
  it('refresh rotation compares token, version, tenant, active state and expiry', async () => {
    const { service, repo } = setup();
    repo.update.mockResolvedValue({ affected: 1 });
    const auth = service as unknown as {
      rotateRefreshToken: (
        id: string,
        tenant: string,
        old: string,
        version: number,
        next: string,
        expires: Date,
      ) => Promise<boolean>;
    };
    const expires = new Date(Date.now() + 10000);
    await expect(
      auth.rotateRefreshToken(platformId, 'a', 'old', 3, 'new', expires),
    ).resolves.toBe(true);
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: platformId,
        tenantId: 'a',
        refreshToken: expect.stringMatching(/^refresh_hash_[a-f0-9]{64}$/),
        tokenVersion: 3,
        isActive: true,
        refreshTokenExpires: expect.objectContaining({ _type: 'moreThan' }),
      }),
      { refreshToken: expect.stringMatching(/^refresh_hash_[a-f0-9]{64}$/), refreshTokenExpires: expires },
    );
    repo.update.mockResolvedValue({ affected: 0 });
    await expect(
      auth.rotateRefreshToken(platformId, 'a', 'old', 3, 'new', expires),
    ).resolves.toBe(false);
  });
  it('password change uses version CAS, invalidates sessions and stores hash once', async () => {
    const { service, repo } = setup();
    repo.update.mockResolvedValue({ affected: 1 });
    const auth = service as unknown as {
      changePasswordCredentials: (
        id: string,
        tenant: string,
        hash: string,
        version: number,
      ) => Promise<boolean>;
    };
    await expect(
      auth.changePasswordCredentials(platformId, 'a', 'already-hashed', 3),
    ).resolves.toBe(true);
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: platformId,
        tenantId: 'a',
        tokenVersion: 3,
        isActive: true,
      }),
      expect.objectContaining({
        password: 'already-hashed',
        tokenVersion: expect.any(Function),
        refreshToken: null,
        refreshTokenExpires: null,
      }),
    );
  });
  it('verification consumes a purpose-specific unexpired token without activating suspended users', async () => {
    const { service, repo } = setup();
    repo.update.mockResolvedValue({ affected: 1 });
    const auth = service as unknown as {
      consumeEmailVerificationToken: (
        id: string,
        tenant: string,
        token: string,
      ) => Promise<boolean>;
    };
    await expect(
      auth.consumeEmailVerificationToken(platformId, 'a', 'verify_test'),
    ).resolves.toBe(true);
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: platformId,
        tenantId: 'a',
        isActive: true,
        emailVerified: false,
        emailVerificationToken: expect.stringMatching(/^verify_hash_[a-f0-9]{64}$/),
        emailVerificationExpires: expect.objectContaining({
          _type: 'moreThan',
        }),
      }),
      expect.objectContaining({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      }),
    );
    expect(repo.update.mock.calls[0][1]).not.toHaveProperty('isActive');
    repo.update.mockClear();
    await expect(
      auth.consumeEmailVerificationToken(platformId, 'a', 'reset_test'),
    ).resolves.toBe(false);
    expect(repo.update).not.toHaveBeenCalled();
  });
  it('password reset atomically consumes a hashed purpose token and revokes all sessions', async () => {
    const { service, repo } = setup();
    repo.update.mockResolvedValue({ affected: 1 });
    const token = `reset_${'b'.repeat(64)}`;
    await expect(
      service.consumePasswordResetToken(platformId, 'a', token, 'already-hashed'),
    ).resolves.toBe(true);
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: platformId,
        tenantId: 'a',
        isActive: true,
        emailVerificationToken: expect.stringMatching(/^reset_hash_[a-f0-9]{64}$/),
        emailVerificationExpires: expect.objectContaining({ _type: 'moreThan' }),
      }),
      expect.objectContaining({
        password: 'already-hashed',
        emailVerified: true,
        tokenVersion: expect.any(Function),
        refreshToken: null,
        refreshTokenExpires: null,
        emailVerificationToken: null,
      }),
    );
  });
  it('logout revokes sessions through tenant and token-version compare-and-swap', async () => {
    const { service, repo } = setup();
    repo.update.mockResolvedValue({ affected: 1 });
    await expect(service.revokeSessions(platformId, 'a', 3)).resolves.toBe(true);
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: platformId, tenantId: 'a', tokenVersion: 3, isActive: true }),
      expect.objectContaining({
        tokenVersion: expect.any(Function),
        refreshToken: null,
        refreshTokenExpires: null,
      }),
    );
  });
  it('invitation acceptance requires the hashed invite purpose and revokes sessions', async () => {
    const { service, repo } = setup();
    repo.update.mockResolvedValue({ affected: 1 });
    const token = `invite_${'c'.repeat(64)}`;
    await expect(service.consumeInvitationToken(platformId, 'a', token, 'already-hashed')).resolves.toBe(true);
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'a',
        emailVerified: false,
        emailVerificationToken: expect.stringMatching(/^invite_hash_[a-f0-9]{64}$/),
      }),
      expect.objectContaining({
        password: 'already-hashed',
        emailVerified: true,
        tokenVersion: expect.any(Function),
        refreshToken: null,
      }),
    );
  });
  it('role-only update leaves DTO immutable and never issues an empty profile update', async () => {
    const { service, repo } = setup();
    const input = { primaryRoleId: 'r' };
    await service.update('ordinary', input, 'a');
    expect(input).toEqual({ primaryRoleId: 'r' });
    expect(repo.update).not.toHaveBeenCalled();
  });
  it('generic profile update cannot write a password field', async () => {
    const { service, repo } = setup();
    await service.update('ordinary', { password: 'new-password' } as any, 'a');
    expect(repo.update).not.toHaveBeenCalled();
  });
  it('rejects account lifecycle changes through the generic profile update', async () => {
    const { service, repo } = setup();
    await expect(service.update('ordinary', { isActive: false } as any, 'a'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });
  it('soft delete revokes access and refresh credentials before deletion', async () => {
    const { service, repo } = setup();
    await service.remove(platformId, 'a', { isPlatformAdmin: true });
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: platformId, tenantId: 'a' }),
      expect.objectContaining({
        tokenVersion: expect.any(Function),
        refreshToken: null,
        refreshTokenExpires: null,
      }),
    );
    expect(repo.update.mock.invocationCallOrder[0]).toBeLessThan(
      repo.softDelete.mock.invocationCallOrder[0],
    );
  });
  it.each(['deactivateUser', 'toggleActive'] as const)(
    '%s revokes every existing session when it disables an account',
    async method => {
      const { service, repo, user } = setup();
      user.deletedAt = null;
      await service[method](platformId, 'a', { isPlatformAdmin: true });
      expect(repo.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: platformId, tenantId: 'a' }),
        expect.objectContaining({
          isActive: false,
          tokenVersion: expect.any(Function),
          refreshToken: null,
          refreshTokenExpires: null,
        }),
      );
    },
  );
  it('cannot disable the last active organization administrator', async () => {
    const { service, repo, user } = setup();
    Object.assign(user, { organizationId: 'org-a', isActive: true, deletedAt: null });
    const query = jest.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ is_admin: true, admin_count: 1 }]);
    repo.manager.transaction.mockImplementation(async callback => callback({
      query,
      withRepository: () => repo,
    }));
    await expect(service.deactivateUser(platformId, 'a', { isPlatformAdmin: true }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
