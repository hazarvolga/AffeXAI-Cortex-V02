/**
 * API Response Utilities
 * 
 * Helper functions for working with standardized API responses.
 * Provides type-safe unwrapping, validation, and error handling.
 */

import type { ApiResponse, ApiError, PaginationMeta, ListResponse } from '@affexai/shared-types';

// ============================================================================
// Response Validation
// ============================================================================

/**
 * Check if response is successful
 */
export function isSuccessResponse<T>(response: any): response is ApiResponse<T> & { data: T } {
  return typeof response === 'object' && response !== null && response.success === true && response.data !== undefined;
}

/**
 * Check if response is an error
 */
export function isErrorResponse<T>(response: any): response is ApiResponse<T> & { error: ApiError } {
  return typeof response === 'object' && response !== null && response.success === false && response.error !== undefined;
}

// ============================================================================
// Response Unwrapping
// ============================================================================

/**
 * Unwrap API response data
 * Throws error if response is unsuccessful
 * 
 * @example
 * ```ts
 * const response = await api.get<ApiResponse<User>>('/users/123');
 * const user = unwrapResponse(response); // User
 * ```
 */
export function unwrapResponse<T>(response: ApiResponse<T> | null | undefined | any): T {
  // Handle null, undefined, or empty responses (204 No Content)
  if (response === null || response === undefined || response === '') {
    return undefined as T;
  }

  // Handle non-object responses
  if (typeof response !== 'object') {
    return undefined as T;
  }

  // Handle arrays directly (some endpoints return arrays without wrapping)
  if (Array.isArray(response)) {
    console.log('[Response Utils] Received array response, returning as-is');
    return response as T;
  }

  if (isSuccessResponse<T>(response)) {
    return response.data as T;
  }

  if (isErrorResponse<T>(response)) {
    throw createErrorFromResponse(response.error);
  }

  // Some controllers return business results directly ({success, message, faq/results}).
  // Only explicit data envelopes and bare acknowledgements represent void results.
  if (response.success === true) {
    if (Object.prototype.hasOwnProperty.call(response, 'data')) return undefined as T;
    const hasBusinessFields = Object.keys(response).some(key => key !== 'success' && key !== 'meta');
    return hasBusinessFields ? response as T : undefined as T;
  }

  // Handle plain objects that might be the actual data (not wrapped in ApiResponse)
  // This happens when backend doesn't use consistent response wrapping
  if (typeof response === 'object' && !('success' in response) && !('error' in response)) {
    console.log('[Response Utils] Received plain object response, returning as-is');
    return response as T;
  }

  // Log the problematic response for debugging
  console.error('Invalid API response format:', response);
  console.error('Response type:', typeof response);
  console.error('Response keys:', Object.keys(response));
  throw new Error('Invalid API response format');
}

/**
 * Unwrap API response data with default value
 * Returns default if response is unsuccessful
 * 
 * @example
 * ```ts
 * const user = unwrapResponseOr(response, null); // User | null
 * ```
 */
export function unwrapResponseOr<T>(response: any, defaultValue: T): T {
  if (isSuccessResponse<T>(response)) {
    return response.data as T;
  }
  return defaultValue;
}

/**
 * Unwrap list response
 * 
 * @example
 * ```ts
 * const response = await api.get<ApiResponse<ListResponse<User>>>('/users');
 * const { items, meta } = unwrapListResponse(response);
 * ```
 */
export function unwrapListResponse<T>(
  response: any
): ListResponse<T> {
  const data = unwrapResponse<ListResponse<T>>(response);

  // Ensure pagination and data aliases exist for frontend compatibility
  const pagination = data.pagination || {
    ...data.meta,
    currentPage: data.meta.page,
    totalCount: data.meta.total,
  };

  return {
    items: data.items,
    data: data.data || data.items,
    meta: data.meta,
    pagination: pagination,
  };
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Create Error instance from ApiError
 */
export function createErrorFromResponse(apiError: ApiError): Error {
  const error = new Error(apiError.message);
  error.name = apiError.code;

  // Attach additional properties
  if (apiError.statusCode) {
    (error as any).statusCode = apiError.statusCode;
  }

  if (apiError.details) {
    (error as any).details = apiError.details;
  }

  return error;
}

/**
 * Extract error message from response
 */
export function getErrorMessage<T>(response: ApiResponse<T>, defaultMessage = 'An error occurred'): string {
  if (isErrorResponse(response)) {
    return response.error.message || defaultMessage;
  }
  return defaultMessage;
}

/**
 * Extract error code from response
 */
export function getErrorCode<T>(response: ApiResponse<T>): string | null {
  if (isErrorResponse(response)) {
    return response.error.code;
  }
  return null;
}

// ============================================================================
// Response Builders (for backend)
// ============================================================================

/**
 * Create successful response
 * 
 * @example
 * ```ts
 * return successResponse(user);
 * return successResponse(users, { pagination: meta });
 * ```
 */
export function successResponse<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Create error response
 * 
 * @example
 * ```ts
 * return errorResponse('USER_NOT_FOUND', 'User not found', 404);
 * ```
 */
export function errorResponse<T = never>(
  code: string,
  message: string,
  statusCode?: number,
  details?: Record<string, any>
): ApiResponse<T> {
  return {
    success: false,
    error: {
      code,
      message,
      statusCode,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Create paginated list response
 * 
 * @example
 * ```ts
 * return paginatedResponse(users, { page: 1, limit: 10, total: 100, totalPages: 10 });
 * ```
 */
export function paginatedResponse<T>(
  items: T[],
  pagination: PaginationMeta
): ApiResponse<ListResponse<T>> {
  return successResponse(
    { items, meta: pagination },
    {
      pagination,
      timestamp: new Date().toISOString()
    }
  );
}

// ============================================================================
// Pagination Helpers
// ============================================================================

/**
 * Calculate pagination metadata
 */
export function calculatePagination(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
  };
}

/**
 * Check if there are more pages
 */
export function hasMorePages(meta: PaginationMeta): boolean {
  return meta.page < meta.totalPages;
}

/**
 * Get next page number
 */
export function getNextPage(meta: PaginationMeta): number | null {
  return hasMorePages(meta) ? meta.page + 1 : null;
}

/**
 * Get previous page number
 */
export function getPrevPage(meta: PaginationMeta): number | null {
  return meta.page > 1 ? meta.page - 1 : null;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if data is a list response
 */
export function isListResponse<T>(data: any): data is ListResponse<T> {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.items) &&
    data.meta &&
    typeof data.meta.page === 'number' &&
    typeof data.meta.limit === 'number' &&
    typeof data.meta.total === 'number' &&
    typeof data.meta.totalPages === 'number'
  );
}

/**
 * Check if response has pagination
 */
export function hasPagination<T>(response: ApiResponse<T>): boolean {
  return !!(response.meta?.pagination);
}

// ============================================================================
// Exports
// ============================================================================

export type { ApiResponse, ApiError, PaginationMeta, ListResponse };
