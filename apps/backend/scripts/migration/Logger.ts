/**
 * Logger - Centralized logging for migration system
 * 
 * Provides structured logging with multiple levels and output targets.
 * Supports file and console output with timestamps and context.
 */

import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  VERBOSE = 'verbose',
  NORMAL = 'normal',
  QUIET = 'quiet'
}

export enum LogType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  timestamp: Date;
  type: LogType;
  component: string;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

export class Logger {
  private logLevel: LogLevel;
  private logFilePath: string | null;
  private logStream: fs.WriteStream | null = null;
  private logs: LogEntry[] = [];

  constructor(
    logLevel: LogLevel = LogLevel.NORMAL,
    logFilePath?: string
  ) {
    this.logLevel = logLevel;
    this.logFilePath = logFilePath || null;

    if (this.logFilePath) {
      this.initializeLogFile();
    }
  }

  /**
   * Initialize log file and create write stream
   */
  private initializeLogFile(): void {
    if (!this.logFilePath) return;

    try {
      // Ensure log directory exists
      const logDir = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Create write stream
      this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
      
      // Write header
      this.logStream.write(`\n${'='.repeat(80)}\n`);
      this.logStream.write(`Migration Log - ${new Date().toISOString()}\n`);
      this.logStream.write(`${'='.repeat(80)}\n\n`);
    } catch (error) {
      console.error('Failed to initialize log file:', error);
    }
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * Format log entry for console output
   */
  private formatConsoleMessage(entry: LogEntry): string {
    const timestamp = this.formatTimestamp(entry.timestamp);
    const icon = this.getLogIcon(entry.type);
    const color = this.getLogColor(entry.type);
    
    let message = `${color}${icon} [${timestamp}] [${entry.component}] ${entry.message}\x1b[0m`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      message += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }
    
    if (entry.error) {
      message += `\n  Error: ${entry.error.message}`;
      if (this.logLevel === LogLevel.VERBOSE && entry.error.stack) {
        message += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    return message;
  }

  /**
   * Format log entry for file output
   */
  private formatFileMessage(entry: LogEntry): string {
    const timestamp = this.formatTimestamp(entry.timestamp);
    let message = `[${timestamp}] [${entry.type}] [${entry.component}] ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      message += `\n  Context: ${JSON.stringify(entry.context)}`;
    }
    
    if (entry.error) {
      message += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    return message + '\n';
  }

  /**
   * Get icon for log type
   */
  private getLogIcon(type: LogType): string {
    switch (type) {
      case LogType.INFO: return 'ℹ';
      case LogType.SUCCESS: return '✓';
      case LogType.WARNING: return '⚠';
      case LogType.ERROR: return '✗';
      case LogType.DEBUG: return '🔍';
      default: return '•';
    }
  }

  /**
   * Get ANSI color code for log type
   */
  private getLogColor(type: LogType): string {
    switch (type) {
      case LogType.INFO: return '\x1b[36m';      // Cyan
      case LogType.SUCCESS: return '\x1b[32m';   // Green
      case LogType.WARNING: return '\x1b[33m';   // Yellow
      case LogType.ERROR: return '\x1b[31m';     // Red
      case LogType.DEBUG: return '\x1b[90m';     // Gray
      default: return '\x1b[0m';                 // Reset
    }
  }

  /**
   * Check if message should be logged based on log level
   */
  private shouldLog(type: LogType): boolean {
    if (this.logLevel === LogLevel.QUIET) {
      return type === LogType.ERROR;
    }
    
    if (this.logLevel === LogLevel.NORMAL) {
      return type !== LogType.DEBUG;
    }
    
    // VERBOSE: log everything
    return true;
  }

  /**
   * Write log entry
   */
  private writeLog(entry: LogEntry): void {
    // Store in memory
    this.logs.push(entry);

    // Check if should log
    if (!this.shouldLog(entry.type)) {
      return;
    }

    // Console output
    console.log(this.formatConsoleMessage(entry));

    // File output
    if (this.logStream) {
      this.logStream.write(this.formatFileMessage(entry));
    }
  }

  /**
   * Log info message
   */
  public info(component: string, message: string, context?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date(),
      type: LogType.INFO,
      component,
      message,
      context
    });
  }

  /**
   * Log success message
   */
  public success(component: string, message: string, context?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date(),
      type: LogType.SUCCESS,
      component,
      message,
      context
    });
  }

  /**
   * Log warning message
   */
  public warn(component: string, message: string, context?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date(),
      type: LogType.WARNING,
      component,
      message,
      context
    });
  }

  /**
   * Log error message
   */
  public error(component: string, message: string, error?: Error, context?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date(),
      type: LogType.ERROR,
      component,
      message,
      error,
      context
    });
  }

  /**
   * Log debug message (only in verbose mode)
   */
  public debug(component: string, message: string, context?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date(),
      type: LogType.DEBUG,
      component,
      message,
      context
    });
  }

  /**
   * Log section header
   */
  public section(title: string): void {
    const line = '─'.repeat(60);
    this.info('System', `\n${line}\n${title}\n${line}`);
  }

  /**
   * Log progress
   */
  public progress(component: string, current: number, total: number, item?: string): void {
    const percentage = Math.round((current / total) * 100);
    const message = item 
      ? `Progress: ${current}/${total} (${percentage}%) - ${item}`
      : `Progress: ${current}/${total} (${percentage}%)`;
    
    this.info(component, message);
  }

  /**
   * Get all logs
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by type
   */
  public getLogsByType(type: LogType): LogEntry[] {
    return this.logs.filter(log => log.type === type);
  }

  /**
   * Get logs by component
   */
  public getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component);
  }

  /**
   * Get error count
   */
  public getErrorCount(): number {
    return this.logs.filter(log => log.type === LogType.ERROR).length;
  }

  /**
   * Get warning count
   */
  public getWarningCount(): number {
    return this.logs.filter(log => log.type === LogType.WARNING).length;
  }

  /**
   * Generate summary statistics
   */
  public getSummary(): {
    total: number;
    byType: Record<LogType, number>;
    byComponent: Record<string, number>;
    errors: number;
    warnings: number;
  } {
    const byType: Record<LogType, number> = {
      [LogType.INFO]: 0,
      [LogType.SUCCESS]: 0,
      [LogType.WARNING]: 0,
      [LogType.ERROR]: 0,
      [LogType.DEBUG]: 0
    };

    const byComponent: Record<string, number> = {};

    this.logs.forEach(log => {
      byType[log.type]++;
      byComponent[log.component] = (byComponent[log.component] || 0) + 1;
    });

    return {
      total: this.logs.length,
      byType,
      byComponent,
      errors: byType[LogType.ERROR],
      warnings: byType[LogType.WARNING]
    };
  }

  /**
   * Close log file stream
   */
  public close(): void {
    if (this.logStream) {
      this.logStream.write(`\n${'='.repeat(80)}\n`);
      this.logStream.write(`Log ended - ${new Date().toISOString()}\n`);
      this.logStream.write(`${'='.repeat(80)}\n`);
      this.logStream.end();
      this.logStream = null;
    }
  }

  /**
   * Clear all logs (for testing)
   */
  public clear(): void {
    this.logs = [];
  }
}
