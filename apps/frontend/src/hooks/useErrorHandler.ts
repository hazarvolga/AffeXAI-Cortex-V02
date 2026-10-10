/**
 * useErrorHandler Hook
 * 
 * React hook for handling errors with toast notifications and logging.
 */

'use client';

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorLogger, ErrorSeverity } from '@/lib/errors/error-logger';
import { getErrorMessage, isAuthError } from '@/lib/errors/error-messages';
import { useRouter } from 'next/navigation';
import type { ApiError } from '@/lib/api/http-client';

// ============================================================================
// Types
// ============================================================================

export interface ErrorHandlerOptions {
  /** Show toast notification */
  showToast?: boolean;
  /** Toast title */
  toastTitle?: string;
  /** Log error to error logger */
  logError?: boolean;
  /** Error severity for logging */
  severity?: ErrorSeverity;
  /** Redirect to login on auth errors */
  redirectOnAuthError?: boolean;
  /** Custom error handler */
  onError?: (error: Error | ApiError) => void;
  /** Component context for logging */
  component?: string;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for handling errors with toast notifications and logging
 * 
 * @example
 * ```tsx
 * function UserList() {
 *   const handleError = useErrorHandler({ component: 'UserList' });
 *   
 *   const loadUsers = async () => {
 *     try {
 *       const users = await userService.getAll();
 *     } catch (error) {
 *       handleError(error);
 *     }
 *   };
 * }
 * 
 * // With custom options
 * const handleError = useErrorHandler({
 *   component: 'UserForm',
 *   toastTitle: 'Kayıt Hatası',
 *   severity: ErrorSeverity.HIGH,
 * });
 * ```
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { toast } = useToast();
  const router = useRouter();

  const handleError = useCallback(
    (error: Error | ApiError | string, customOptions?: ErrorHandlerOptions) => {
      const mergedOptions = { ...options, ...customOptions };
      const {
        showToast = true,
        toastTitle = 'Hata',
        logError = true,
        severity = ErrorSeverity.MEDIUM,
        redirectOnAuthError = true,
        onError,
        component,
      } = mergedOptions;

      // Convert string to Error
      const errorObj = typeof error === 'string' ? new Error(error) : error;

      // Get user-friendly message
      const errorCode = (errorObj as any).code;
      const statusCode = (errorObj as any).status || (errorObj as any).statusCode;
      const message = getErrorMessage(errorCode, statusCode);

      // Show toast notification
      if (showToast) {
        toast({
          variant: 'destructive',
          title: toastTitle,
          description: message,
        });
      }

      // Log error
      if (logError) {
        errorLogger.log(errorObj, severity, {
          component,
          action: 'error_handler',
        });
      }

      // Redirect to login on auth errors
      if (redirectOnAuthError && isAuthError(errorObj)) {
        const currentPath = window.location.pathname;
        const returnUrl = encodeURIComponent(currentPath);
        router.push(`/login?returnUrl=${returnUrl}`);
      }

      // Call custom error handler
      if (onError) {
        onError(errorObj);
      }
    },
    [options, toast, router]
  );

  return handleError;
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for handling API errors
 */
export function useApiErrorHandler(options: ErrorHandlerOptions = {}) {
  return useErrorHandler({
    ...options,
    component: options.component || 'API',
  });
}

/**
 * Hook for handling form errors
 */
export function useFormErrorHandler(options: ErrorHandlerOptions = {}) {
  return useErrorHandler({
    ...options,
    toastTitle: options.toastTitle || 'Form Hatası',
    severity: ErrorSeverity.LOW,
    component: options.component || 'Form',
  });
}

/**
 * Hook for handling network errors
 */
export function useNetworkErrorHandler(options: ErrorHandlerOptions = {}) {
  return useErrorHandler({
    ...options,
    toastTitle: options.toastTitle || 'Bağlantı Hatası',
    severity: ErrorSeverity.HIGH,
    component: options.component || 'Network',
  });
}

// ============================================================================
// Exports
// ============================================================================

export default useErrorHandler;
