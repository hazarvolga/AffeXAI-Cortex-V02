/**
 * Hooks Module
 * 
 * Barrel export for all custom React hooks.
 */

// API Hooks
export { useApiCall, useMutation } from './useApiCall';
export type { ApiCallState, UseApiCallOptions, UseApiCallResult } from './useApiCall';

// Error Handling Hooks
export {
  useErrorHandler,
  useApiErrorHandler,
  useFormErrorHandler,
  useNetworkErrorHandler,
} from './useErrorHandler';
export type { ErrorHandlerOptions } from './useErrorHandler';

// Loading Hooks
export { useLoading, useAsyncLoading } from './useLoading';
export type { UseLoadingOptions, UseLoadingReturn } from './useLoading';
