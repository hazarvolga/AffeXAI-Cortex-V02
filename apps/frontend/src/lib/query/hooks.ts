import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from '@tanstack/react-query';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useLoading } from '@/hooks/useLoading';
import { ApiResponse } from '@affexai/shared-types';
import { unwrapResponse } from '@/lib/api/response-utils';

/**
 * Enhanced Query Options
 */
export interface UseApiQueryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  /** Show loading overlay */
  showLoading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Show error toast on failure */
  showError?: boolean;
  /** Error toast title */
  errorTitle?: string;
  /** Component name for error logging */
  component?: string;
}

/**
 * Enhanced Mutation Options
 */
export interface UseApiMutationOptions<TData, TVariables, TError = Error, TContext = unknown>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  /** Show loading overlay */
  showLoading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Show error toast on failure */
  showError?: boolean;
  /** Error toast title */
  errorTitle?: string;
  /** Show success toast on success */
  showSuccess?: boolean;
  /** Success toast message */
  successMessage?: string;
  /** Component name for error logging */
  component?: string;
  /** Query keys to invalidate on success */
  invalidateKeys?: QueryKey[];
}

/**
 * Enhanced useQuery Hook
 * 
 * Wraps TanStack Query's useQuery with automatic error handling,
 * loading state management, and response unwrapping.
 * 
 * @example
 * ```tsx
 * import { useApiQuery } from '@/lib/query';
 * import { queryKeys } from '@/lib/query/query-client';
 * import { usersService } from '@/lib/api';
 * 
 * function UserList() {
 *   const { data, isLoading, error, refetch } = useApiQuery({
 *     queryKey: queryKeys.users.list(),
 *     queryFn: () => usersService.getAll(),
 *     showLoading: true,
 *     loadingMessage: 'Kullanıcılar yükleniyor...',
 *     component: 'UserList',
 *   });
 * 
 *   return <div>{data?.map(user => ...)}</div>;
 * }
 * ```
 */
export function useApiQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData> | TData>,
  options: UseApiQueryOptions<TData, TError> = {}
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
    id: `query-${JSON.stringify(queryKey)}`,
    message: loadingMessage,
    source: component,
    autoStopOnUnmount: true,
  });

  // Query
  const query = useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      if (showLoading) {
        loading.start();
      }

      try {
        const response = await queryFn();

        // Unwrap if ApiResponse
        if (response && typeof response === 'object' && 'success' in response) {
          return unwrapResponse(response as ApiResponse<TData>);
        }

        return response as TData;
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
    ...queryOptions,
  });

  return query;
}

/**
 * Enhanced useMutation Hook
 * 
 * Wraps TanStack Query's useMutation with automatic error handling,
 * loading state, success notifications, and cache invalidation.
 * 
 * @example
 * ```tsx
 * import { useApiMutation } from '@/lib/query';
 * import { queryKeys } from '@/lib/query/query-client';
 * import { usersService } from '@/lib/api';
 * 
 * function CreateUserForm() {
 *   const { mutate, isPending } = useApiMutation({
 *     mutationFn: (data) => usersService.create(data),
 *     invalidateKeys: [queryKeys.users.all],
 *     showLoading: true,
 *     loadingMessage: 'Kullanıcı oluşturuluyor...',
 *     showSuccess: true,
 *     successMessage: 'Kullanıcı başarıyla oluşturuldu',
 *     component: 'CreateUserForm',
 *   });
 * 
 *   return (
 *     <button onClick={() => mutate(formData)} disabled={isPending}>
 *       Kaydet
 *     </button>
 *   );
 * }
 * ```
 */
export function useApiMutation<TData = unknown, TVariables = void, TError = Error, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData> | TData>,
  options: UseApiMutationOptions<TData, TVariables, TError, TContext> = {}
) {
  const {
    showLoading = false,
    loadingMessage,
    showError = true,
    errorTitle = 'İşlem Hatası',
    showSuccess = false,
    successMessage,
    component,
    invalidateKeys = [],
    onSuccess,
    onError,
    ...mutationOptions
  } = options;

  const queryClient = useQueryClient();

  // Error handler
  const handleError = useErrorHandler({
    component,
    toastTitle: errorTitle,
  });

  // Loading state
  const loading = useLoading({
    id: `mutation-${component || 'default'}`,
    message: loadingMessage,
    source: component,
    autoStopOnUnmount: true,
  });

  // Mutation
  const mutation = useMutation<TData, TError, TVariables, TContext>({
    mutationFn: async (variables) => {
      if (showLoading) {
        loading.start();
      }

      try {
        const response = await mutationFn(variables);

        // Unwrap if ApiResponse
        if (response && typeof response === 'object' && 'success' in response) {
          return unwrapResponse(response as ApiResponse<TData>);
        }

        return response as TData;
      } finally {
        if (showLoading) {
          loading.stop();
        }
      }
    },
    onSuccess: async (data, variables, context) => {
      // Show success toast
      if (showSuccess && successMessage) {
        const { toast } = await import('@/hooks/use-toast');
        toast({
          title: 'Başarılı',
          description: successMessage,
          variant: 'default',
        });
      }

      // Invalidate queries
      if (invalidateKeys.length > 0) {
        await Promise.all(
          invalidateKeys.map(key =>
            queryClient.invalidateQueries({ queryKey: key })
          )
        );
      }

      // Call custom onSuccess (if provided)
      if (onSuccess) {
        // @ts-expect-error - TanStack Query v5 callback signature
        await onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      // Show error toast
      if (showError) {
        handleError(error as Error);
      }

      // Call custom onError (if provided)
      if (onError) {
        // @ts-expect-error - TanStack Query v5 callback signature
        onError(error, variables, context);
      }
    },
    ...mutationOptions,
  });

  return mutation;
}

/**
 * Hook for optimistic updates
 * 
 * Provides utilities for implementing optimistic UI updates
 * with automatic rollback on error.
 * 
 * @example
 * ```tsx
 * import { useOptimisticUpdate } from '@/lib/query';
 * import { queryKeys } from '@/lib/query/query-client';
 * 
 * function TodoItem({ todo }) {
 *   const { mutate } = useOptimisticUpdate({
 *     mutationFn: (done: boolean) => todosService.update(todo.id, { done }),
 *     queryKey: queryKeys.todos.list(),
 *     updater: (old, done) => {
 *       return old.map(t => t.id === todo.id ? { ...t, done } : t);
 *     },
 *   });
 * 
 *   return (
 *     <input 
 *       type="checkbox" 
 *       checked={todo.done}
 *       onChange={(e) => mutate(e.target.checked)}
 *     />
 *   );
 * }
 * ```
 */
export function useOptimisticUpdate<TData, TVariables, TError = Error>(
  options: {
    mutationFn: (variables: TVariables) => Promise<ApiResponse<TData> | TData>;
    queryKey: QueryKey;
    updater: (oldData: TData | undefined, variables: TVariables) => TData;
    showError?: boolean;
    errorTitle?: string;
    component?: string;
  }
) {
  const {
    mutationFn,
    queryKey,
    updater,
    showError = true,
    errorTitle = 'Güncelleme Hatası',
    component,
  } = options;

  const queryClient = useQueryClient();
  const handleError = useErrorHandler({
    component,
    toastTitle: errorTitle,
  });

  type Context = { previousData?: TData };

  return useMutation<TData, TError, TVariables, Context>({
    mutationFn: async (variables) => {
      const response = await mutationFn(variables);

      if (response && typeof response === 'object' && 'success' in response) {
        return unwrapResponse(response as ApiResponse<TData>);
      }

      return response as TData;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update
      queryClient.setQueryData<TData>(queryKey, (old) =>
        updater(old, variables)
      );

      // Return context with snapshot
      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      if (showError) {
        handleError(error as Error);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
