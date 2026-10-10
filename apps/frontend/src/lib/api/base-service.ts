/**
 * Base API Service
 * 
 * Abstract base class for all API services.
 * Provides common CRUD operations with standardized response handling.
 */

import { httpClient } from './http-client';
import type { ApiResponse, ListResponse, PaginationMeta, QueryParams } from '@affexai/shared-types';
import { unwrapResponse, unwrapListResponse } from './response-utils';

// ============================================================================
// Base Service Configuration
// ============================================================================

export interface BaseServiceConfig {
  /** Base endpoint path (e.g., '/users', '/posts') */
  endpoint: string;
  /** Whether to use wrapped responses (ApiResponse<T>) */
  useWrappedResponses?: boolean;
}

// ============================================================================
// Base Service Class
// ============================================================================

/**
 * Base API Service
 * 
 * Provides standard CRUD operations for API resources.
 * Override methods to customize behavior.
 * 
 * @example
 * ```ts
 * class UserService extends BaseApiService<User, CreateUserDto, UpdateUserDto> {
 *   constructor() {
 *     super({ endpoint: '/users', useWrappedResponses: true });
 *   }
 * 
 *   // Add custom methods
 *   async getUserByEmail(email: string): Promise<User> {
 *     return this.get<User>(`${this.endpoint}/email/${email}`);
 *   }
 * }
 * ```
 */
export abstract class BaseApiService<TEntity, TCreateDto = Partial<TEntity>, TUpdateDto = Partial<TEntity>> {
  protected endpoint: string;
  protected useWrappedResponses: boolean;

  constructor(config: BaseServiceConfig) {
    this.endpoint = config.endpoint;
    this.useWrappedResponses = config.useWrappedResponses ?? false;
  }

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  /**
   * Get all entities
   */
  async getAll(params?: QueryParams): Promise<TEntity[]> {
    const queryString = this.buildQueryString(params);
    const url = `${this.endpoint}${queryString}`;

    if (this.useWrappedResponses) {
      return httpClient.getWrapped<TEntity[]>(url);
    }
    return httpClient.get<TEntity[]>(url);
  }

  /**
   * Get paginated list of entities
   */
  async getList(params?: QueryParams): Promise<{ items: TEntity[]; meta: PaginationMeta }> {
    const queryString = this.buildQueryString(params);
    const url = `${this.endpoint}${queryString}`;

    if (this.useWrappedResponses) {
      const response = await httpClient.get<ApiResponse<ListResponse<TEntity>>>(url);
      return unwrapListResponse(response);
    }

    const response = await httpClient.get<ListResponse<TEntity>>(url);
    return { items: response.items, meta: response.meta };
  }

  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<TEntity> {
    const url = `${this.endpoint}/${id}`;

    if (this.useWrappedResponses) {
      return httpClient.getWrapped<TEntity>(url);
    }
    return httpClient.get<TEntity>(url);
  }

  /**
   * Create new entity
   */
  async create(data: TCreateDto): Promise<TEntity> {
    if (this.useWrappedResponses) {
      return httpClient.postWrapped<TEntity, TCreateDto>(this.endpoint, data);
    }
    return httpClient.post<TEntity, TCreateDto>(this.endpoint, data);
  }

  /**
   * Update existing entity
   */
  async update(id: string, data: TUpdateDto): Promise<TEntity> {
    const url = `${this.endpoint}/${id}`;

    if (this.useWrappedResponses) {
      return httpClient.patchWrapped<TEntity, TUpdateDto>(url, data);
    }
    return httpClient.patch<TEntity, TUpdateDto>(url, data);
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<void> {
    const url = `${this.endpoint}/${id}`;
    
    // DELETE operations typically return void/empty response
    // So we don't use wrapped responses even if configured
    return httpClient.delete<void>(url);
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Build query string from params
   */
  protected buildQueryString(params?: QueryParams): string {
    if (!params) return '';

    const searchParams = new URLSearchParams();

    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Get base HTTP client for custom requests
   */
  protected get client() {
    return httpClient;
  }
}

// ============================================================================
// Exports
// ============================================================================

export default BaseApiService;
