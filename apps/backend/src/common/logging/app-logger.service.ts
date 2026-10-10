import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog, LogLevel, LogContext } from '../entities/system-log.entity';

@Injectable()
export class AppLoggerService {
  private readonly logger = new Logger('AppLogger');

  constructor(
    @InjectRepository(SystemLog)
    private readonly systemLogRepository: Repository<SystemLog>,
  ) { }

  /**
   * Log an error with full stack trace and metadata
   */
  async logError(
    context: LogContext,
    message: string,
    error?: Error,
    metadata?: Record<string, any>,
    userId?: number,
    tenantId?: string,
  ): Promise<void> {
    const logEntry = this.systemLogRepository.create({
      level: LogLevel.ERROR,
      context,
      message,
      stackTrace: error?.stack,
      metadata: {
        ...metadata,
        errorName: error?.name,
        errorMessage: error?.message,
      },
      userId,
      tenantId,
    });

    await this.systemLogRepository.save(logEntry);

    // Also log to console
    this.logger.error(
      `[${context}] ${message}${error ? `: ${error.message}` : ''}`,
      error?.stack,
    );
  }

  /**
   * Log a warning
   */
  async logWarning(
    context: LogContext,
    message: string,
    metadata?: Record<string, any>,
    userId?: number,
    tenantId?: string,
  ): Promise<void> {
    const logEntry = this.systemLogRepository.create({
      level: LogLevel.WARN,
      context,
      message,
      metadata,
      userId,
      tenantId,
    });

    await this.systemLogRepository.save(logEntry);
    this.logger.warn(`[${context}] ${message}`);
  }

  /**
   * Log general information
   */
  async logInfo(
    context: LogContext,
    message: string,
    metadata?: Record<string, any>,
    userId?: number,
    tenantId?: string,
  ): Promise<void> {
    const logEntry = this.systemLogRepository.create({
      level: LogLevel.INFO,
      context,
      message,
      metadata,
      userId,
      tenantId,
    });

    await this.systemLogRepository.save(logEntry);
    this.logger.log(`[${context}] ${message}`);
  }

  /**
   * Log debug information (only in development)
   */
  async logDebug(
    context: LogContext,
    message: string,
    metadata?: Record<string, any>,
    tenantId?: string,
  ): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      return; // Skip debug logs in production
    }

    const logEntry = this.systemLogRepository.create({
      level: LogLevel.DEBUG,
      context,
      message,
      metadata,
      tenantId,
    });

    await this.systemLogRepository.save(logEntry);
    this.logger.debug(`[${context}] ${message}`);
  }

  /**
   * Log AI API call with timing and result
   */
  async logAiCall(
    provider: string,
    model: string,
    duration: number,
    success: boolean,
    errorMessage?: string,
    userId?: number,
    tenantId?: string,
  ): Promise<void> {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = success
      ? `AI call successful`
      : `AI call failed: ${errorMessage}`;

    const logEntry = this.systemLogRepository.create({
      level,
      context: LogContext.AI,
      message,
      metadata: {
        provider,
        model,
        duration,
        success,
      },
      userId,
      tenantId,
    });

    await this.systemLogRepository.save(logEntry);

    if (success) {
      this.logger.log(
        `[AI] ${provider}/${model} - ${duration}ms - SUCCESS`,
      );
    } else {
      this.logger.error(
        `[AI] ${provider}/${model} - ${duration}ms - FAILED: ${errorMessage}`,
      );
    }
  }

  /**
   * Log slow database query
   */
  async logSlowQuery(
    query: string,
    duration: number,
    userId?: number,
    tenantId?: string,
  ): Promise<void> {
    const logEntry = this.systemLogRepository.create({
      level: LogLevel.WARN,
      context: LogContext.DATABASE,
      message: `Slow query detected (${duration}ms)`,
      metadata: {
        query: query.substring(0, 500), // Limit query length
        duration,
      },
      userId,
      tenantId,
    });

    await this.systemLogRepository.save(logEntry);
    this.logger.warn(
      `[Database] Slow query (${duration}ms): ${query.substring(0, 100)}...`,
    );
  }

  /**
   * Get recent logs with filters
   */
  async getLogs(filters: {
    level?: LogLevel;
    context?: LogContext;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    tenantId?: string;
  }): Promise<{ logs: SystemLog[]; total: number }> {
    const query = this.systemLogRepository.createQueryBuilder('log');

    if (filters.tenantId) {
      query.andWhere('log.tenantId = :tenantId', { tenantId: filters.tenantId });
    }

    if (filters.level) {
      query.andWhere('log.level = :level', { level: filters.level });
    }

    if (filters.context) {
      query.andWhere('log.context = :context', { context: filters.context });
    }

    if (filters.startDate) {
      query.andWhere('log.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      query.andWhere('log.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    query.orderBy('log.createdAt', 'DESC');

    const total = await query.getCount();

    if (filters.limit) {
      query.limit(filters.limit);
    }

    if (filters.offset) {
      query.offset(filters.offset);
    }

    const logs = await query.getMany();

    return { logs, total };
  }

  /**
   * Get error statistics for dashboard
   */
  async getErrorStats(
    startDate?: Date,
    endDate?: Date,
    tenantId?: string,
  ): Promise<{
    totalErrors: number;
    errorsByContext: Record<string, number>;
    recentErrors: SystemLog[];
  }> {
    const query = this.systemLogRepository
      .createQueryBuilder('log')
      .where('log.level = :level', { level: LogLevel.ERROR });

    if (tenantId) {
      query.andWhere('log.tenantId = :tenantId', { tenantId });
    }

    if (startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate });
    }

    const totalErrors = await query.getCount();

    // Group by context
    const contextGroupQuery = this.systemLogRepository
      .createQueryBuilder('log')
      .select('log.context', 'context')
      .addSelect('COUNT(*)', 'count')
      .where('log.level = :level', { level: LogLevel.ERROR });

    if (tenantId) {
      contextGroupQuery.andWhere('log.tenantId = :tenantId', { tenantId });
    }

    const errorsByContextRaw = await contextGroupQuery
      .groupBy('log.context')
      .getRawMany();

    const errorsByContext: Record<string, number> = {};
    errorsByContextRaw.forEach((row) => {
      errorsByContext[row.context] = parseInt(row.count, 10);
    });

    // Get recent errors
    const recentErrors = await this.systemLogRepository.find({
      where: {
        level: LogLevel.ERROR,
        ...(tenantId ? { tenantId } : {}),
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      totalErrors,
      errorsByContext,
      recentErrors,
    };
  }

  /**
   * Clear old logs (older than 30 days by default)
   */
  async clearOldLogs(daysToKeep: number = 30, tenantId?: string): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const query = this.systemLogRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate });

    if (tenantId) {
      query.andWhere('tenantId = :tenantId', { tenantId });
    }

    const result = await query.execute();

    this.logger.log(
      `[System] Cleared ${result.affected} logs older than ${daysToKeep} days`,
    );

    return result.affected || 0;
  }
}
