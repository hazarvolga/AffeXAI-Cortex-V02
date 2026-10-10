import { Controller, Get, Query, UseGuards, Delete, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { AppLoggerService } from '../../common/logging/app-logger.service';
import { LogLevel, LogContext } from '../../common/entities/system-log.entity';
import { FrontendErrorDto } from './dto/frontend-error.dto';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('system-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemLogsController {
  constructor(private readonly appLoggerService: AppLoggerService) { }

  /**
   * Get system logs with filters (Admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async getLogs(
    @CurrentUser() user: User,
    @Query('level') level?: LogLevel,
    @Query('context') context?: LogContext,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.appLoggerService.getLogs({
      level,
      context,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      tenantId: user.tenantId,
    });

    return {
      success: true,
      data: result.logs,
      total: result.total,
      pagination: {
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      },
    };
  }

  /**
   * Get error statistics for dashboard (Admin only)
   */
  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getStats(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.appLoggerService.getErrorStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      user.tenantId,
    );

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Clear old logs (Admin only)
   */
  @Delete('cleanup')
  @Roles(UserRole.ADMIN)
  async clearOldLogs(
    @CurrentUser() user: User,
    @Query('daysToKeep') daysToKeep?: string,
  ) {
    const deletedCount = await this.appLoggerService.clearOldLogs(
      daysToKeep ? parseInt(daysToKeep, 10) : 30,
      user.tenantId,
    );

    return {
      success: true,
      message: `Cleared ${deletedCount} old log entries`,
      deletedCount,
    };
  }
}

/**
 * Frontend Error Logging Controller (No Auth Required)
 */
@Controller('frontend-errors')
export class FrontendErrorsController {
  constructor(private readonly appLoggerService: AppLoggerService) { }

  /**
   * Log frontend errors (Public endpoint - no auth required)
   */
  @Post()
  async logFrontendError(@Body() errorDto: FrontendErrorDto) {
    try {
      // Map frontend severity to log level
      const logLevel = this.mapSeverityToLogLevel(errorDto.severity);

      // Map frontend category to log context
      const logContext = this.mapCategoryToContext(errorDto.category);

      // Create error object if stack trace exists
      const error = errorDto.stack
        ? new Error(errorDto.message)
        : undefined;

      if (error && errorDto.stack) {
        error.stack = errorDto.stack;
      }

      // Log the error
      await this.appLoggerService.logError(
        logContext,
        `[Frontend] ${errorDto.message}`,
        error,
        {
          url: errorDto.url,
          userAgent: errorDto.userAgent,
          severity: errorDto.severity,
          category: errorDto.category,
          ...errorDto.metadata,
        },
        errorDto.userId,
      );

      return {
        success: true,
        message: 'Error logged successfully',
      };
    } catch (error) {
      // Don't throw error to avoid infinite loop
      console.error('Failed to log frontend error:', error);
      return {
        success: false,
        message: 'Failed to log error',
      };
    }
  }

  /**
   * Map frontend severity to backend log level
   */
  private mapSeverityToLogLevel(severity: string): LogLevel {
    switch (severity) {
      case 'low':
        return LogLevel.INFO;
      case 'medium':
        return LogLevel.WARN;
      case 'high':
      case 'critical':
        return LogLevel.ERROR;
      default:
        return LogLevel.ERROR;
    }
  }

  /**
   * Map frontend category to backend log context
   */
  private mapCategoryToContext(category: string): LogContext {
    switch (category) {
      case 'api':
        return LogContext.API;
      case 'auth':
        return LogContext.AUTH;
      case 'component':
      case 'render':
        return LogContext.SYSTEM;
      case 'network':
        return LogContext.SYSTEM;
      default:
        return LogContext.SYSTEM;
    }
  }
}
