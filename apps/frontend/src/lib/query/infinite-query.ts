import { useInfiniteQuery, UseInfiniteQueryOptions, QueryKey, InfiniteData } from '@tanstack/react-query';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useLoading } from '@/hooks/useLoading';
import { ApiResponse, PaginationMeta, ListResponse } from '@affexai/shared-types';
import { unwrapListResponse } from '@/lib/api/response-utils';

/**
 * Infinite Query Options
 */
export interface UseInfiniteApiQueryOptions<TData, TError = Error>
  extends Omit<
    UseInfiniteQueryOptions<any, any, any, any, any>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam' | 'select'
  > {
  /** Show loading overlay */
  showLoading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Show error toast */
  showError?: boolean;
  /** Error toast title */
  errorTitle?: string;
  /** Component name */
  component?: string;
}

/**
 * Infinite Query Hook
 * 
 * Hook for paginated data with infinite scroll support.
 * Automatically handles pagination, loading, and errors.
 * 
 * @example
 * ```tsx
 * import { useInfiniteApiQuery } from '@/lib/query';
 * import { queryKeys } from '@/lib/query/query-client';
 * import { productsService } from '@/lib/api';
 * 
 * function ProductList() {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteApiQuery({
 *     queryKey: queryKeys.products.list(),
 *     queryFn: ({ pageParam }) => 
 *       productsService.getList({ page: pageParam, limit: 20 }),
 *     showLoading: true,
 *     component: 'ProductList',
 *   });
 * 
 *   const products = data?.pages.flatMap(page => page.data) ?? [];
 * 
 *   return (
 *     <div>
 *       {products.map(product => (
 *         <ProductCard key={product.id} product={product} />
 *       ))}
 *       
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
 *           {isFetchingNextPage ? 'Yükleniyor...' : 'Daha Fazla'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfiniteApiQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: (context: { pageParam: number }) => Promise<ApiResponse<ListResponse<TData>> | ListResponse<TData>>,
  options: UseInfiniteApiQueryOptions<TData, TError> = {}
) {
  const {
    showLoading = false,
    loadingMessage,
    showError = true,
    errorTitle = 'Veri Yükleme Hatası',
    component,
    ...queryOptions
  } = options;

  // Error handler
  const handleError = useErrorHandler({
    component,
    toastTitle: errorTitle,
  });

  // Loading state
  const loading = useLoading({
    id: `infinite-query-${JSON.stringify(queryKey)}`,
    message: loadingMessage,
    source: component,
    autoStopOnUnmount: true,
  });

  // Infinite query
  const query = useInfiniteQuery<ListResponse<TData>, TError>({
    queryKey,
    queryFn: async ({ pageParam }) => {
      if (showLoading) {
        loading.start();
      }

      try {
        const response = await queryFn({ pageParam: pageParam as number });

        // Unwrap if ApiResponse
        if (response && typeof response === 'object' && 'success' in response) {
          return unwrapListResponse(response as ApiResponse<ListResponse<TData>>);
        }

        return response as ListResponse<TData>;
      } catch (error) {
        if (showError) {
          handleError(error as Error);
        }
        throw error;
      } finally {
        if (showLoading) {
          loading.stop();
        }
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: ListResponse<TData>) => {
      const pagination = lastPage.pagination || lastPage.meta;
      const currentPage = pagination.currentPage ?? pagination.page;
      const { totalPages } = pagination;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    getPreviousPageParam: (firstPage: ListResponse<TData>) => {
      const pagination = firstPage.pagination || firstPage.meta;
      const currentPage = pagination.currentPage ?? pagination.page;
      return currentPage > 1 ? currentPage - 1 : undefined;
    },
    ...queryOptions,
  });

  return query;
}

/**
 * Hook for flattened infinite query data
 * 
 * Returns flattened array of all items from all pages.
 * 
 * @example
 * ```tsx
 * import { useFlatInfiniteQuery } from '@/lib/query';
 * 
 * function ProductList() {
 *   const { items, hasNextPage, fetchNextPage } = useFlatInfiniteQuery({
 *     queryKey: queryKeys.products.list(),
 *     queryFn: ({ pageParam }) => productsService.getList({ page: pageParam }),
 *   });
 * 
 *   return (
 *     <div>
 *       {items.map(product => <ProductCard key={product.id} product={product} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFlatInfiniteQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: (context: { pageParam: number }) => Promise<ApiResponse<ListResponse<TData>> | ListResponse<TData>>,
  options: UseInfiniteApiQueryOptions<TData, TError> = {}
) {
  const query = useInfiniteApiQuery(queryKey, queryFn, options);

  // Flatten all pages
  const items = query.data?.pages.flatMap(page => page.data || page.items) ?? [];

  // Total count from last page
  const lastPage = query.data?.pages[query.data.pages.length - 1];
  const pagination = lastPage?.pagination || lastPage?.meta;
  const totalCount = pagination?.totalCount ?? pagination?.total ?? 0;

  return {
    ...query,
    items,
    totalCount,
  };
}
