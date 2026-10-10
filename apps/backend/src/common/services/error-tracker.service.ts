import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorLog } from '../entities/error-log.entity';

export interface ErrorContext {
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  requestBody?: any;
  requestHeaders?: any;
  userAgent?: string;
  ip?: string;
  stack?: string;
}

@Injectable()
export class ErrorTrackerService {
  private readonly logger = new Logger(ErrorTrackerService.name);

  constructor(
    @InjectRepository(ErrorLog)
    private errorLogRepository: Repository<ErrorLog>,
  ) {}

  /**
   * Track an error with full context
   */
  async trackError(
    error: Error,
    context: ErrorContext = {},
  ): Promise<void> {
    try {
      const errorLog = this.errorLogRepository.create({
        message: error.message,
        name: error.name,
        stack: error.stack || context.stack,
        userId: context.userId,
        endpoint: context.endpoint,
        method: context.method,
        statusCode: context.statusCode || 500,
        requestBody: context.requestBody ? JSON.stringify(context.requestBody) : null,
        requestHeaders: context.requestHeaders ? JSON.stringify(context.requestHeaders) : null,
        userAgent: context.userAgent,
        ip: context.ip,
        timestamp: new Date(),
      });

      await this.errorLogRepository.save(errorLog);

      // Log to console for immediate visibility
      this.logger.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 ERROR TRACKED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Endpoint: ${context.method || 'N/A'} ${context.endpoint || 'N/A'}
🔴 Error: ${error.name}: ${error.message}
👤 User: ${context.userId || 'Anonymous'}
🌐 IP: ${context.ip || 'N/A'}
📱 User-Agent: ${context.userAgent || 'N/A'}
📊 Status Code: ${context.statusCode || 500}
📦 Request Body: ${context.requestBody ? JSON.stringify(context.requestBody, null, 2) : 'N/A'}
📚 Stack Trace:
${error.stack || 'No stack trace available'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    } catch (trackError) {
      // Fallback: Just log to console if DB save fails
      this.logger.error('Failed to save error to database:', trackError);
      this.logger.error('Original error:', error);
    }
  }

  /**
   * Get recent errors (for debugging dashboard)
   */
  async getRecentErrors(limit: number = 50): Promise<ErrorLog[]> {
    return this.errorLogRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get errors by endpoint
   */
  async getErrorsByEndpoint(endpoint: string, limit: number = 20): Promise<ErrorLog[]> {
    return this.errorLogRepository.find({
      where: { endpoint },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get errors by user
   */
  async getErrorsByUser(userId: string, limit: number = 20): Promise<ErrorLog[]> {
    return this.errorLogRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Clear old error logs (retention policy)
   */
  async clearOldErrors(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.errorLogRepository
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}
