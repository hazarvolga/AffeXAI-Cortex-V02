import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from '../src/core/guards/tenant.guard';
import { TenantService } from '../src/core/tenant/tenant.service';

/**
 * Multi-tenant security tests for TenantGuard.
 *
 * These tests verify the tenant isolation contract:
 * - unauthenticated requests are left to JwtAuthGuard
 * - super_admin/admin bypass
 * - tenant mismatch between request context and user is rejected
 * - users without a tenant context are rejected
 */
describe('TenantGuard (tenant isolation)', () => {
  let guard: TenantGuard;
  let tenantService: { getTenantId: jest.Mock };

  const createContext = (user?: Record<string, any>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    tenantService = { getTenantId: jest.fn() };
    guard = new TenantGuard(
      tenantService as unknown as TenantService,
      null as any, // Reflector is unused by TenantGuard
    );
  });

  it('allows unauthenticated requests (JwtAuthGuard handles authentication)', () => {
    expect(guard.canActivate(createContext(undefined))).toBe(true);
  });

  it('allows super_admin regardless of tenant context', () => {
    tenantService.getTenantId.mockReturnValue('other-tenant');
    const user = { id: 1, tenantId: 'acme', roles: [{ name: 'super_admin' }] };
    expect(guard.canActivate(createContext(user))).toBe(true);
  });

  it('allows admin regardless of tenant context', () => {
    tenantService.getTenantId.mockReturnValue('other-tenant');
    const user = { id: 2, tenantId: 'acme', roles: [{ name: 'admin' }] };
    expect(guard.canActivate(createContext(user))).toBe(true);
  });

  it('allows access when context tenant matches user tenant', () => {
    tenantService.getTenantId.mockReturnValue('acme');
    const user = { id: 3, tenantId: 'acme', roles: [{ name: 'editor' }] };
    expect(guard.canActivate(createContext(user))).toBe(true);
  });

  it('allows access when context tenant is "default" (no explicit tenant)', () => {
    tenantService.getTenantId.mockReturnValue('default');
    const user = { id: 4, tenantId: 'acme', roles: [{ name: 'editor' }] };
    expect(guard.canActivate(createContext(user))).toBe(true);
  });

  it('rejects cross-tenant access (tenant mismatch)', () => {
    tenantService.getTenantId.mockReturnValue('victim-tenant');
    const user = { id: 5, tenantId: 'attacker-tenant', roles: [{ name: 'editor' }] };
    expect(() => guard.canActivate(createContext(user))).toThrow(ForbiddenException);
  });

  it('rejects users without an assigned tenant', () => {
    tenantService.getTenantId.mockReturnValue(undefined);
    const user = { id: 6, tenantId: null, roles: [{ name: 'editor' }] };
    expect(() => guard.canActivate(createContext(user))).toThrow(ForbiddenException);
  });

  it('does not bypass for non-privileged roles', () => {
    tenantService.getTenantId.mockReturnValue('tenant-a');
    const user = { id: 7, tenantId: 'tenant-b', roles: [{ name: 'support_agent' }] };
    expect(() => guard.canActivate(createContext(user))).toThrow(ForbiddenException);
  });
});
