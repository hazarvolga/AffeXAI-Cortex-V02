/**
 * Bulk Operation Error Management Hook
 * 
 * React hook for managing bulk operation errors, notifications, and recovery
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  BulkOperationError, 
  bulkOperationErrorHandler 
} from '@/lib/errors/bulk-operation-errors';
import { 
  bulkOperationNotificationService,
  NotificationContext 
} from '@/lib/notifications/bulk-operation-notifications';
import { bulkOperationLogger } from '@/lib/logging/bulk-operation-logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ErrorState {
  error: BulkOperationError | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
  suggestions: string[];
  userMessage: string;
}

export interface ErrorHandlerOptions {
  maxRetries?: number;
  enableNotifications?: boolean;
  enableLogging?: boolean;
  onError?: (error: BulkOperationError) => void;
  onRetry?: (error: BulkOperationError, attempt: number) => void;
  onRecover?: (error: BulkOperationError) => void;
}

export interface UseBulkOperationErrorsReturn {
  errorState: ErrorState;
  handleError: (error: any, context?: any) => void;
  retryOperation: (operation: () => Promise<any>) => Promise<any>;
  clearError: () => void;
  dismissError: () => void;
  reportError: (description: string) => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export const useBulkOperationErrors = (
  userId: string,
  jobId?: string,
  jobType?: 'import' | 'export',
  options: ErrorHandlerOptions = {}
): UseBulkOperationErrorsReturn => {
  const {
    maxRetries = 3,
    enableNotifications = true,
    enableLogging = true,
    onError,
    onRetry,
    onRecover
  } = options;

  // State
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: false,
    suggestions: [],
    userMessage: ''
  });

  // Handle error classification and state update
  const handleError = useCallback((error: any, context?: any) => {
    const bulkError = bulkOperationErrorHandler.classifyError(error, {
      userId,
      jobId,
      jobType,
      ...context
    });

    const suggestions = bulkOperationNotificationService.getErrorSuggestions(bulkError);
    const userMessage = bulkOperationErrorHandler.getUserFriendlyMessage(bulkError);

    setErrorState({
      error: bulkError,
      isRetrying: false,
      retryCount: 0,
      canRetry: bulkError.retryable,
      suggestions,
      userMessage
    });

    // Log the error
    if (enableLogging) {
      bulkOperationLogger.logError(bulkError, {
        userId,
        jobId,
        jobType,
        operation: context?.operation || 'unknown',
        ...context
      });
    }

    // Send notification for system errors
    if (enableNotifications && shouldNotifyForError(bulkError)) {
      const notificationContext: NotificationContext = {
        userId,
        jobId: jobId || 'unknown',
        jobType: jobType || 'import',
        error: bulkError
      };
      
      bulkOperationNotificationService.notifySystemError(bulkError, notificationContext);
    }

    // Call custom error handler
    if (onError) {
      onError(bulkError);
    }
  }, [userId, jobId, jobType, enableLogging, enableNotifications, onError]);

  // Retry operation with exponential backoff
  const retryOperation = useCallback(async (operation: () => Promise<any>): Promise<any> => {
    if (!errorState.error || !errorState.canRetry || errorState.retryCount >= maxRetries) {
      throw errorState.error || new Error('Cannot retry operation');
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1
    }));

    try {
      // Call custom retry handler
      if (onRetry) {
        onRetry(errorState.error, errorState.retryCount + 1);
      }

      // Execute the operation with retry logic
      const result = await bulkOperationErrorHandler.executeWithRetry(
        operation,
        { userId, jobId, jobType, retryAttempt: errorState.retryCount + 1 },
        { maxAttempts: 1 } // Single attempt since we're managing retries here
      );

      // Success - clear error state
      setErrorState({
        error: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: false,
        suggestions: [],
        userMessage: ''
      });

      // Call recovery handler
      if (onRecover) {
        onRecover(errorState.error);
      }

      // Log successful recovery
      if (enableLogging) {
        bulkOperationLogger.log(
          'info' as any,
          'operation' as any,
          `Operation recovered after ${errorState.retryCount + 1} retries`,
          { userId, jobId, jobType },
          { 
            originalError: errorState.error.type,
            retryCount: errorState.retryCount + 1
          }
        );
      }

      return result;
    } catch (retryError) {
      const newBulkError = bulkOperationErrorHandler.classifyError(retryError, {
        userId,
        jobId,
        jobType,
        retryAttempt: errorState.retryCount + 1
      });

      setErrorState(prev => ({
        ...prev,
        error: newBulkError,
        isRetrying: false,
        canRetry: newBulkError.retryable && prev.retryCount + 1 < maxRetries,
        suggestions: bulkOperationNotificationService.getErrorSuggestions(newBulkError),
        userMessage: bulkOperationErrorHandler.getUserFriendlyMessage(newBulkError)
      }));

      throw newBulkError;
    }
  }, [errorState, maxRetries, userId, jobId, jobType, onRetry, onRecover, enableLogging]);

  // Clear error state
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: false,
      suggestions: [],
      userMessage: ''
    });
  }, []);

  // Dismiss error (same as clear but with logging)
  const dismissError = useCallback(() => {
    if (errorState.error && enableLogging) {
      bulkOperationLogger.log(
        'info' as any,
        'operation' as any,
        'Error dismissed by user',
        { userId, jobId, jobType },
        { 
          dismissedError: errorState.error.type,
          retryCount: errorState.retryCount
        }
      );
    }
    
    clearError();
  }, [errorState.error, errorState.retryCount, enableLogging, userId, jobId, jobType, clearError]);

  // Report error to support
  const reportError = useCallback(async (description: string): Promise<void> => {
    if (!errorState.error) return;

    try {
      // Create error report
      const notificationContext: NotificationContext = {
        userId,
        jobId: jobId || 'unknown',
        jobType: jobType || 'import',
        error: errorState.error
      };

      await bulkOperationNotificationService.createErrorReport(
        errorState.error,
        notificationContext
      );

      // Log the report
      if (enableLogging) {
        bulkOperationLogger.log(
          'info' as any,
          'audit' as any,
          'Error reported by user',
          { userId, jobId, jobType },
          {
            errorType: errorState.error.type,
            userDescription: description,
            retryCount: errorState.retryCount
          }
        );
      }

      console.log('[useBulkOperationErrors] Error reported successfully');
    } catch (reportingError) {
      console.error('[useBulkOperationErrors] Failed to report error:', reportingError);
      throw new Error('Failed to report error. Please try again or contact support directly.');
    }
  }, [errorState.error, errorState.retryCount, userId, jobId, jobType, enableLogging]);

  // Auto-clear errors after a certain time for non-critical errors
  useEffect(() => {
    if (!errorState.error || errorState.error.type === 'AUTHENTICATION_FAILED' as any) {
      return;
    }

    // Auto-clear retryable errors after 30 seconds
    if (errorState.error.retryable && !errorState.isRetrying) {
      const timer = setTimeout(() => {
        clearError();
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [errorState.error, errorState.isRetrying, clearError]);

  return {
    errorState,
    handleError,
    retryOperation,
    clearError,
    dismissError,
    reportError
  };
};

// ============================================================================
// Helper Functions
// ============================================================================

const shouldNotifyForError = (error: BulkOperationError): boolean => {
  // Always notify for critical errors
  const criticalErrors = [
    'AUTHENTICATION_FAILED',
    'PERMISSION_DENIED',
    'FILE_MALWARE_DETECTED',
    'DATABASE_CONNECTION_FAILED'
  ];

  if (criticalErrors.includes(error.type as string)) {
    return true;
  }

  // Notify for system errors that aren't user-caused
  const systemErrors = [
    'VALIDATION_SERVICE_UNAVAILABLE',
    'QUEUE_PROCESSING_FAILED',
    'MEMORY_LIMIT_EXCEEDED'
  ];

  return systemErrors.includes(error.type as string);
};

export default useBulkOperationErrors;