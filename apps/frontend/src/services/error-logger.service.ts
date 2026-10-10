import { API_CONFIG } from '@/config/api.config';
import axios from 'axios';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  API = 'api',
  COMPONENT = 'component',
  RENDER = 'render',
  NETWORK = 'network',
  AUTH = 'auth',
  UNKNOWN = 'unknown',
}

interface ErrorLogData {
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  url: string;
  userAgent: string;
  timestamp: Date;
  userId?: number;
  metadata?: Record<string, any>;
}

class ErrorLoggerService {
  private apiUrl: string;
  private queue: ErrorLogData[] = [];
  private isProcessing = false;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006/api';

    // Setup global error handlers
    if (typeof window !== 'undefined') {
      this.setupGlobalHandlers();
    }
  }

  /**
   * Setup global error handlers for unhandled errors
   */
  private setupGlobalHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.UNKNOWN,
        metadata: {
          reason: event.reason,
          promise: event.promise,
        },
      });
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.UNKNOWN,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });
  }

  /**
   * Log an error to the backend
   */
  async logError(data: {
    message: string;
    stack?: string;
    severity: ErrorSeverity;
    category: ErrorCategory;
    userId?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (typeof window === 'undefined') return; // Skip on server-side

    const errorLog: ErrorLogData = {
      ...data,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
    };

    // Add to queue
    this.queue.push(errorLog);

    // Process queue
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process error queue and send to backend
   */
  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    const errorLog = this.queue.shift();
    if (!errorLog) return;

    try {
      await axios.post(`${this.apiUrl}/frontend-errors`, errorLog, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Failed to send error log - store in localStorage for retry
      this.storeFailedLog(errorLog);
    }

    // Process next item
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Store failed logs in localStorage for later retry
   */
  private storeFailedLog(errorLog: ErrorLogData) {
    try {
      const stored = localStorage.getItem('failed_error_logs');
      const logs = stored ? JSON.parse(stored) : [];
      logs.push(errorLog);

      // Keep only last 50 failed logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }

      localStorage.setItem('failed_error_logs', JSON.stringify(logs));
    } catch (e) {
      // localStorage might be full or disabled
      console.error('Failed to store error log', e);
    }
  }

  /**
   * Retry sending failed logs from localStorage
   */
  async retryFailedLogs() {
    try {
      const stored = localStorage.getItem('failed_error_logs');
      if (!stored) return;

      const logs: ErrorLogData[] = JSON.parse(stored);

      for (const log of logs) {
        try {
          await axios.post(`${this.apiUrl}/frontend-errors`, log, {
            timeout: 5000,
          });
        } catch (error) {
          // Still failing, keep in storage
          break;
        }
      }

      // Clear successfully sent logs
      localStorage.removeItem('failed_error_logs');
    } catch (e) {
      console.error('Failed to retry error logs', e);
    }
  }

  /**
   * Log API error
   */
  logApiError(
    url: string,
    method: string,
    status: number,
    message: string,
    userId?: number,
  ) {
    this.logError({
      message: `API Error: ${method} ${url} - ${status} ${message}`,
      severity: status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      category: ErrorCategory.API,
      userId,
      metadata: {
        url,
        method,
        status,
      },
    });
  }

  /**
   * Log component error (from Error Boundary)
   */
  logComponentError(
    componentName: string,
    error: Error,
    errorInfo: any,
    userId?: number,
  ) {
    this.logError({
      message: `Component Error in ${componentName}: ${error.message}`,
      stack: error.stack,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.COMPONENT,
      userId,
      metadata: {
        componentName,
        componentStack: errorInfo?.componentStack,
      },
    });
  }

  /**
   * Log network error
   */
  logNetworkError(message: string, userId?: number) {
    this.logError({
      message: `Network Error: ${message}`,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.NETWORK,
      userId,
    });
  }

  /**
   * Log authentication error
   */
  logAuthError(message: string, userId?: number) {
    this.logError({
      message: `Auth Error: ${message}`,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.AUTH,
      userId,
    });
  }
}

// Singleton instance
export const errorLogger = new ErrorLoggerService();
