/**
 * ReportGenerator - Generate migration reports
 * 
 * Creates comprehensive reports for migration results including:
 * - Migration summary
 * - Error details
 * - Media upload report
 * - Validation report
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './Logger';
import { ErrorHandler, MigrationError } from './ErrorHandler';
import { MediaReport } from './types';

export interface MigrationSummary {
  startTime: Date;
  endTime: Date;
  duration: number;
  totalPages: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  totalComponents: number;
  totalImages: number;
  errors: MigrationError[];
}

export interface ValidationIssue {
  page: string;
  component?: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  details?: Record<string, any>;
}

export interface ValidationReport {
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  issues: ValidationIssue[];
  pagesWithIssues: string[];
}

export class ReportGenerator {
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private outputDir: string;

  constructor(logger: Logger, errorHandler: ErrorHandler, outputDir: string = './logs') {
    this.logger = logger;
    this.errorHandler = errorHandler;
    this.outputDir = outputDir;

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Generate migration summary report
   */
  public generateMigrationSummary(summary: MigrationSummary): string {
    let report = '\n' + '='.repeat(80) + '\n';
    report += 'MIGRATION SUMMARY REPORT\n';
    report += '='.repeat(80) + '\n\n';

    // Time information
    report += 'TIME INFORMATION:\n';
    report += '-'.repeat(80) + '\n';
    report += `Start Time: ${summary.startTime.toISOString()}\n`;
    report += `End Time: ${summary.endTime.toISOString()}\n`;
    report += `Duration: ${this.formatDuration(summary.duration)}\n\n`;

    // Page statistics
    report += 'PAGE STATISTICS:\n';
    report += '-'.repeat(80) + '\n';
    report += `Total Pages: ${summary.totalPages}\n`;
    report += `  ✓ Successful: ${summary.successCount} (${Math.round((summary.successCount / summary.totalPages) * 100)}%)\n`;
    report += `  ✗ Failed: ${summary.failureCount} (${Math.round((summary.failureCount / summary.totalPages) * 100)}%)\n`;
    report += `  ⊘ Skipped: ${summary.skippedCount} (${Math.round((summary.skippedCount / summary.totalPages) * 100)}%)\n\n`;

    // Component statistics
    report += 'COMPONENT STATISTICS:\n';
    report += '-'.repeat(80) + '\n';
    report += `Total Components Created: ${summary.totalComponents}\n`;
    report += `Average Components per Page: ${Math.round(summary.totalComponents / summary.successCount) || 0}\n\n`;

    // Media statistics
    report += 'MEDIA STATISTICS:\n';
    report += '-'.repeat(80) + '\n';
    report += `Total Images Processed: ${summary.totalImages}\n\n`;

    // Error summary
    const errorSummary = this.errorHandler.getSummary();
    report += 'ERROR SUMMARY:\n';
    report += '-'.repeat(80) + '\n';
    report += `Total Errors: ${errorSummary.total}\n`;
    report += `  - Critical: ${errorSummary.critical}\n`;
    report += `  - Page-level: ${errorSummary.pageLevel}\n`;
    report += `  - Component-level: ${errorSummary.componentLevel}\n\n`;

    // Log summary
    const logSummary = this.logger.getSummary();
    report += 'LOG SUMMARY:\n';
    report += '-'.repeat(80) + '\n';
    report += `Total Log Entries: ${logSummary.total}\n`;
    report += `  - Info: ${logSummary.byType.INFO}\n`;
    report += `  - Success: ${logSummary.byType.SUCCESS}\n`;
    report += `  - Warning: ${logSummary.byType.WARNING}\n`;
    report += `  - Error: ${logSummary.byType.ERROR}\n`;
    report += `  - Debug: ${logSummary.byType.DEBUG}\n\n`;

    report += '='.repeat(80) + '\n';
    return report;
  }

  /**
   * Generate media upload report
   */
  public generateMediaReport(mediaReport: MediaReport): string {
    let report = '\n' + '='.repeat(80) + '\n';
    report += 'MEDIA UPLOAD REPORT\n';
    report += '='.repeat(80) + '\n\n';

    report += 'SUMMARY:\n';
    report += '-'.repeat(80) + '\n';
    report += `Total Images: ${mediaReport.totalImages}\n`;
    report += `  ✓ Uploaded: ${mediaReport.uploadedCount} (${Math.round((mediaReport.uploadedCount / mediaReport.totalImages) * 100)}%)\n`;
    report += `  ✗ Failed: ${mediaReport.failedCount} (${Math.round((mediaReport.failedCount / mediaReport.totalImages) * 100)}%)\n`;
    report += `  ⊘ Skipped: ${mediaReport.skippedCount} (${Math.round((mediaReport.skippedCount / mediaReport.totalImages) * 100)}%)\n\n`;

    if (mediaReport.failures.length > 0) {
      report += 'FAILED UPLOADS:\n';
      report += '-'.repeat(80) + '\n';
      mediaReport.failures.forEach((failure, i) => {
        report += `${i + 1}. ${failure.originalPath}\n`;
        report += `   Error: ${failure.error}\n\n`;
      });
    }

    report += 'URL MAPPINGS:\n';
    report += '-'.repeat(80) + '\n';
    const mappingEntries = Object.entries(mediaReport.mapping);
    if (mappingEntries.length > 0) {
      report += `Total Mappings: ${mappingEntries.length}\n\n`;
      // Show first 10 mappings
      mappingEntries.slice(0, 10).forEach(([oldUrl, newUrl]) => {
        report += `${oldUrl}\n  → ${newUrl}\n\n`;
      });
      if (mappingEntries.length > 10) {
        report += `... and ${mappingEntries.length - 10} more mappings\n\n`;
      }
    } else {
      report += 'No URL mappings created\n\n';
    }

    report += '='.repeat(80) + '\n';
    return report;
  }

  /**
   * Generate validation report
   */
  public generateValidationReport(validationReport: ValidationReport): string {
    let report = '\n' + '='.repeat(80) + '\n';
    report += 'VALIDATION REPORT\n';
    report += '='.repeat(80) + '\n\n';

    report += 'SUMMARY:\n';
    report += '-'.repeat(80) + '\n';
    report += `Total Issues: ${validationReport.totalIssues}\n`;
    report += `  - Errors: ${validationReport.errors}\n`;
    report += `  - Warnings: ${validationReport.warnings}\n`;
    report += `  - Info: ${validationReport.info}\n`;
    report += `Pages with Issues: ${validationReport.pagesWithIssues.length}\n\n`;

    if (validationReport.errors > 0) {
      report += 'ERRORS:\n';
      report += '-'.repeat(80) + '\n';
      const errors = validationReport.issues.filter(i => i.severity === 'error');
      errors.forEach((issue, i) => {
        report += `${i + 1}. [${issue.page}] ${issue.issue}\n`;
        if (issue.component) {
          report += `   Component: ${issue.component}\n`;
        }
        if (issue.details) {
          report += `   Details: ${JSON.stringify(issue.details, null, 2)}\n`;
        }
        report += '\n';
      });
    }

    if (validationReport.warnings > 0) {
      report += 'WARNINGS:\n';
      report += '-'.repeat(80) + '\n';
      const warnings = validationReport.issues.filter(i => i.severity === 'warning');
      // Show first 20 warnings
      warnings.slice(0, 20).forEach((issue, i) => {
        report += `${i + 1}. [${issue.page}] ${issue.issue}\n`;
        if (issue.component) {
          report += `   Component: ${issue.component}\n`;
        }
        report += '\n';
      });
      if (warnings.length > 20) {
        report += `... and ${warnings.length - 20} more warnings\n\n`;
      }
    }

    report += '='.repeat(80) + '\n';
    return report;
  }

  /**
   * Save report to file
   */
  private saveReport(filename: string, content: string): string {
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, content, 'utf-8');
    return filepath;
  }

  /**
   * Save report as JSON
   */
  private saveReportJSON(filename: string, data: any): string {
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    return filepath;
  }

  /**
   * Generate and save all reports
   */
  public generateAllReports(
    summary: MigrationSummary,
    mediaReport: MediaReport,
    validationReport?: ValidationReport
  ): {
    summaryPath: string;
    summaryJsonPath: string;
    errorPath: string;
    errorJsonPath: string;
    mediaPath: string;
    mediaJsonPath: string;
    validationPath?: string;
    validationJsonPath?: string;
  } {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

    // Migration summary
    const summaryReport = this.generateMigrationSummary(summary);
    const summaryPath = this.saveReport(`migration-summary-${timestamp}.txt`, summaryReport);
    const summaryJsonPath = this.saveReportJSON(`migration-summary-${timestamp}.json`, summary);

    // Error report
    const errorReport = this.errorHandler.generateErrorReport();
    const errorPath = this.saveReport(`migration-errors-${timestamp}.txt`, errorReport);
    const errorJsonPath = this.saveReportJSON(
      `migration-errors-${timestamp}.json`,
      this.errorHandler.getErrors()
    );

    // Media report
    const mediaReportText = this.generateMediaReport(mediaReport);
    const mediaPath = this.saveReport(`media-report-${timestamp}.txt`, mediaReportText);
    const mediaJsonPath = this.saveReportJSON(`media-report-${timestamp}.json`, mediaReport);

    // Validation report (if provided)
    let validationPath: string | undefined;
    let validationJsonPath: string | undefined;
    if (validationReport) {
      const validationReportText = this.generateValidationReport(validationReport);
      validationPath = this.saveReport(`validation-report-${timestamp}.txt`, validationReportText);
      validationJsonPath = this.saveReportJSON(
        `validation-report-${timestamp}.json`,
        validationReport
      );
    }

    this.logger.success('ReportGenerator', 'All reports generated successfully', {
      summaryPath,
      errorPath,
      mediaPath,
      validationPath
    });

    return {
      summaryPath,
      summaryJsonPath,
      errorPath,
      errorJsonPath,
      mediaPath,
      mediaJsonPath,
      validationPath,
      validationJsonPath
    };
  }

  /**
   * Generate quick summary for console output
   */
  public generateQuickSummary(summary: MigrationSummary): string {
    const successRate = Math.round((summary.successCount / summary.totalPages) * 100);
    const errorCount = this.errorHandler.getSummary().total;

    let output = '\n' + '═'.repeat(60) + '\n';
    output += '  MIGRATION COMPLETE\n';
    output += '═'.repeat(60) + '\n\n';
    output += `  Duration: ${this.formatDuration(summary.duration)}\n`;
    output += `  Pages: ${summary.successCount}/${summary.totalPages} (${successRate}%)\n`;
    output += `  Components: ${summary.totalComponents}\n`;
    output += `  Errors: ${errorCount}\n`;
    output += '\n' + '═'.repeat(60) + '\n';

    return output;
  }
}
