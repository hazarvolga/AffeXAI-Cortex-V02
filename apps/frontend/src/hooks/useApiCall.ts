/**
 * useApiCall Hook
 * 
 * Generic React hook for making API calls with loading and error states.
 */

'use client';

import { useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseApiCallOptions<T> {
  /** Initial data value */
  initialData?: T | null;
  /** Callback when request succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when request fails */
  onError?: (error: Error) => void;
  /** Callback when request completes (success or error) */
  onComplete?: () => void;
}

export interface UseApiCallResult<T, TArgs extends any[] = []> {
  /** Current data */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Execute the API call */
  execute: (...args: TArgs) => Promise<T>;
  /** Reset state to initial values */
  reset: () => void;
  /** Set data manually */
  setData: (data: T | null) => void;
  /** Set error manually */
  setError: (error: Error | null) => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for making API calls with state management
 * 
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data: user, loading, error, execute } = useApiCall(
 *     (id: string) => usersService.getById(id)
 *   );
 * 
 *   useEffect(() => {
 *     execute(userId);
 *   }, [userId]);
 * 
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   if (!user) return null;
 * 
 *   return <div>{user.name}</div>;
 * }
 * ```
 */
export function useApiCall<T, TArgs extends any[] = []>(
  apiFunction: (...args: TArgs) => Promise<T>,
  options?: UseApiCallOptions<T>
): UseApiCallResult<T, TArgs> {
  const [data, setData] = useState<T | null>(options?.initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<T> => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiFunction(...args);
        setData(result);

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An error occurred');
        setError(error);

        if (options?.onError) {
          options.onError(error);
        }

        throw error;
      } finally {
        setLoading(false);

        if (options?.onComplete) {
          options.onComplete();
        }
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback(() => {
    setData(options?.initialData ?? null);
    setLoading(false);
    setError(null);
  }, [options?.initialData]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData,
    setError,
  };
}

// ============================================================================
// Mutation Hook (for POST/PUT/PATCH/DELETE)
// ============================================================================

/**
 * Hook for mutation operations (create, update, delete)
 * Similar to useApiCall but designed for mutations
 * 
 * @example
 * ```tsx
 * function CreateUserForm() {
 *   const { loading, error, mutate } = useMutation(
 *     (data: CreateUserDto) => usersService.create(data),
 *     {
 *       onSuccess: (user) => {
 *         toast.success('User created!');
 *         router.push(`/users/${user.id}`);
 *       }
 *     }
 *   );
 * 
 *   const handleSubmit = async (formData: CreateUserDto) => {
 *     await mutate(formData);
 *   };
 * 
 *   return <UserForm onSubmit={handleSubmit} loading={loading} error={error} />;
 * }
 * ```
 */
export function useMutation<T, TArgs extends any[] = []>(
  mutationFunction: (...args: TArgs) => Promise<T>,
  options?: UseApiCallOptions<T>
) {
  const { execute, loading, error, reset } = useApiCall(mutationFunction, options);

  return {
    mutate: execute,
    loading,
    error,
    reset,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default useApiCall;
