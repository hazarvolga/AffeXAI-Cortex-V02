/**
 * Query Module
 * 
 * TanStack Query (React Query) integration with enhanced hooks,
 * cache management, and optimistic updates.
 */

// Query Client & Configuration
export { queryClient, queryKeys, cacheUtils } from './query-client';

// Provider
export { QueryProvider } from './QueryProvider';

// Prefetch & SSR Utilities
export {
  createSSRQueryClient,
  prefetchPageData,
  prefetchPatterns,
  prefetchOnHover,
  prefetchNextPage,
  warmupCache,
} from './prefetch-utils';

// Hooks
export { useApiQuery, useApiMutation, useOptimisticUpdate } from './hooks';
export type { UseApiQueryOptions, UseApiMutationOptions } from './hooks';

// Infinite Query
export { useInfiniteApiQuery, useFlatInfiniteQuery } from './infinite-query';
export type { UseInfiniteApiQueryOptions } from './infinite-query';

// Re-export useful TanStack Query utilities
export {
  useQueryClient,
  useIsFetching,
  useIsMutating,
  useMutationState,
} from '@tanstack/react-query';
