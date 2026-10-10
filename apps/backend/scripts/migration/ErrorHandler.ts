/**
 * ErrorHandler - Centralized error handling for migration system
 * 
 * Categorizes errors and implements recovery strategies.
 * Integrates with Logger for comprehensive error tracking.
 */

import { Logger, LogType } from './Logger';

export enum ErrorCategory {
  CRITICAL = 'critical',
  PAGE_LEVEL = 'page-level',
  COMPONENT_LEVEL = 'component-level'
}

export enum ErrorAction {
  STOP = 'stop',
  SKIP_PAGE = 'skip-page',
  CONTINUE = 'continue'
}

export interface ErrorContext {
  component: string;
  page?: string;
  operation?: string;
  data?: Record<string, any>;
}

export interface MigrationError {
  timestamp: Date;
  category: ErrorCategory;
  component: string;
  page: string;
  operation: string;
  error: string;
  stack?: string;
  context?: Record<string, any>;
  action: ErrorAction;
}

export class ErrorHandler {
  private errors: MigrationError[] = [];
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Determine error category based on error type and context
   */
  private categorizeError(error: Error, context: ErrorContext): ErrorCategory {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Critical errors (stop migration)
    const criticalPatterns = [
      'database connection',
      'econnrefused',
      'api unavailable',
      'authentication failed',
      'invalid configuration',
      'source directory not found',
      'permission denied',
      'enotfound',
      'network error'
    ];

    if (criticalPatterns.some(pattern => 
      errorMessage.includes(pattern) || errorName.includes(pattern)
    )) {
      return ErrorCategory.CRITICAL;
    }

    // Page-level errors (skip page, continue)
    const pageLevelPatterns = [
      'invalid html',
      'template not found',
      'page creation failed',
      'slug already exists',
      'invalid page data',
      'parsing error'
    ];

    if (pageLevelPatterns.some(pattern => 
      errorMessage.includes(pattern) || errorName.includes(pattern)
    )) {
      return ErrorCategory.PAGE_LEVEL;
    }

    // Component-level errors (log warning, continue)
    return ErrorCategory.COMPONENT_LEVEL;
  }

  /**
   * Determine action based on error category
   */
  private determineAction(category: ErrorCategory): ErrorAction {
    switch (category) {
      case ErrorCategory.CRITICAL:
        return ErrorAction.STOP;
      case ErrorCategory.PAGE_LEVEL:
        return ErrorAction.SKIP_PAGE;
      case ErrorCategory.COMPONENT_LEVEL:
        return ErrorAction.CONTINUE;
      default:
        return ErrorAction.CONTINUE;
    }
  }

  /**
   * Handle error and return appropriate action
   */
  public handleError(error: Error, context: ErrorContext): ErrorAction {
    const category = this.categorizeError(error, context);
    const action = this.determineAction(category);

    // Create migration error record
    const migrationError: MigrationError = {
      timestamp: new Date(),
      category,
      component: context.component,
      page: context.page || 'unknown',
      operation: context.operation || 'unknown',
      error: error.message,
      stack: error.stack,
      context: context.data,
      action
    };

    // Store error
    this.errors.push(migrationError);

    // Log based on category
    switch (category) {
      case ErrorCategory.CRITICAL:
        this.logger.error(
          context.component,
          `CRITICAL ERROR: ${error.message}`,
          error,
          {
            page: context.page,
            operation: context.operation,
            action: 'STOPPING MIGRATION',
            ...context.data
          }
        );
        break;

      case ErrorCategory.PAGE_LEVEL:
        this.logger.error(
          context.component,
          `Page-level error: ${error.message}`,
          error,
          {
            page: context.page,
            operation: context.operation,
            action: 'SKIPPING PAGE',
            ...context.data
          }
        );
        break;

      case ErrorCategory.COMPONENT_LEVEL:
        this.logger.warn(
          context.component,
          `Component-level error: ${error.message}`,
          {
            page: context.page,
            operation: context.operation,
            action: 'CONTINUING',
            error: error.message,
            ...context.data
          }
        );
        break;
    }

    return action;
  }

  /**
   * Check if error is critical
   */
  public isCritical(error: Error): boolean {
    const context: ErrorContext = { component: 'ErrorHandler' };
    return this.categorizeError(error, context) === ErrorCategory.CRITICAL;
  }

  /**
   * Check if error is page-level
   */
  public isPageLevel(error: Error): boolean {
    const context: ErrorContext = { component: 'ErrorHandler' };
    return this.categorizeError(error, context) === ErrorCategory.PAGE_LEVEL;
  }

  /**
   * Check if error is component-level
   */
  public isComponentLevel(error: Error): boolean {
    const context: ErrorContext = { component: 'ErrorHandler' };
    return this.categorizeError(error, context) === ErrorCategory.COMPONENT_LEVEL;
  }

  /**
   * Get all errors
   */
  public getErrors(): MigrationError[] {
    return [...this.errors];
  }

  /**
   * Get errors by category
   */
  public getErrorsByCategory(category: ErrorCategory): MigrationError[] {
    return this.errors.filter(err => err.category === category);
  }

  /**
   * Get errors by page
   */
  public getErrorsByPage(page: string): MigrationError[] {
    return this.errors.filter(err => err.page === page);
  }

  /**
   * Get errors by component
   */
  public getErrorsByComponent(component: string): MigrationError[] {
    return this.errors.filter(err => err.component === component);
  }

  /**
   * Get critical errors count
   */
  public getCriticalErrorCount(): number {
    return this.errors.filter(err => err.category === ErrorCategory.CRITICAL).length;
  }

  /**
   * Get page-level errors count
   */
  public getPageLevelErrorCount(): number {
    return this.errors.filter(err => err.category === ErrorCategory.PAGE_LEVEL).length;
  }

  /**
   * Get component-level errors count
   */
  public getComponentLevelErrorCount(): number {
    return this.errors.filter(err => err.category === ErrorCategory.COMPONENT_LEVEL).length;
  }

  /**
   * Check if there are any critical errors
   */
  public hasCriticalErrors(): boolean {
    return this.getCriticalErrorCount() > 0;
  }

  /**
   * Get error summary
   */
  public getSummary(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    byComponent: Record<string, number>;
    byPage: Record<string, number>;
    critical: number;
    pageLevel: number;
    componentLevel: number;
  } {
    const byCategory: Record<ErrorCategory, number> = {
      [ErrorCategory.CRITICAL]: 0,
      [ErrorCategory.PAGE_LEVEL]: 0,
      [ErrorCategory.COMPONENT_LEVEL]: 0
    };

    const byComponent: Record<string, number> = {};
    const byPage: Record<string, number> = {};

    this.errors.forEach(err => {
      byCategory[err.category]++;
      byComponent[err.component] = (byComponent[err.component] || 0) + 1;
      byPage[err.page] = (byPage[err.page] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byCategory,
      byComponent,
      byPage,
      critical: byCategory[ErrorCategory.CRITICAL],
      pageLevel: byCategory[ErrorCategory.PAGE_LEVEL],
      componentLevel: byCategory[ErrorCategory.COMPONENT_LEVEL]
    };
  }

  /**
   * Generate detailed error report
   */
  public generateErrorReport(): string {
    const summary = this.getSummary();
    let report = '\n' + '='.repeat(80) + '\n';
    report += 'ERROR REPORT\n';
    report += '='.repeat(80) + '\n\n';

    report += `Total Errors: ${summary.total}\n`;
    report += `  - Critical: ${summary.critical}\n`;
    report += `  - Page-level: ${summary.pageLevel}\n`;
    report += `  - Component-level: ${summary.componentLevel}\n\n`;

    if (summary.critical > 0) {
      report += 'CRITICAL ERRORS:\n';
      report += '-'.repeat(80) + '\n';
      this.getErrorsByCategory(ErrorCategory.CRITICAL).forEach((err, i) => {
        report += `${i + 1}. [${err.component}] ${err.error}\n`;
        report += `   Page: ${err.page}\n`;
        report += `   Operation: ${err.operation}\n`;
        if (err.context) {
          report += `   Context: ${JSON.stringify(err.context, null, 2)}\n`;
        }
        report += '\n';
      });
    }

    if (summary.pageLevel > 0) {
      report += 'PAGE-LEVEL ERRORS:\n';
      report += '-'.repeat(80) + '\n';
      this.getErrorsByCategory(ErrorCategory.PAGE_LEVEL).forEach((err, i) => {
        report += `${i + 1}. [${err.page}] ${err.error}\n`;
        report += `   Component: ${err.component}\n`;
        report += `   Operation: ${err.operation}\n`;
        report += '\n';
      });
    }

    if (summary.componentLevel > 0) {
      report += 'COMPONENT-LEVEL ERRORS:\n';
      report += '-'.repeat(80) + '\n';
      const componentErrors = this.getErrorsByCategory(ErrorCategory.COMPONENT_LEVEL);
      // Show first 10 only
      componentErrors.slice(0, 10).forEach((err, i) => {
        report += `${i + 1}. [${err.page}] ${err.error}\n`;
      });
      if (componentErrors.length > 10) {
        report += `... and ${componentErrors.length - 10} more\n`;
      }
      report += '\n';
    }

    report += '='.repeat(80) + '\n';
    return report;
  }

  /**
   * Clear all errors (for testing)
   */
  public clear(): void {
    this.errors = [];
  }

  /**
   * Wrap async function with error handling
   */
  public async wrapAsync<T>(
    fn: () => Promise<T>,
    context: ErrorContext
  ): Promise<{ success: boolean; data?: T; error?: Error; action?: ErrorAction }> {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const action = this.handleError(error as Error, context);
      return { success: false, error: error as Error, action };
    }
  }

  /**
   * Wrap sync function with error handling
   */
  public wrap<T>(
    fn: () => T,
    context: ErrorContext
  ): { success: boolean; data?: T; error?: Error; action?: ErrorAction } {
    try {
      const data = fn();
      return { success: true, data };
    } catch (error) {
      const action = this.handleError(error as Error, context);
      return { success: false, error: error as Error, action };
    }
  }
}
