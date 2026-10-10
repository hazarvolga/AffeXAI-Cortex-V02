/**
 * User types and DTOs
 * Based on backend User entity
 */

import { BaseEntity } from './common.types';

/**
 * User role enum
 */
export enum UserRole {
  SUPER_ADMIN = 'SuperAdmin',
  ADMIN = 'Admin',
  EDITOR = 'Editor',
  CUSTOMER = 'Customer',
  VIEWER = 'Viewer',
  SUPPORT = 'Support',
}

/**
 * Role entity
 */
export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  isSystem: boolean;
  isCustom?: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
  users?: User[];
  userRoles?: UserRoleAssignment[]; // NEW: Many-to-many relationship
}

/**
 * UserRoleAssignment junction table entity (for multi-role support)
 */
export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  isPrimary: boolean;
  assignedAt: string;
  assignedBy?: string;
  user?: User;
  role?: Role;
}

/**
 * User metadata structure
 */
export interface UserMetadata {
  isCustomer?: boolean;
  isStudent?: boolean;
  isSubscriber?: boolean;
  customerData?: {
    customerNumber?: string;
    companyName?: string;
    taxNumber?: string;
    companyPhone?: string;
    companyAddress?: string;
    companyCity?: string;
  };
  // Flat fields for direct access stability (Frontend Compatibility)
  customerNumber?: string;
  companyName?: string;
  taxNumber?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCity?: string;
  schoolName?: string;
  studentId?: string;
  studentData?: {
    schoolName?: string;
    studentId?: string;
  };
  newsletterPreferences?: {
    email?: boolean;
    productUpdates?: boolean;
    eventUpdates?: boolean;
  };
  notificationPreferences?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  additionalRoles?: string[]; // Multi-role support (e.g., ['customer', 'student', 'subscriber'])
  profileCompleted?: boolean;
  profileCompletedAt?: string;
  [key: string]: any; // Allow additional dynamic properties
}

/**
 * User entity
 * Matches backend User entity structure
 */
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  address?: string;
  city?: string;
  country?: string;
  bio?: string;
  isActive: boolean;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  role?: string; // Legacy field (deprecated)
  roleId?: string; // Legacy field for backward compatibility
  roleEntity?: Role; // DEPRECATED: Single role relationship
  fullName?: string; // Computed: firstName + lastName

  // NEW: Multi-role support
  userRoles?: UserRoleAssignment[];
  primaryRole?: Role; // Computed: Primary role from userRoles
  roles?: Role[]; // Computed: All roles from userRoles
  roleNames?: string[]; // Computed: All role names

  // Customer specific fields
  customerNumber?: string;

  // Student specific fields
  schoolName?: string;
  studentId?: string;

  // Subscriber preferences
  isSubscribedToNewsletter?: boolean;

  // Metadata for flexible data storage
  metadata?: UserMetadata;
}

/**
 * User profile (excludes sensitive data)
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  phone?: string;
  city?: string;
  country?: string;
  address?: string;
  bio?: string;
  role?: string;
  roleId?: string;
  roleEntity?: Role;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  roleNames?: string[];
  primaryRole?: Role;
  roles?: Role[];
  metadata?: UserMetadata;
  emailVerifiedAt?: string;
}

/**
 * Create user DTO
 */
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  address?: string;
  city?: string;
  country?: string;
  bio?: string;
  roleId?: string; // Legacy field for backward compatibility
  primaryRoleId?: string; // NEW: Primary role ID
  additionalRoleIds?: string[]; // NEW: Additional role IDs
  isActive?: boolean;
}

/**
 * Update user DTO
 */
export interface UpdateUserDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  city?: string;
  country?: string;
  bio?: string;
  roleId?: string; // DEPRECATED: Use primaryRoleId instead
  primaryRoleId?: string; // NEW: Primary role ID
  additionalRoleIds?: string[]; // NEW: Additional role IDs
  isActive?: boolean;
  emailVerified?: boolean;
  emailVerifiedAt?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  metadata?: any; // JSONB field for account type metadata
  customerNumber?: string;
  schoolName?: string;
  studentId?: string;
  isSubscribedToNewsletter?: boolean;
}

/**
 * User list query parameters
 */
export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  roleName?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * User statistics response
 */
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  verified: number;
  unverified: number;
  byRole: Array<{
    role: string;
    count: number;
  }>;
}

/**
 * Users list response with pagination
 */
export interface UsersListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Change user role DTO (DEPRECATED - use AssignRolesDto)
 */
export interface ChangeUserRoleDto {
  roleId: string;
}

/**
 * Assign roles DTO (for multi-role assignment)
 */
export interface AssignRolesDto {
  primaryRoleId: string;
  additionalRoleIds?: string[];
  replaceExisting?: boolean;
}

/**
 * Create role DTO
 */
export interface CreateRoleDto {
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  isActive?: boolean;
}

/**
 * Update role DTO
 */
export interface UpdateRoleDto {
  displayName?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

/**
 * Role query parameters
 */
export interface RoleQueryParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}
