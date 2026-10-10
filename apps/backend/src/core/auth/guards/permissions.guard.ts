import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Permissions Guard
 * Checks if user has required permissions (granular permission control)
 * User roles and permissions are already attached to request by JwtAuthGuard
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @RequirePermissions('users.view', 'users.create')
 * async getUsers() {}
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Set by authentication from server-controlled platform provisioning only.
    if (user.isPlatformAdmin === true) return true;

    // Collect all permissions from all user roles
    const userPermissions = new Set<string>();

    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach(role => {
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach(permission => {
            if (typeof permission === 'string' && permission.trim().toLowerCase() !== 'system.admin') {
              userPermissions.add(permission);
            }
          });
        }
      });
    }

    if (userPermissions.size === 0) {
      throw new ForbiddenException('User has no permissions assigned');
    }

    // Check if user has ALL required permissions (AND logic)
    const missingPermissions = requiredPermissions.filter(
      permission => !userPermissions.has(permission)
    );

    if (missingPermissions.length > 0) {
      console.log('❌ PermissionsGuard: Access denied', {
        userId: user.id,
        reason: 'missing_permissions',
        missingCount: missingPermissions.length,
      });

      throw new ForbiddenException(
        `Access denied. Missing permissions: ${missingPermissions.join(', ')}`
      );
    }

    console.log('✅ PermissionsGuard: Access granted', {
      userId: user.id,
      decision: 'granted',
    });

    return true;
  }
}

/**
 * Permissions Guard (OR Logic)
 * Checks if user has ANY of the required permissions
 * Useful when multiple permissions can grant access
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, PermissionsGuardOr)
 * @RequirePermissions('users.view', 'users.create')
 * async getUsers() {}
 */
@Injectable()
export class PermissionsGuardOr implements CanActivate {
  constructor(private reflector: Reflector) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Set by authentication from server-controlled platform provisioning only.
    if (user.isPlatformAdmin === true) return true;

    // Collect all permissions from all user roles
    const userPermissions = new Set<string>();

    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach(role => {
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach(permission => {
            if (typeof permission === 'string' && permission.trim().toLowerCase() !== 'system.admin') {
              userPermissions.add(permission);
            }
          });
        }
      });
    }

    if (userPermissions.size === 0) {
      throw new ForbiddenException('User has no permissions assigned');
    }

    // Check if user has ANY of the required permissions (OR logic)
    const hasAnyPermission = requiredPermissions.some(
      permission => userPermissions.has(permission)
    );

    if (!hasAnyPermission) {
      console.log('❌ PermissionsGuardOr: Access denied', {
        userId: user.id,
        reason: 'no_required_permission',
      });

      throw new ForbiddenException(
        `Access denied. Required one of: ${requiredPermissions.join(', ')}`
      );
    }

    console.log('✅ PermissionsGuardOr: Access granted', {
      userId: user.id,
      decision: 'granted',
    });

    return true;
  }
}
