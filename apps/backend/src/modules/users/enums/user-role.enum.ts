/**
 * User Role Enum
 * Defines different user roles in the system
 * Values match database role.name field (lowercase snake_case)
 */
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  CUSTOMER = 'customer',
  VIEWER = 'viewer',
  SUPPORT = 'support',
  STUDENT = 'student',
  SUBSCRIBER = 'subscriber',
  MARKETING_MANAGER = 'marketing_manager',
  SUPPORT_MANAGER = 'support_manager',
  SUPPORT_AGENT = 'support_agent',
  SUPER_ADMIN = 'super_admin',
}
