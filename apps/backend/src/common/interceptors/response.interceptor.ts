import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '@affexai/shared-types';

/**
 * Response Interceptor
 * 
 * Wraps all successful responses in a standardized ApiResponse format.
 * This ensures consistent response structure across all API endpoints.
 * 
 * Response Format:
 * ```json
 * {
 *   "success": true,
 *   "data": { ... },
 *   "meta": {
 *     "timestamp": "2025-10-09T10:30:00Z"
 *   }
 * }
 * ```
 * 
 * @example
 * // Apply globally in main.ts
 * app.useGlobalInterceptors(new ResponseInterceptor());
 * 
 * @example
 * // Apply to specific controller
 * @UseInterceptors(ResponseInterceptor)
 * @Controller('events')
 * export class EventsController { }
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | StreamableFile>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | StreamableFile> {
    return next.handle().pipe(
      map((data) => {
        // Binary responses must reach the HTTP adapter as streams, never JSON.
        if (data instanceof StreamableFile) return data;
        // If the response is already wrapped (has success property), return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponse<T>;
        }

        // Wrap the response
        return {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
