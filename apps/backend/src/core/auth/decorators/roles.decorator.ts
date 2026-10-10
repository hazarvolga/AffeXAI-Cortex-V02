import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../modules/users/enums/user-role.enum';

/**
 * Roles Decorator
 * Used to specify required roles for endpoints
 * 
 * @example
 * @Roles(UserRole.ADMIN, UserRole.EDITOR)
 * @Get('admin-only')
 * adminEndpoint() {}
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
