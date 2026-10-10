/**
 * API Module
 * 
 * Barrel export for all API-related exports.
 */

// HTTP Client
export { httpClient, HttpClient, ApiError } from './http-client';
export type { HttpClientConfig } from './http-client';

// Auth Service
export { authService } from './authService';
export type { LoginDto, LoginResponse, CurrentUser } from './authService';

// Base Service
export { BaseApiService } from './base-service';
export type { BaseServiceConfig } from './base-service';

// Response Utilities
export {
  isSuccessResponse,
  isErrorResponse,
  unwrapResponse,
  unwrapResponseOr,
  unwrapListResponse,
  createErrorFromResponse,
  getErrorMessage,
  getErrorCode,
  successResponse,
  errorResponse,
  paginatedResponse,
  calculatePagination,
  hasMorePages,
  getNextPage,
  getPrevPage,
  isListResponse,
  hasPagination,
} from './response-utils';

// Services
export * from './usersService';
export * from './rolesService';
export * from './ticketsService';
export * from './authService';
export { ticketsService } from './ticketsService';
export { mediaService } from './mediaService';
export { settingsService } from './settingsService';
export { emailCampaignsService } from './emailCampaignsService';
export { emailMarketingService } from './emailMarketingService';
export { templatesService } from './templatesService';
export { groupsService } from './groupsService';
export { segmentsService } from './segmentsService';
export { eventsService } from './eventsService';
export { subscribersService } from './subscribersService';
export { certificatesService } from './certificatesService';
export { emailValidationService } from './emailValidationService';
export { ipReputationService } from './ipReputationService';
export { abTestService } from './abTestService';

// Profile Service
export { completeProfile } from './profileService';
export type { CompleteProfileDto, CustomerData, StudentData, NewsletterPreferences } from './profileService';

// Re-export shared types for convenience
export type {
  ApiResponse,
  ApiError as ApiErrorType,
  PaginationMeta,
  ListResponse,
  QueryParams,
  SortOrder,
} from '@affexai/shared-types';
