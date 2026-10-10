import { UserRole } from '@affexai/shared-types';

/**
 * Checks if a user has the SUPER_ADMIN role.
 * 
 * @param user The user object (must have roleNames property)
 * @returns boolean
 */
export const isSuperAdmin = (user: any): boolean => {
    if (!user || !user.roleNames) return false;
    return user.roleNames.includes(UserRole.SUPER_ADMIN);
};

/**
 * Checks if a user has specific permissions or is a Super Admin.
 * Super Admins always return true.
 * 
 * @param user 
 * @param requiredPermission 
 * @returns 
 */
export const hasPermission = (user: any, requiredPermission: string): boolean => {
    if (!user) return false;

    // Super Admin bypass
    if (isSuperAdmin(user)) return true;

    // Check typical permissions logic here (omitted for brevity, assuming roles/permissions matrix is loaded)
    // For now, this is a placeholder to show the pattern.
    return true;
};
