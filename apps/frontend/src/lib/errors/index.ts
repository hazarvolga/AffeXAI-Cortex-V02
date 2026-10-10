/**
 * Error Handling Module
 * 
 * Barrel export for all error-related exports.
 */

import { errorLogger, ErrorSeverity } from './error-logger';

// Error Logger
export { errorLogger, ErrorLogger, ErrorSeverity } from './error-logger';
export type { ErrorContext, LoggedError } from './error-logger';

// Error Messages
export {
  HTTP_ERROR_MESSAGES,
  ERROR_CODE_MESSAGES,
  getHttpErrorMessage,
  getErrorCodeMessage,
  getErrorMessage,
  isNetworkError,
  isTimeoutError,
  isAuthError,
  isPermissionError,
  isValidationError,
  isNotFoundError,
  isServerError,
} from './error-messages';

// Re-export for convenience
export default {
  errorLogger,
  ErrorSeverity,
};
