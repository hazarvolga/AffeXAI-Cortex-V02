/**
 * Bulk Operation Logging System
 * 
 * Comprehensive logging for bulk import/export operations including:
 * - Detailed operation logging with context
 * - Error tracking and categorization
 * - Performance metrics and monitoring
 * - Audit trail for compliance
 */

import { BulkOperationError, BulkOperationErrorType } from '../errors/bulk-operation-errors';

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export enum LogCategory {
  OPERATION = 'operation',
  VALIDATION = 'validation',
  PROCESSING = 'processing',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  AUDIT = 'audit',
  ERROR = 'error'
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context: LogContext;
  metadata?: Record<string, any>;
  duration?: number;
  error?: BulkOperationError;
}

export interface LogContext {
  userId: string;
  jobId?: string;
  jobType?: 'import' | 'export';
  operation?: string;
  batchIndex?: number;
  recordIndex?: number;
  fileName?: string;
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PerformanceMetrics {
  operationName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  recordsProcessed: number;
  throughput: number; // records per second
  memoryUsage?: number;
  cpuUsage?: number;
  errorCount: number;
  retryCount: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// Logger Implementation
// ============================================================================

export class BulkOperationLogger {
  private logs: Map<string, LogEntry> = new Map();
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private auditLogs: Map<string, AuditLogEntry> = new Map();
  private activeOperations: Map<string, { startTime: Date; context: LogContext }> = new Map();

  /**
   * Start tracking an operation
   */
  startOperation(operationId: string, operationName: string, context: LogContext): void {
    this.activeOperations.set(operationId, {
      startTime: new Date(),
      context
    });

    this.log(LogLevel.INFO, LogCategory.OPERATION, `Started operation: ${operationName}`, context, {
      operationId,
      operationName
    });
  }

  /**
   * End tracking an operation
   */
  endOperation(
    operationId: string, 
    operationName: string, 
    recordsProcessed: number = 0, 
    errorCount: number = 0,
    retryCount: number = 0
  ): PerformanceMetrics | null {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      this.log(LogLevel.WARN, LogCategory.OPERATION, `Attempted to end unknown operation: ${operationName}`, {
        userId: 'system'
      }, { operationId });
      return null;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - operation.startTime.getTime();
    const throughput = recordsProcessed > 0 ? (recordsProcessed / (duration / 1000)) : 0;

    const metrics: PerformanceMetrics = {
      operationName,
      startTime: operation.startTime,
      endTime,
      duration,
      recordsProcessed,
      throughput,
      errorCount,
      retryCount
    };

    this.performanceMetrics.set(operationId, metrics);
    this.activeOperations.delete(operationId);

    this.log(LogLevel.INFO, LogCategory.PERFORMANCE, `Completed operation: ${operationName}`, operation.context, {
      operationId,
      duration,
      recordsProcessed,
      throughput: Math.round(throughput * 100) / 100,
      errorCount,
      retryCount
    });

    return metrics;
  }

  /**
   * Log a general message
   */
  log(
    level: LogLevel, 
    category: LogCategory, 
    message: string, 
    context: LogContext, 
    metadata?: Record<string, any>,
    error?: BulkOperationError
  ): void {
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      category,
      message,
      context,
      metadata,
      error
    };

    this.logs.set(logEntry.id, logEntry);

    // Output to console based on level
    this.outputToConsole(logEntry);

    // Send to external logging service if configured
    this.sendToExternalLogger(logEntry);
  }

  /**
   * Log an error with full context
   */
  logError(error: BulkOperationError, context: LogContext, additionalInfo?: Record<string, any>): void {
    this.log(
      LogLevel.ERROR,
      LogCategory.ERROR,
      `Error occurred: ${error.message}`,
      context,
      {
        errorType: error.type,
        retryable: error.retryable,
        recoverable: error.recoverable,
        details: error.details,
        ...additionalInfo
      },
      error
    );

    // Create audit log for security-related errors
    if (this.isSecurityError(error)) {
      this.logAudit(
        context.userId,
        'SECURITY_ERROR',
        'bulk_operation',
        context.jobId || 'unknown',
        {
          errorType: error.type,
          message: error.message,
          operation: context.operation
        },
        context.ipAddress,
        context.userAgent,
        false,
        error.message
      );
    }
  }

  /**
   * Log validation results
   */
  logValidation(
    context: LogContext,
    totalRecords: number,
    validRecords: number,
    invalidRecords: number,
    riskyRecords: number,
    duration: number
  ): void {
    const validationRate = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 0;

    this.log(
      LogLevel.INFO,
      LogCategory.VALIDATION,
      `Validation completed for ${totalRecords} records`,
      context,
      {
        totalRecords,
        validRecords,
        invalidRecords,
        riskyRecords,
        validationRate: Math.round(validationRate * 100) / 100,
        duration,
        throughput: Math.round((totalRecords / (duration / 1000)) * 100) / 100
      }
    );
  }

  /**
   * Log batch processing results
   */
  logBatchProcessing(
    context: LogContext,
    batchIndex: number,
    batchSize: number,
    successCount: number,
    failureCount: number,
    duration: number
  ): void {
    const successRate = batchSize > 0 ? (successCount / batchSize) * 100 : 0;

    this.log(
      LogLevel.INFO,
      LogCategory.PROCESSING,
      `Batch ${batchIndex} processed: ${successCount}/${batchSize} successful`,
      { ...context, batchIndex },
      {
        batchSize,
        successCount,
        failureCount,
        successRate: Math.round(successRate * 100) / 100,
        duration,
        throughput: Math.round((batchSize / (duration / 1000)) * 100) / 100
      }
    );
  }

  /**
   * Log audit event
   */
  logAudit(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    error?: string
  ): void {
    const auditEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      success,
      error
    };

    this.auditLogs.set(auditEntry.id, auditEntry);

    this.log(
      success ? LogLevel.INFO : LogLevel.WARN,
      LogCategory.AUDIT,
      `Audit: ${action} on ${resource}/${resourceId}`,
      { userId, operation: action },
      {
        resource,
        resourceId,
        success,
        error,
        details
      }
    );
  }

  /**
   * Get logs by criteria
   */
  getLogs(criteria: {
    level?: LogLevel;
    category?: LogCategory;
    userId?: string;
    jobId?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = Array.from(this.logs.values());

    // Apply filters
    if (criteria.level) {
      filteredLogs = filteredLogs.filter(log => log.level === criteria.level);
    }

    if (criteria.category) {
      filteredLogs = filteredLogs.filter(log => log.category === criteria.category);
    }

    if (criteria.userId) {
      filteredLogs = filteredLogs.filter(log => log.context.userId === criteria.userId);
    }

    if (criteria.jobId) {
      filteredLogs = filteredLogs.filter(log => log.context.jobId === criteria.jobId);
    }

    if (criteria.startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= criteria.startTime!);
    }

    if (criteria.endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= criteria.endTime!);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (criteria.limit) {
      filteredLogs = filteredLogs.slice(0, criteria.limit);
    }

    return filteredLogs;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(operationName?: string): PerformanceMetrics[] {
    let metrics = Array.from(this.performanceMetrics.values());

    if (operationName) {
      metrics = metrics.filter(m => m.operationName === operationName);
    }

    return metrics.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * Get audit logs
   */
  getAuditLogs(criteria: {
    userId?: string;
    action?: string;
    resource?: string;
    startTime?: Date;
    endTime?: Date;
    success?: boolean;
    limit?: number;
  }): AuditLogEntry[] {
    let filteredLogs = Array.from(this.auditLogs.values());

    // Apply filters
    if (criteria.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === criteria.userId);
    }

    if (criteria.action) {
      filteredLogs = filteredLogs.filter(log => log.action === criteria.action);
    }

    if (criteria.resource) {
      filteredLogs = filteredLogs.filter(log => log.resource === criteria.resource);
    }

    if (criteria.startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= criteria.startTime!);
    }

    if (criteria.endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= criteria.endTime!);
    }

    if (criteria.success !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.success === criteria.success);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (criteria.limit) {
      filteredLogs = filteredLogs.slice(0, criteria.limit);
    }

    return filteredLogs;
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(timeRange?: { start: Date; end: Date }): {
    totalErrors: number;
    errorsByType: Record<BulkOperationErrorType, number>;
    errorsByCategory: Record<LogCategory, number>;
    retryableErrors: number;
    recoverableErrors: number;
  } {
    let errorLogs = this.getLogs({ level: LogLevel.ERROR });

    if (timeRange) {
      errorLogs = errorLogs.filter(log => 
        log.timestamp >= timeRange.start && log.timestamp <= timeRange.end
      );
    }

    const errorsByType: Record<BulkOperationErrorType, number> = {} as any;
    const errorsByCategory: Record<LogCategory, number> = {} as any;
    let retryableErrors = 0;
    let recoverableErrors = 0;

    errorLogs.forEach(log => {
      if (log.error) {
        errorsByType[log.error.type] = (errorsByType[log.error.type] || 0) + 1;
        
        if (log.error.retryable) retryableErrors++;
        if (log.error.recoverable) recoverableErrors++;
      }

      errorsByCategory[log.category] = (errorsByCategory[log.category] || 0) + 1;
    });

    return {
      totalErrors: errorLogs.length,
      errorsByType,
      errorsByCategory,
      retryableErrors,
      recoverableErrors
    };
  }

  /**
   * Clear old logs (for memory management)
   */
  clearOldLogs(olderThan: Date): number {
    const initialSize = this.logs.size;
    
    for (const [id, log] of this.logs.entries()) {
      if (log.timestamp < olderThan) {
        this.logs.delete(id);
      }
    }

    for (const [id, metrics] of this.performanceMetrics.entries()) {
      if (metrics.startTime < olderThan) {
        this.performanceMetrics.delete(id);
      }
    }

    for (const [id, audit] of this.auditLogs.entries()) {
      if (audit.timestamp < olderThan) {
        this.auditLogs.delete(id);
      }
    }

    const clearedCount = initialSize - this.logs.size;
    
    if (clearedCount > 0) {
      this.log(LogLevel.INFO, LogCategory.OPERATION, `Cleared ${clearedCount} old log entries`, {
        userId: 'system'
      }, { olderThan, clearedCount });
    }

    return clearedCount;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private outputToConsole(logEntry: LogEntry): void {
    const timestamp = logEntry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.category.toUpperCase()}]`;
    const context = `[User: ${logEntry.context.userId}${logEntry.context.jobId ? `, Job: ${logEntry.context.jobId}` : ''}]`;
    const message = `${prefix} ${context} ${logEntry.message}`;

    switch (logEntry.level) {
      case LogLevel.DEBUG:
        console.debug(message, logEntry.metadata);
        break;
      case LogLevel.INFO:
        console.log(message, logEntry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(message, logEntry.metadata);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, logEntry.metadata, logEntry.error);
        break;
    }
  }

  private async sendToExternalLogger(logEntry: LogEntry): Promise<void> {
    try {
      // This would integrate with external logging service like Winston, Pino, or cloud logging
      // Example: await externalLogger.log(logEntry);
      
      // For now, just indicate that we would send to external service
      if (logEntry.level === LogLevel.ERROR || logEntry.level === LogLevel.FATAL) {
        console.log(`[BulkOperationLogger] Would send error log to external service:`, {
          id: logEntry.id,
          level: logEntry.level,
          category: logEntry.category,
          userId: logEntry.context.userId,
          jobId: logEntry.context.jobId
        });
      }
    } catch (error) {
      console.error('[BulkOperationLogger] Failed to send log to external service:', error);
    }
  }

  private isSecurityError(error: BulkOperationError): boolean {
    const securityErrorTypes = [
      BulkOperationErrorType.AUTHENTICATION_FAILED,
      BulkOperationErrorType.PERMISSION_DENIED,
      BulkOperationErrorType.FILE_MALWARE_DETECTED
    ];

    return securityErrorTypes.includes(error.type);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const bulkOperationLogger = new BulkOperationLogger();
export default bulkOperationLogger;