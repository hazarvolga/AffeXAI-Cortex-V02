import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isPlatformRoleName } from '../../../modules/roles/tenant-role-policy';

/**
 * Roles Guard
 * Checks if user has required roles (supports multi-role)
 * User roles are already attached to request by JwtAuthGuard
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // This flag is derived only from verified identity and server provisioning config.
    if (user.isPlatformAdmin === true) return true;
    const assignedRoleNames: string[] = (user.roleNames || [])
      .filter((name: string) => !isPlatformRoleName(name))
      .map((name: string) => name.trim().toLowerCase());
    const effectiveRoleNames = new Set(assignedRoleNames);
    if (assignedRoleNames.some(name => ['admin', 'organization_owner', 'organization_admin'].includes(name))) {
      effectiveRoleNames.add('admin');
      effectiveRoleNames.add('viewer');
    }
    const userRoleNames = [...effectiveRoleNames];

    // Check if user has ANY of the required roles (multi-role support)
    const hasRole = requiredRoles.some((requiredRole) =>
      userRoleNames.some(
        (userRole: string) => userRole.toLowerCase() === requiredRole.toLowerCase()
      )
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. User roles: ${userRoleNames.join(', ')}`
      );
    }

    console.log('✅ RolesGuard: Access granted for user with roles:', userRoleNames);
    return true;
  }
}
