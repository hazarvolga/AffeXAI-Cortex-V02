/**
 * Common utility types used across the application
 */

/**
 * Base entity fields that all entities inherit
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  currentPage?: number; // Alias for page
  limit: number;
  total: number;
  totalCount?: number; // Alias for total
  totalPages: number;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
  };
}

/**
 * Standard API error format
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode?: number;
}

/**
 * Generic list response
 */
export interface ListResponse<T> {
  items: T[];
  data?: T[]; // Alias for items to support different frontend patterns
  meta: PaginationMeta;
  pagination?: PaginationMeta; // Alias for meta to support TanStack Query patterns
}

/**
 * Sort order enum
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Generic query parameters
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
}

/**
 * File upload metadata
 */
export interface FileMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}
