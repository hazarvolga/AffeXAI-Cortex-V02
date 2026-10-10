import { QueryClient, dehydrate, DehydratedState } from '@tanstack/react-query';
import { queryClient, queryKeys } from './query-client';

/**
 * Prefetch Utilities for SSR/SSG
 * 
 * Helper functions to prefetch data during server-side rendering
 * or static site generation for optimal performance.
 */

/**
 * Create a new query client for SSR
 * Each request should have its own query client to avoid data leaking
 * between requests
 */
export function createSSRQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't refetch on mount during SSR
        refetchOnMount: false,
        // Don't refetch on window focus during SSR
        refetchOnWindowFocus: false,
        // Longer stale time for SSR (data is already fresh from server)
        staleTime: 60 * 1000, // 1 minute
      },
    },
  });
}

/**
 * Prefetch and dehydrate critical page data
 * Use in getServerSideProps or similar SSR functions
 * 
 * @example
 * ```ts
 * // In a Next.js page
 * export async function getServerSideProps() {
 *   const dehydratedState = await prefetchPageData(async (client) => {
 *     await client.prefetchQuery({
 *       queryKey: queryKeys.users.list(),
 *       queryFn: () => usersService.getAll(),
 *     });
 *   });
 * 
 *   return { props: { dehydratedState } };
 * }
 * ```
 */
export async function prefetchPageData(
  prefetchFn: (client: QueryClient) => Promise<void>
): Promise<DehydratedState> {
  const ssrClient = createSSRQueryClient();
  
  await prefetchFn(ssrClient);
  
  return dehydrate(ssrClient);
}

/**
 * Common prefetch patterns for different page types
 */
export const prefetchPatterns = {
  /**
   * Prefetch dashboard data
   * Critical data that should be immediately available
   */
  dashboard: async (client: QueryClient) => {
    await Promise.all([
      // Prefetch with short stale time for real-time data
      client.prefetchQuery({
        queryKey: queryKeys.auth.session(),
        queryFn: async () => {
          // Session data - implement when auth is ready
          return null;
        },
        staleTime: 30 * 1000, // 30 seconds for session
      }),
    ]);
  },

  /**
   * Prefetch user profile page
   */
  userProfile: async (client: QueryClient, userId: string | number) => {
    await client.prefetchQuery({
      queryKey: queryKeys.users.detail(userId),
      queryFn: async () => {
        const { usersService } = await import('@/lib/api/usersService');
        return usersService.getById(String(userId));
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },

  /**
   * Prefetch CMS page with components
   */
  cmsPage: async (client: QueryClient, pageId: string | number) => {
    await Promise.all([
      client.prefetchQuery({
        queryKey: queryKeys.cms.pages.detail(pageId),
        queryFn: async () => {
          const { cmsService } = await import('@/lib/cms/cms-service');
          return cmsService.getPage(String(pageId));
        },
        staleTime: 10 * 60 * 1000, // 10 minutes for CMS content
      }),
      client.prefetchQuery({
        queryKey: queryKeys.cms.components.list({ pageId }),
        queryFn: async () => {
          const { cmsService } = await import('@/lib/cms/cms-service');
          return cmsService.getComponents(String(pageId));
        },
        staleTime: 10 * 60 * 1000,
      }),
    ]);
  },

  /**
   * Prefetch media library
   */
  mediaLibrary: async (client: QueryClient) => {
    await client.prefetchQuery({
      queryKey: queryKeys.media.list(),
      queryFn: async () => {
        const { mediaService } = await import('@/lib/api/mediaService');
        return mediaService.getAll();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
};

/**
 * Prefetch data on hover/focus for instant navigation
 * Use with Link component or navigation handlers
 * 
 * @example
 * ```tsx
 * <Link
 *   href="/users/123"
 *   onMouseEnter={() => prefetchOnHover(
 *     queryKeys.users.detail(123),
 *     () => usersService.getById(123)
 *   )}
 * >
 *   View User
 * </Link>
 * ```
 */
export async function prefetchOnHover<TData = unknown>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>
): Promise<void> {
  // Only prefetch if not already in cache
  const existing = queryClient.getQueryData(queryKey);
  if (!existing) {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 30 * 1000, // 30 seconds for hover prefetch
    });
  }
}

/**
 * Prefetch next page in pagination
 * Improves perceived performance when navigating paginated data
 * 
 * @example
 * ```ts
 * // When on page 1, prefetch page 2
 * prefetchNextPage(
 *   queryKeys.users.list({ page: 2 }),
 *   () => usersService.getAll({ page: 2 })
 * );
 * ```
 */
export async function prefetchNextPage<TData = unknown>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: 2 * 60 * 1000, // 2 minutes for pagination
  });
}

/**
 * Warmup cache with critical data
 * Call this when app initializes to pre-populate cache
 * 
 * @example
 * ```ts
 * // In app initialization or _app.tsx
 * useEffect(() => {
 *   warmupCache();
 * }, []);
 * ```
 */
export async function warmupCache(): Promise<void> {
  try {
    await Promise.all([
      // Prefetch session if authenticated - implement when auth is ready
      queryClient.prefetchQuery({
        queryKey: queryKeys.auth.session(),
        queryFn: async () => {
          return null;
        },
        staleTime: 60 * 1000,
      }),
    ]);
  } catch (error) {
    // Silently fail - this is just optimization
    console.warn('Cache warmup failed:', error);
  }
}
