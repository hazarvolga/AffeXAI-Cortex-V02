import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import type { ApiResponse, ApiError } from '@affexai/shared-types';

/**
 * Global Exception Filter
 * 
 * Catches all exceptions and formats them into standardized ApiResponse format.
 * Ensures consistent error response structure across all API endpoints.
 * 
 * Error Response Format:
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "code": "EVENT_NOT_FOUND",
 *     "message": "Event with ID xyz not found",
 *     "statusCode": 404,
 *     "details": { "eventId": "xyz" }
 *   },
 *   "meta": {
 *     "timestamp": "2025-10-09T10:30:00Z"
 *   }
 * }
 * ```
 * 
 * @example
 * // Apply globally in main.ts
 * app.useGlobalFilters(new GlobalExceptionFilter());
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error: ApiError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      statusCode: status,
    };

    // Handle HttpException (NestJS exceptions)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      error = {
        code: this.getErrorCode(exception),
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || exception.message,
        statusCode: status,
        details:
          typeof exceptionResponse === 'object' ? exceptionResponse : undefined,
      };
    }
    // Express/body-parser raises a plain Error for request size violations,
    // so it does not pass through Nest's HttpException branch.
    else if (this.isPayloadTooLargeError(exception)) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      error = {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body is too large',
        statusCode: status,
      };
    }
    // Handle other errors (TypeErrors, etc.)
    else if (exception instanceof Error) {
      error = {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          process.env.NODE_ENV === 'development'
            ? exception.message
            : 'An unexpected error occurred',
        statusCode: status,
        details:
          process.env.NODE_ENV === 'development'
            ? { stack: exception.stack }
            : undefined,
      };
    }

    // Log error for debugging
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${error.message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Send standardized error response
    const apiResponse: ApiResponse<never> = {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).json(apiResponse);
  }

  private isPayloadTooLargeError(exception: unknown): boolean {
    if (!exception || typeof exception !== 'object') {
      return false;
    }

    const candidate = exception as {
      type?: unknown;
      status?: unknown;
      statusCode?: unknown;
    };

    return (
      exception instanceof Error &&
      candidate.type === 'entity.too.large' &&
      (candidate.status === HttpStatus.PAYLOAD_TOO_LARGE ||
        candidate.statusCode === HttpStatus.PAYLOAD_TOO_LARGE)
    );
  }

  /**
   * Extract error code from exception
   * Converts exception class name to uppercase error code
   * 
   * Examples:
   * - NotFoundException -> NOT_FOUND
   * - BadRequestException -> BAD_REQUEST
   * - UnauthorizedException -> UNAUTHORIZED
   */
  private getErrorCode(exception: HttpException): string {
    const name = exception.constructor.name;

    // Remove "Exception" suffix and convert to snake_case uppercase
    return name
      .replace('Exception', '')
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .substring(1);
  }
}
