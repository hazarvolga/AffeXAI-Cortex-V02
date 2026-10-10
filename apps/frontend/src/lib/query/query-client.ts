import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { errorLogger } from '@/lib/errors';
import { ErrorSeverity } from '@/lib/errors';
import { ApiError } from '@/lib/api/http-client';

/**
 * Default Query Options
 * 
 * Configures default behavior for all queries and mutations
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Stale time: How long data is considered fresh (5 minutes)
    staleTime: 5 * 60 * 1000,

    // Cache time: How long unused data stays in cache (10 minutes)
    gcTime: 10 * 60 * 1000,

    // Retry failed requests 3 times with exponential backoff
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof ApiError) {
        const status = error.statusCode;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus (only for critical data, can be overridden per query)
    refetchOnWindowFocus: 'always',

    // Refetch on reconnect
    refetchOnReconnect: 'always',

    // Smart refetch on mount - only if stale
    refetchOnMount: 'always',

    // Enable stale-while-revalidate pattern
    // Data is returned from cache immediately, then refetched in background
    refetchInterval: false,

    // Network mode - fail fast on offline
    networkMode: 'online',
  },
  mutations: {
    // Retry mutations once
    retry: 1,

    // Global error handler for mutations
    onError: (error) => {
      if (error instanceof Error) {
        errorLogger.log(error, ErrorSeverity.HIGH, {
          action: 'Mutation Error',
          metadata: { type: 'mutation' },
        });
      }
    },
  },
};

/**
 * Create Query Client
 * 
 * Creates a configured TanStack Query client instance
 */
export const queryClient = new QueryClient({
  defaultOptions,
});

/**
 * Query Keys Factory
 * 
 * Centralized query key management to ensure consistency
 * and enable easy cache invalidation.
 * 
 * @example
 * ```ts
 * // Get all users
 * const key = queryKeys.users.all;
 * 
 * // Get user by ID
 * const key = queryKeys.users.detail(123);
 * 
 * // Get users list with filters
 * const key = queryKeys.users.list({ role: 'admin' });
 * ```
 */
export const queryKeys = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.users.details(), id] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.products.details(), id] as const,
    categories: () => [...queryKeys.products.all, 'categories'] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.orders.details(), id] as const,
  },

  // CMS
  cms: {
    all: ['cms'] as const,
    pages: {
      all: ['cms', 'pages'] as const,
      lists: () => [...queryKeys.cms.pages.all, 'list'] as const,
      list: (filters?: Record<string, any>) =>
        [...queryKeys.cms.pages.lists(), filters] as const,
      details: () => [...queryKeys.cms.pages.all, 'detail'] as const,
      detail: (id: string | number) =>
        [...queryKeys.cms.pages.details(), id] as const,
    },
    components: {
      all: ['cms', 'components'] as const,
      lists: () => [...queryKeys.cms.components.all, 'list'] as const,
      list: (filters?: Record<string, any>) =>
        [...queryKeys.cms.components.lists(), filters] as const,
    },
  },

  // Media
  media: {
    all: ['media'] as const,
    lists: () => [...queryKeys.media.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.media.lists(), filters] as const,
    details: () => [...queryKeys.media.all, 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.media.details(), id] as const,
  },
} as const;

/**
 * Cache Utilities
 * 
 * Helper functions for common cache operations
 */
export const cacheUtils = {
  /**
   * Invalidate all queries for a specific resource
   * 
   * @example
   * ```ts
   * // Invalidate all user queries
   * await cacheUtils.invalidateResource('users');
   * ```
   */
  invalidateResource: async (resource: keyof typeof queryKeys) => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys[resource].all
    });
  },

  /**
   * Invalidate a specific detail query
   * 
   * @example
   * ```ts
   * // Invalidate user detail
   * await cacheUtils.invalidateDetail('users', 123);
   * ```
   */
  invalidateDetail: async (
    resource: 'users' | 'products' | 'orders' | 'media',
    id: string | number
  ) => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys[resource].detail(id)
    });
  },

  /**
   * Invalidate all list queries for a resource
   * 
   * @example
   * ```ts
   * // Invalidate all user lists
   * await cacheUtils.invalidateLists('users');
   * ```
   */
  invalidateLists: async (
    resource: 'users' | 'products' | 'orders' | 'media'
  ) => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys[resource].lists()
    });
  },

  /**
   * Set data in cache manually
   * 
   * @example
   * ```ts
   * // Set user data in cache
   * cacheUtils.setData(['users', 'detail', 123], userData);
   * ```
   */
  setData: <TData = unknown>(
    queryKey: readonly unknown[],
    data: TData | ((old: TData | undefined) => TData)
  ) => {
    queryClient.setQueryData(queryKey, data);
  },

  /**
   * Get data from cache
   * 
   * @example
   * ```ts
   * // Get user data from cache
   * const user = cacheUtils.getData(['users', 'detail', 123]);
   * ```
   */
  getData: <TData = unknown>(queryKey: readonly unknown[]): TData | undefined => {
    return queryClient.getQueryData(queryKey);
  },

  /**
   * Remove specific query from cache
   * 
   * @example
   * ```ts
   * // Remove user detail from cache
   * cacheUtils.removeQuery(['users', 'detail', 123]);
   * ```
   */
  removeQuery: (queryKey: readonly unknown[]) => {
    queryClient.removeQueries({ queryKey });
  },

  /**
   * Clear all cache
   * 
   * @example
   * ```ts
   * // Clear everything (e.g., on logout)
   * cacheUtils.clearAll();
   * ```
   */
  clearAll: () => {
    queryClient.clear();
  },

  /**
   * Prefetch data for faster navigation
   * 
   * @example
   * ```ts
   * // Prefetch user detail
   * await cacheUtils.prefetch(
   *   queryKeys.users.detail(123),
   *   () => usersService.getById(123)
   * );
   * ```
   */
  prefetch: async <TData = unknown>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<TData>,
    options?: { staleTime?: number }
  ) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: options?.staleTime,
    });
  },

  /**
   * Prefetch multiple queries in parallel
   * Useful for optimizing navigation to pages with multiple data requirements
   * 
   * @example
   * ```ts
   * // Prefetch dashboard data
   * await cacheUtils.prefetchMultiple([
   *   { queryKey: queryKeys.users.list(), queryFn: () => usersService.getAll() },
   *   { queryKey: queryKeys.orders.list(), queryFn: () => ordersService.getAll() },
   * ]);
   * ```
   */
  prefetchMultiple: async <TData = unknown>(
    queries: Array<{
      queryKey: readonly unknown[];
      queryFn: () => Promise<TData>;
      staleTime?: number;
    }>
  ) => {
    await Promise.all(
      queries.map(({ queryKey, queryFn, staleTime }) =>
        queryClient.prefetchQuery({ queryKey, queryFn, staleTime })
      )
    );
  },

  /**
   * Optimistically update cache before mutation completes
   * Implements optimistic updates pattern for better UX
   * 
   * @example
   * ```ts
   * // Optimistically update user
   * await cacheUtils.optimisticUpdate(
   *   queryKeys.users.detail(123),
   *   (old) => ({ ...old, name: 'New Name' }),
   *   async () => usersService.update(123, { name: 'New Name' })
   * );
   * ```
   */
  optimisticUpdate: async <TData = unknown>(
    queryKey: readonly unknown[],
    updater: (old: TData | undefined) => TData,
    mutationFn: () => Promise<TData>
  ) => {
    // Snapshot the previous value
    const previousData = queryClient.getQueryData<TData>(queryKey);

    // Optimistically update to the new value
    queryClient.setQueryData(queryKey, updater);

    try {
      // Perform the mutation
      const result = await mutationFn();

      // Update with the real result
      queryClient.setQueryData(queryKey, result);

      return result;
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(queryKey, previousData);
      throw error;
    }
  },

  /**
   * Set cache time (gcTime) for specific queries
   * Useful for controlling memory usage
   * 
   * @example
   * ```ts
   * // Keep user data in cache for 1 hour
   * cacheUtils.setCacheTime(['users', 'detail', 123], 60 * 60 * 1000);
   * ```
   */
  setCacheTime: (queryKey: readonly unknown[], gcTime: number) => {
    queryClient.setQueryDefaults(queryKey, { gcTime });
  },

  /**
   * Set stale time for specific queries
   * Controls when data is considered outdated
   * 
   * @example
   * ```ts
   * // User data stays fresh for 10 minutes
   * cacheUtils.setStaleTime(['users', 'detail', 123], 10 * 60 * 1000);
   * ```
   */
  setStaleTime: (queryKey: readonly unknown[], staleTime: number) => {
    queryClient.setQueryDefaults(queryKey, { staleTime });
  },
};
