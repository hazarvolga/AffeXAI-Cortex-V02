import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

const requestContext = () => {
  const request = { headers: { authorization: 'Bearer token' }, tenantHint: undefined } as any;
  return {
    request,
    context: {
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({ getRequest: () => request }),
    } as any,
  };
};

describe('JWT organization lifecycle boundary', () => {
  const previous = process.env.PLATFORM_ADMIN_USER_IDS;

  afterEach(() => {
    if (previous === undefined) delete process.env.PLATFORM_ADMIN_USER_IDS;
    else process.env.PLATFORM_ADMIN_USER_IDS = previous;
  });

  const guardFor = (user: Record<string, unknown>) => {
    delete process.env.PLATFORM_ADMIN_USER_IDS;
    const jwt = { verifyAsync: jest.fn(async () => ({ sub: 'user-a', type: 'access', tokenVersion: 2 })) };
    const users = { findOne: jest.fn(async () => user) };
    const guard = new JwtAuthGuard(jwt as never, { get: () => users } as never, new Reflector());
    guard.onModuleInit();
    return guard;
  };

  it.each([
    { organizationId: null, organization: null },
    { organizationId: 'org-a', organization: null },
    { organizationId: 'org-a', organization: { id: 'org-a', slug: 'a', isActive: false } },
    { organizationId: 'org-a', organization: { id: 'org-a', slug: 'other', isActive: true } },
  ])('rejects an unlinked, missing, inactive, or mismatched organization: %j', async organizationState => {
    const guard = guardFor({
      id: 'user-a', tenantId: 'a', tokenVersion: 2, isActive: true,
      deletedAt: null, roles: [], roleNames: [], ...organizationState,
    });
    const { context } = requestContext();
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts a current user linked to the active canonical organization', async () => {
    const guard = guardFor({
      id: 'user-a', tenantId: 'a', tokenVersion: 2, isActive: true, deletedAt: null,
      organizationId: 'org-a', organization: { id: 'org-a', slug: 'a', isActive: true },
      roles: [], roleNames: [], primaryRole: null,
    });
    const { context, request } = requestContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(expect.objectContaining({ id: 'user-a', tenantId: 'a' }));
  });
});
