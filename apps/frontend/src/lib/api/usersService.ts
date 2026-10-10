import { BaseApiService } from './base-service';
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  UserQueryParams,
  UserStats,
  UsersListResponse,
  ChangeUserRoleDto
} from '@affexai/shared-types';

// Re-export types for backward compatibility
export type { User, CreateUserDto, UpdateUserDto, UserQueryParams, UserStats, UsersListResponse, ChangeUserRoleDto };

export interface UserActivity {
  id: string;
  type: 'ticket' | 'login' | 'profile' | 'system';
  title: string;
  description: string;
  timestamp: string; // ISO date string
  metadata?: any;
}

/**
 * Users Service
 * Handles all user-related API operations with type safety
 * Extends BaseApiService for standard CRUD operations
 */
class UsersService extends BaseApiService<User, CreateUserDto, UpdateUserDto> {
  constructor() {
    super({
      endpoint: '/users',
      useWrappedResponses: true // Backend uses global ApiResponse wrapper
    });
  }

  // BaseApiService already provides:
  // - getAll(params?: QueryParams): Promise<User[]>
  // - getList(params?: QueryParams): Promise<{ items: User[]; meta: PaginationMeta }>
  // - getById(id: string): Promise<User>
  // - create(data: CreateUserDto): Promise<User>
  // - update(id: string, data: UpdateUserDto): Promise<User>
  // - delete(id: string): Promise<void>

  /**
   * Get users list with filters and pagination
   * Returns backend format: { data, total, page, limit }
   */
  async getUsersList(params?: UserQueryParams): Promise<UsersListResponse> {
    const response = await this.client.getWrapped<UsersListResponse>(this.endpoint, { params });
    return response;
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<UserStats> {
    return this.client.getWrapped<UserStats>(`${this.endpoint}/stats`);
  }

  /**
   * Get current user profile (self-service)
   * Uses /users/me endpoint which doesn't require admin permissions
   */
  async getCurrentUser(): Promise<User> {
    return this.client.getWrapped<User>(`${this.endpoint}/me`);
  }

  /**
   * Get recent user activity (tickets, login, etc.)
   */
  async getRecentActivity(): Promise<UserActivity[]> {
    return this.client.getWrapped<UserActivity[]>(`${this.endpoint}/activity`);
  }

  /**
   * Get user by ID with role relation
   */
  async getUserById(id: string): Promise<User> {
    return this.client.getWrapped<User>(`${this.endpoint}/${id}`);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User> {
    return this.client.getWrapped<User>(`${this.endpoint}/email/${email}`);
  }

  /**
   * Search users
   */
  async searchUsers(query: string, params?: Omit<UserQueryParams, 'search'>): Promise<UsersListResponse> {
    return this.getUsersList({ ...params, search: query });
  }

  /**
   * Change user role
   */
  async changeUserRole(userId: string, roleId: string): Promise<User> {
    return this.client.patchWrapped<User>(`${this.endpoint}/${userId}/role`, { roleId });
  }

  /**
   * Toggle user active status
   */
  async toggleUserActive(userId: string): Promise<User> {
    return this.client.patchWrapped<User>(`${this.endpoint}/${userId}/toggle-active`, {});
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: UpdateUserDto): Promise<User> {
    return this.client.patchWrapped<User>(`${this.endpoint}/${userId}`, data);
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    return this.client.deleteWrapped(`${this.endpoint}/${userId}`);
  }

  /**
   * Permanently delete user (hard delete)
   * WARNING: This action cannot be undone!
   */
  async hardDeleteUser(userId: string): Promise<void> {
    return this.client.deleteWrapped(`${this.endpoint}/${userId}/permanent`);
  }

  /**
   * Restore soft-deleted user
   */
  async restoreUser(userId: string): Promise<User> {
    return this.client.postWrapped<User>(`${this.endpoint}/${userId}/restore`, {});
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserDto): Promise<User> {
    return this.client.postWrapped<User>(this.endpoint, data);
  }
}

export const usersService = new UsersService();
export default usersService;