import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorTrackerService } from '../services/error-tracker.service';

@Injectable()
export class ErrorTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorTrackingInterceptor.name);

  constructor(private readonly errorTracker: ErrorTrackerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers, ip, user } = request;

    return next.handle().pipe(
      catchError((error) => {
        // Track error with full context
        this.errorTracker.trackError(error, {
          userId: user?.id || user?.sub,
          endpoint: url,
          method,
          statusCode: error.status || 500,
          requestBody: body,
          requestHeaders: {
            'content-type': headers['content-type'],
            'user-agent': headers['user-agent'],
            'authorization': headers['authorization'] ? 'Bearer [REDACTED]' : undefined,
          },
          userAgent: headers['user-agent'],
          ip: ip || headers['x-forwarded-for'] || headers['x-real-ip'],
          stack: error.stack,
        }).catch((trackError) => {
          this.logger.error('Failed to track error:', trackError);
        });

        return throwError(() => error);
      }),
    );
  }
}
