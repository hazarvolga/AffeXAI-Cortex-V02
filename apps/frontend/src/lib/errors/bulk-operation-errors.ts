/**
 * Bulk Operation Error Handling
 * 
 * Comprehensive error handling for bulk import/export operations including:
 * - Retry mechanisms with exponential backoff
 * - Partial failure handling for batch operations
 * - Graceful degradation for validation service failures
 * - Error categorization and recovery strategies
 */

import { ApiError } from '../api/http-client';

// ============================================================================
// Error Types and Interfaces
// ============================================================================

export enum BulkOperationErrorType {
  // File processing errors
  FILE_INVALID_FORMAT = 'FILE_INVALID_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_CORRUPTED = 'FILE_CORRUPTED',
  FILE_MALWARE_DETECTED = 'FILE_MALWARE_DETECTED',
  
  // Validation errors
  VALIDATION_SERVICE_UNAVAILABLE = 'VALIDATION_SERVICE_UNAVAILABLE',
  VALIDATION_RATE_LIMIT_EXCEEDED = 'VALIDATION_RATE_LIMIT_EXCEEDED',
  VALIDATION_TIMEOUT = 'VALIDATION_TIMEOUT',
  VALIDATION_PARTIAL_FAILURE = 'VALIDATION_PARTIAL_FAILURE',
  
  // Processing errors
  BATCH_PROCESSING_FAILED = 'BATCH_PROCESSING_FAILED',
  QUEUE_PROCESSING_FAILED = 'QUEUE_PROCESSING_FAILED',
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  
  // System errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Business logic errors
  DUPLICATE_HANDLING_FAILED = 'DUPLICATE_HANDLING_FAILED',
  SUBSCRIBER_CREATION_FAILED = 'SUBSCRIBER_CREATION_FAILED',
  GROUP_ASSIGNMENT_FAILED = 'GROUP_ASSIGNMENT_FAILED',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface BulkOperationError {
  type: BulkOperationErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
  recoverable: boolean;
  batchIndex?: number;
  recordIndex?: number;
  email?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: BulkOperationErrorType[];
}

export interface PartialFailureResult<T> {
  successful: T[];
  failed: Array<{
    item: any;
    error: BulkOperationError;
    index: number;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

export interface RecoveryStrategy {
  canRecover: (error: BulkOperationError) => boolean;
  recover: (error: BulkOperationError, context: any) => Promise<any>;
  fallback?: (error: BulkOperationError, context: any) => Promise<any>;
}

// ============================================================================
// Error Classification and Handling
// ============================================================================

export class BulkOperationErrorHandler {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
      BulkOperationErrorType.VALIDATION_SERVICE_UNAVAILABLE,
      BulkOperationErrorType.VALIDATION_TIMEOUT,
      BulkOperationErrorType.NETWORK_ERROR,
      BulkOperationErrorType.TIMEOUT_ERROR,
      BulkOperationErrorType.DATABASE_CONNECTION_FAILED,
      BulkOperationErrorType.QUEUE_PROCESSING_FAILED
    ]
  };

  private retryConfig: RetryConfig;
  private recoveryStrategies: Map<BulkOperationErrorType, RecoveryStrategy>;

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = { ...BulkOperationErrorHandler.DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.recoveryStrategies = new Map();
    this.setupDefaultRecoveryStrategies();
  }

  /**
   * Classify error from various sources (API errors, exceptions, etc.)
   */
  public classifyError(error: any, context?: any): BulkOperationError {
    const timestamp = new Date();

    // Handle ApiError from HTTP client
    if (error instanceof ApiError) {
      return this.classifyApiError(error, timestamp, context);
    }

    // Handle standard JavaScript errors
    if (error instanceof Error) {
      return this.classifyJavaScriptError(error, timestamp, context);
    }

    // Handle string errors
    if (typeof error === 'string') {
      return {
        type: BulkOperationErrorType.UNKNOWN_ERROR,
        message: error,
        timestamp,
        retryable: false,
        recoverable: false,
        ...context
      };
    }

    // Handle object errors
    if (error && typeof error === 'object') {
      return this.classifyObjectError(error, timestamp, context);
    }

    // Fallback for unknown error types
    return {
      type: BulkOperationErrorType.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
      details: error,
      timestamp,
      retryable: false,
      recoverable: false,
      ...context
    };
  }

  /**
   * Execute operation with retry logic and exponential backoff
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: any,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customRetryConfig };
    let lastError: BulkOperationError | null = null;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const bulkError = this.classifyError(error, context);
        lastError = bulkError;

        // Check if error is retryable
        if (!bulkError.retryable || !config.retryableErrors.includes(bulkError.type)) {
          throw bulkError;
        }

        // Don't retry on last attempt
        if (attempt === config.maxAttempts) {
          throw bulkError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        console.warn(
          `[BulkOperationErrorHandler] Attempt ${attempt}/${config.maxAttempts} failed. Retrying in ${jitteredDelay}ms`,
          { error: bulkError, context }
        );

        await this.sleep(jitteredDelay);
      }
    }

    throw lastError;
  }

  /**
   * Handle partial failures in batch operations
   */
  public async handlePartialFailure<T, U>(
    items: T[],
    processor: (item: T, index: number) => Promise<U>,
    context?: any
  ): Promise<PartialFailureResult<U>> {
    const successful: U[] = [];
    const failed: Array<{ item: T; error: BulkOperationError; index: number }> = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const result = await processor(items[i], i);
        successful.push(result);
      } catch (error) {
        const bulkError = this.classifyError(error, { 
          ...context, 
          batchIndex: context?.batchIndex,
          recordIndex: i 
        });
        
        failed.push({
          item: items[i],
          error: bulkError,
          index: i
        });

        // Try recovery if available
        if (bulkError.recoverable) {
          try {
            const recoveryStrategy = this.recoveryStrategies.get(bulkError.type);
            if (recoveryStrategy && recoveryStrategy.canRecover(bulkError)) {
              const recoveredResult = await recoveryStrategy.recover(bulkError, { item: items[i], index: i });
              successful.push(recoveredResult);
              // Remove from failed array
              failed.pop();
            }
          } catch (recoveryError) {
            console.warn('[BulkOperationErrorHandler] Recovery failed', { 
              originalError: bulkError, 
              recoveryError 
            });
          }
        }
      }
    }

    return {
      successful,
      failed,
      totalProcessed: items.length,
      successCount: successful.length,
      failureCount: failed.length
    };
  }

  /**
   * Attempt graceful degradation for validation service failures
   */
  public async gracefulValidationDegradation(
    email: string,
    originalError: BulkOperationError
  ): Promise<{ isValid: boolean; confidence: number; degraded: true }> {
    console.warn('[BulkOperationErrorHandler] Applying graceful validation degradation', {
      email,
      error: originalError
    });

    // Basic email format validation as fallback
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isBasicValid = emailRegex.test(email);

    // Simple domain checks
    const domain = email.split('@')[1];
    const isCommonDomain = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
      'aol.com', 'icloud.com', 'protonmail.com'
    ].includes(domain?.toLowerCase());

    return {
      isValid: isBasicValid,
      confidence: isBasicValid ? (isCommonDomain ? 0.7 : 0.5) : 0.1,
      degraded: true
    };
  }

  /**
   * Register custom recovery strategy
   */
  public registerRecoveryStrategy(errorType: BulkOperationErrorType, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(errorType, strategy);
  }

  /**
   * Get user-friendly error message
   */
  public getUserFriendlyMessage(error: BulkOperationError): string {
    const errorMessages: Record<BulkOperationErrorType, string> = {
      [BulkOperationErrorType.FILE_INVALID_FORMAT]: 'The uploaded file format is not supported. Please use a valid CSV file.',
      [BulkOperationErrorType.FILE_TOO_LARGE]: 'The uploaded file is too large. Please reduce the file size or split it into smaller files.',
      [BulkOperationErrorType.FILE_CORRUPTED]: 'The uploaded file appears to be corrupted. Please try uploading the file again.',
      [BulkOperationErrorType.FILE_MALWARE_DETECTED]: 'The uploaded file contains potentially harmful content and cannot be processed.',
      
      [BulkOperationErrorType.VALIDATION_SERVICE_UNAVAILABLE]: 'Email validation service is temporarily unavailable. Please try again later.',
      [BulkOperationErrorType.VALIDATION_RATE_LIMIT_EXCEEDED]: 'Too many validation requests. Please wait a moment before trying again.',
      [BulkOperationErrorType.VALIDATION_TIMEOUT]: 'Email validation is taking longer than expected. Please try again.',
      [BulkOperationErrorType.VALIDATION_PARTIAL_FAILURE]: 'Some emails could not be validated. Check the detailed results for more information.',
      
      [BulkOperationErrorType.BATCH_PROCESSING_FAILED]: 'Failed to process some records in the batch. Please review the detailed results.',
      [BulkOperationErrorType.QUEUE_PROCESSING_FAILED]: 'Processing queue encountered an error. The operation will be retried automatically.',
      [BulkOperationErrorType.DATABASE_CONNECTION_FAILED]: 'Database connection error. Please try again in a few moments.',
      [BulkOperationErrorType.MEMORY_LIMIT_EXCEEDED]: 'The operation requires too much memory. Please try with a smaller file.',
      
      [BulkOperationErrorType.NETWORK_ERROR]: 'Network connection error. Please check your internet connection and try again.',
      [BulkOperationErrorType.TIMEOUT_ERROR]: 'The operation timed out. Please try again or contact support if the problem persists.',
      [BulkOperationErrorType.AUTHENTICATION_FAILED]: 'Authentication failed. Please log in again.',
      [BulkOperationErrorType.PERMISSION_DENIED]: 'You do not have permission to perform this operation.',
      
      [BulkOperationErrorType.DUPLICATE_HANDLING_FAILED]: 'Failed to handle duplicate records. Please check your duplicate handling settings.',
      [BulkOperationErrorType.SUBSCRIBER_CREATION_FAILED]: 'Failed to create some subscribers. Please review the detailed results.',
      [BulkOperationErrorType.GROUP_ASSIGNMENT_FAILED]: 'Failed to assign subscribers to groups. Please check group permissions.',
      
      [BulkOperationErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again or contact support.'
    };

    return errorMessages[error.type] || error.message || 'An unexpected error occurred.';
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private classifyApiError(error: ApiError, timestamp: Date, context?: any): BulkOperationError {
    // Network and timeout errors
    if (error.isNetworkError) {
      return {
        type: BulkOperationErrorType.NETWORK_ERROR,
        message: error.message,
        details: error.data,
        timestamp,
        retryable: true,
        recoverable: false,
        ...context
      };
    }

    if (error.isTimeoutError) {
      return {
        type: BulkOperationErrorType.TIMEOUT_ERROR,
        message: error.message,
        details: error.data,
        timestamp,
        retryable: true,
        recoverable: false,
        ...context
      };
    }

    // HTTP status-based classification
    switch (error.status) {
      case 401:
        return {
          type: BulkOperationErrorType.AUTHENTICATION_FAILED,
          message: error.message,
          details: error.data,
          timestamp,
          retryable: false,
          recoverable: false,
          ...context
        };

      case 403:
        return {
          type: BulkOperationErrorType.PERMISSION_DENIED,
          message: error.message,
          details: error.data,
          timestamp,
          retryable: false,
          recoverable: false,
          ...context
        };

      case 413:
        return {
          type: BulkOperationErrorType.FILE_TOO_LARGE,
          message: error.message,
          details: error.data,
          timestamp,
          retryable: false,
          recoverable: false,
          ...context
        };

      case 422:
        return this.classifyValidationError(error, timestamp, context);

      case 429:
        return {
          type: BulkOperationErrorType.VALIDATION_RATE_LIMIT_EXCEEDED,
          message: error.message,
          details: error.data,
          timestamp,
          retryable: true,
          recoverable: false,
          ...context
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: BulkOperationErrorType.QUEUE_PROCESSING_FAILED,
          message: error.message,
          details: error.data,
          timestamp,
          retryable: true,
          recoverable: false,
          ...context
        };

      default:
        return {
          type: BulkOperationErrorType.UNKNOWN_ERROR,
          message: error.message,
          details: error.data,
          timestamp,
          retryable: false,
          recoverable: false,
          ...context
        };
    }
  }

  private classifyValidationError(error: ApiError, timestamp: Date, context?: any): BulkOperationError {
    const errorCode = error.code?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    if (errorCode.includes('file') || errorMessage.includes('file')) {
      if (errorMessage.includes('format') || errorMessage.includes('invalid')) {
        return {
          type: BulkOperationErrorType.FILE_INVALID_FORMAT,
          message: error.message,
          details: error.data,
          timestamp,
          retryable: false,
          recoverable: false,
          ...context
        };
      }

      if (errorMessage.includes('corrupted') || errorMessage.includes('malformed')) {
        return {
          type: BulkOperationErrorType.FILE_CORRUPTED,
          message: error.message,
          details: error.data,
          timestamp,
          retryable: false,
          recoverable: false,
          ...context
        };
      }
    }

    return {
      type: BulkOperationErrorType.VALIDATION_PARTIAL_FAILURE,
      message: error.message,
      details: error.data,
      timestamp,
      retryable: false,
      recoverable: true,
      ...context
    };
  }

  private classifyJavaScriptError(error: Error, timestamp: Date, context?: any): BulkOperationError {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch')) {
      return {
        type: BulkOperationErrorType.NETWORK_ERROR,
        message: error.message,
        details: error.stack,
        timestamp,
        retryable: true,
        recoverable: false,
        ...context
      };
    }

    if (message.includes('timeout')) {
      return {
        type: BulkOperationErrorType.TIMEOUT_ERROR,
        message: error.message,
        details: error.stack,
        timestamp,
        retryable: true,
        recoverable: false,
        ...context
      };
    }

    if (message.includes('memory') || message.includes('heap')) {
      return {
        type: BulkOperationErrorType.MEMORY_LIMIT_EXCEEDED,
        message: error.message,
        details: error.stack,
        timestamp,
        retryable: false,
        recoverable: false,
        ...context
      };
    }

    return {
      type: BulkOperationErrorType.UNKNOWN_ERROR,
      message: error.message,
      details: error.stack,
      timestamp,
      retryable: false,
      recoverable: false,
      ...context
    };
  }

  private classifyObjectError(error: any, timestamp: Date, context?: any): BulkOperationError {
    const type = error.type || error.code || 'UNKNOWN_ERROR';
    const message = error.message || error.error || 'An error occurred';

    return {
      type: type as BulkOperationErrorType,
      message,
      details: error,
      timestamp,
      retryable: error.retryable || false,
      recoverable: error.recoverable || false,
      ...context
    };
  }

  private setupDefaultRecoveryStrategies(): void {
    // Recovery strategy for validation service failures
    this.registerRecoveryStrategy(BulkOperationErrorType.VALIDATION_SERVICE_UNAVAILABLE, {
      canRecover: (error) => true,
      recover: async (error, context) => {
        const email = context.item?.email || context.email;
        if (email) {
          return await this.gracefulValidationDegradation(email, error);
        }
        throw error;
      }
    });

    // Recovery strategy for partial validation failures
    this.registerRecoveryStrategy(BulkOperationErrorType.VALIDATION_PARTIAL_FAILURE, {
      canRecover: (error) => true,
      recover: async (error, context) => {
        const email = context.item?.email || context.email;
        if (email) {
          return await this.gracefulValidationDegradation(email, error);
        }
        throw error;
      }
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const bulkOperationErrorHandler = new BulkOperationErrorHandler();
export default bulkOperationErrorHandler;