/**
 * Bulk Operation Notification System
 * 
 * Handles user notifications for bulk import/export operations including:
 * - Email notifications for job completion/failure
 * - In-app notifications and alerts
 * - Detailed error logging and reporting
 * - User-friendly error messages and suggestions
 */

import { BulkOperationError, BulkOperationErrorType } from '../errors/bulk-operation-errors';

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum NotificationType {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info'
}

export enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app',
  PUSH = 'push',
  SMS = 'sms'
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  channels: NotificationChannel[];
  subject: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export interface NotificationContext {
  userId: string;
  jobId: string;
  jobType: 'import' | 'export';
  fileName?: string;
  recordCount?: number;
  successCount?: number;
  failureCount?: number;
  error?: BulkOperationError;
  completedAt?: Date;
  duration?: number;
}

export interface ErrorReport {
  id: string;
  jobId: string;
  jobType: 'import' | 'export';
  userId: string;
  error: BulkOperationError;
  context: any;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
  reportedBy: 'system' | 'user';
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  pushNotifications: boolean;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  notifyOnWarning: boolean;
  minimumJobSize: number; // Only notify for jobs with this many records or more
}

// ============================================================================
// Notification Templates
// ============================================================================

const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  // Import notifications
  IMPORT_SUCCESS: {
    id: 'IMPORT_SUCCESS',
    type: NotificationType.SUCCESS,
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    subject: 'Import completed successfully',
    message: 'Your subscriber import has completed successfully. {{successCount}} subscribers were imported from {{fileName}}.',
    actionUrl: '/admin/email-marketing/subscribers',
    actionText: 'View Subscribers'
  },

  IMPORT_PARTIAL_SUCCESS: {
    id: 'IMPORT_PARTIAL_SUCCESS',
    type: NotificationType.WARNING,
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    subject: 'Import completed with warnings',
    message: 'Your subscriber import has completed with some issues. {{successCount}} of {{recordCount}} subscribers were imported successfully. Please review the detailed report.',
    actionUrl: '/admin/email-marketing/import/{{jobId}}/results',
    actionText: 'View Report'
  },

  IMPORT_FAILED: {
    id: 'IMPORT_FAILED',
    type: NotificationType.ERROR,
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    subject: 'Import failed',
    message: 'Your subscriber import from {{fileName}} has failed. {{errorMessage}}',
    actionUrl: '/admin/email-marketing/import/{{jobId}}/results',
    actionText: 'View Details'
  },

  // Export notifications
  EXPORT_SUCCESS: {
    id: 'EXPORT_SUCCESS',
    type: NotificationType.SUCCESS,
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    subject: 'Export completed successfully',
    message: 'Your subscriber export has completed successfully. {{recordCount}} subscribers were exported.',
    actionUrl: '/admin/email-marketing/export/{{jobId}}/download',
    actionText: 'Download File'
  },

  EXPORT_FAILED: {
    id: 'EXPORT_FAILED',
    type: NotificationType.ERROR,
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    subject: 'Export failed',
    message: 'Your subscriber export has failed. {{errorMessage}}',
    actionUrl: '/admin/email-marketing/export/{{jobId}}/results',
    actionText: 'View Details'
  },

  // System notifications
  VALIDATION_SERVICE_DEGRADED: {
    id: 'VALIDATION_SERVICE_DEGRADED',
    type: NotificationType.WARNING,
    channels: [NotificationChannel.IN_APP],
    subject: 'Email validation service degraded',
    message: 'Email validation is currently running in degraded mode. Some validations may be less accurate.',
    actionUrl: '/admin/email-marketing/system-status',
    actionText: 'View Status'
  },

  SYSTEM_ERROR: {
    id: 'SYSTEM_ERROR',
    type: NotificationType.ERROR,
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    subject: 'System error occurred',
    message: 'A system error occurred during your bulk operation. Our team has been notified and will investigate.',
    actionUrl: '/admin/support',
    actionText: 'Contact Support'
  }
};

// ============================================================================
// Notification Service
// ============================================================================

export class BulkOperationNotificationService {
  private errorReports: Map<string, ErrorReport> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();

  /**
   * Send notification for job completion
   */
  async notifyJobCompletion(context: NotificationContext): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(context.userId);

      // Check if user wants notifications for this type of job
      if (!this.shouldNotify(context, preferences)) {
        return;
      }

      let templateId: string;

      if (context.error) {
        templateId = context.jobType === 'import' ? 'IMPORT_FAILED' : 'EXPORT_FAILED';
      } else if (context.failureCount && context.failureCount > 0) {
        templateId = 'IMPORT_PARTIAL_SUCCESS'; // Only imports can have partial success
      } else {
        templateId = context.jobType === 'import' ? 'IMPORT_SUCCESS' : 'EXPORT_SUCCESS';
      }

      await this.sendNotification(templateId, context, preferences);

      // Log the notification
      console.log(`[BulkOperationNotificationService] Sent ${templateId} notification to user ${context.userId}`);
    } catch (error) {
      console.error('[BulkOperationNotificationService] Failed to send job completion notification:', error);
    }
  }

  /**
   * Send notification for system errors
   */
  async notifySystemError(error: BulkOperationError, context: NotificationContext): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(context.userId);

      // Always notify for system errors regardless of preferences
      const notificationContext = { ...context, error };

      let templateId = 'SYSTEM_ERROR';

      // Use specific template for validation service issues
      if (error.type === BulkOperationErrorType.VALIDATION_SERVICE_UNAVAILABLE) {
        templateId = 'VALIDATION_SERVICE_DEGRADED';
      }

      await this.sendNotification(templateId, notificationContext, preferences);

      // Create error report
      await this.createErrorReport(error, notificationContext);

      console.log(`[BulkOperationNotificationService] Sent ${templateId} notification for system error`);
    } catch (notificationError) {
      console.error('[BulkOperationNotificationService] Failed to send system error notification:', notificationError);
    }
  }

  /**
   * Create detailed error report
   */
  async createErrorReport(error: BulkOperationError, context: NotificationContext): Promise<ErrorReport> {
    const report: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      jobId: context.jobId,
      jobType: context.jobType,
      userId: context.userId,
      error,
      context,
      timestamp: new Date(),
      resolved: false,
      reportedBy: 'system'
    };

    // Store the report
    this.errorReports.set(report.id, report);

    // Log detailed error information
    console.error('[BulkOperationNotificationService] Error report created:', {
      reportId: report.id,
      errorType: error.type,
      errorMessage: error.message,
      jobId: context.jobId,
      userId: context.userId,
      context: context
    });

    // Send to external error tracking service if available
    await this.sendToErrorTracking(report);

    return report;
  }

  /**
   * Get error reports for a user
   */
  async getErrorReports(userId: string, resolved?: boolean): Promise<ErrorReport[]> {
    const userReports = Array.from(this.errorReports.values())
      .filter(report => report.userId === userId);

    if (resolved !== undefined) {
      return userReports.filter(report => report.resolved === resolved);
    }

    return userReports;
  }

  /**
   * Mark error report as resolved
   */
  async resolveErrorReport(reportId: string, resolution: string): Promise<void> {
    const report = this.errorReports.get(reportId);
    if (report) {
      report.resolved = true;
      report.resolution = resolution;

      console.log(`[BulkOperationNotificationService] Error report ${reportId} resolved: ${resolution}`);
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    // Try to get from cache first
    let preferences = this.userPreferences.get(userId);

    if (!preferences) {
      // Load from API or use defaults
      preferences = await this.loadUserPreferences(userId);
      this.userPreferences.set(userId, preferences);
    }

    return preferences;
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    const currentPreferences = await this.getUserPreferences(userId);
    const updatedPreferences = { ...currentPreferences, ...preferences };

    this.userPreferences.set(userId, updatedPreferences);

    // Save to API
    await this.saveUserPreferences(userId, updatedPreferences);

    console.log(`[BulkOperationNotificationService] Updated preferences for user ${userId}`);
  }

  /**
   * Get user-friendly error suggestions
   */
  getErrorSuggestions(error: BulkOperationError): string[] {
    const suggestions: Partial<Record<BulkOperationErrorType, string[]>> = {
      [BulkOperationErrorType.FILE_INVALID_FORMAT]: [
        'Ensure your file is in CSV format',
        'Check that the file extension is .csv',
        'Try opening the file in a spreadsheet application and re-saving as CSV'
      ],

      [BulkOperationErrorType.FILE_TOO_LARGE]: [
        'Split your file into smaller chunks (recommended: under 10MB)',
        'Remove unnecessary columns to reduce file size',
        'Consider using the API for very large imports'
      ],

      [BulkOperationErrorType.VALIDATION_SERVICE_UNAVAILABLE]: [
        'Try again in a few minutes',
        'Check the system status page for updates',
        'Contact support if the issue persists'
      ],

      [BulkOperationErrorType.VALIDATION_RATE_LIMIT_EXCEEDED]: [
        'Wait a few minutes before trying again',
        'Consider upgrading your plan for higher limits',
        'Process smaller batches to stay within limits'
      ],

      [BulkOperationErrorType.NETWORK_ERROR]: [
        'Check your internet connection',
        'Try refreshing the page and attempting again',
        'Contact support if the problem continues'
      ],

      [BulkOperationErrorType.AUTHENTICATION_FAILED]: [
        'Log out and log back in',
        'Clear your browser cache and cookies',
        'Contact support if you continue to have access issues'
      ],

      [BulkOperationErrorType.PERMISSION_DENIED]: [
        'Contact your administrator to verify your permissions',
        'Ensure you have the necessary role to perform bulk operations',
        'Check if your account has the required subscription level'
      ],

      [BulkOperationErrorType.UNKNOWN_ERROR]: [
        'Try the operation again',
        'Check the system status page',
        'Contact support with the error details'
      ]
    };

    return suggestions[error.type] || [
      'Try the operation again',
      'Contact support if the problem persists'
    ];
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private shouldNotify(context: NotificationContext, preferences: NotificationPreferences): boolean {
    // Check if notifications are enabled
    if (!preferences.emailNotifications && !preferences.inAppNotifications) {
      return false;
    }

    // Check job size threshold
    if (context.recordCount && context.recordCount < preferences.minimumJobSize) {
      return false;
    }

    // Check notification type preferences
    if (context.error && !preferences.notifyOnFailure) {
      return false;
    }

    if (!context.error && context.failureCount && context.failureCount > 0 && !preferences.notifyOnWarning) {
      return false;
    }

    if (!context.error && (!context.failureCount || context.failureCount === 0) && !preferences.notifyOnSuccess) {
      return false;
    }

    return true;
  }

  private async sendNotification(
    templateId: string,
    context: NotificationContext,
    preferences: NotificationPreferences
  ): Promise<void> {
    const template = NOTIFICATION_TEMPLATES[templateId];
    if (!template) {
      console.error(`[BulkOperationNotificationService] Template not found: ${templateId}`);
      return;
    }

    // Render template with context
    const renderedSubject = this.renderTemplate(template.subject, context);
    const renderedMessage = this.renderTemplate(template.message, context);
    const renderedActionUrl = template.actionUrl ? this.renderTemplate(template.actionUrl, context) : undefined;

    // Send via enabled channels
    const promises: Promise<void>[] = [];

    if (preferences.emailNotifications && template.channels.includes(NotificationChannel.EMAIL)) {
      promises.push(this.sendEmailNotification(context.userId, renderedSubject, renderedMessage, renderedActionUrl, template.actionText));
    }

    if (preferences.inAppNotifications && template.channels.includes(NotificationChannel.IN_APP)) {
      promises.push(this.sendInAppNotification(context.userId, template.type, renderedSubject, renderedMessage, renderedActionUrl, template.actionText));
    }

    await Promise.allSettled(promises);
  }

  private renderTemplate(template: string, context: NotificationContext): string {
    let rendered = template;

    // Replace context variables
    rendered = rendered.replace(/\{\{userId\}\}/g, context.userId);
    rendered = rendered.replace(/\{\{jobId\}\}/g, context.jobId);
    rendered = rendered.replace(/\{\{jobType\}\}/g, context.jobType);
    rendered = rendered.replace(/\{\{fileName\}\}/g, context.fileName || 'file');
    rendered = rendered.replace(/\{\{recordCount\}\}/g, (context.recordCount || 0).toString());
    rendered = rendered.replace(/\{\{successCount\}\}/g, (context.successCount || 0).toString());
    rendered = rendered.replace(/\{\{failureCount\}\}/g, (context.failureCount || 0).toString());

    if (context.error) {
      rendered = rendered.replace(/\{\{errorMessage\}\}/g, context.error.message);
    }

    if (context.duration) {
      const minutes = Math.round(context.duration / 60000);
      rendered = rendered.replace(/\{\{duration\}\}/g, `${minutes} minute${minutes !== 1 ? 's' : ''}`);
    }

    return rendered;
  }

  private async sendEmailNotification(
    userId: string,
    subject: string,
    message: string,
    actionUrl?: string,
    actionText?: string
  ): Promise<void> {
    try {
      // This would integrate with your email service
      console.log(`[BulkOperationNotificationService] Sending email notification to user ${userId}:`, {
        subject,
        message,
        actionUrl,
        actionText
      });

      // Example integration with email service
      // await emailService.send({
      //   to: await this.getUserEmail(userId),
      //   subject,
      //   html: this.renderEmailTemplate(message, actionUrl, actionText)
      // });
    } catch (error) {
      console.error('[BulkOperationNotificationService] Failed to send email notification:', error);
    }
  }

  private async sendInAppNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    actionUrl?: string,
    actionText?: string
  ): Promise<void> {
    try {
      // This would integrate with your in-app notification system
      console.log(`[BulkOperationNotificationService] Sending in-app notification to user ${userId}:`, {
        type,
        title,
        message,
        actionUrl,
        actionText
      });

      // Example integration with notification system
      // await notificationService.create({
      //   userId,
      //   type,
      //   title,
      //   message,
      //   actionUrl,
      //   actionText,
      //   createdAt: new Date()
      // });
    } catch (error) {
      console.error('[BulkOperationNotificationService] Failed to send in-app notification:', error);
    }
  }

  private async loadUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // This would load from your API
      // const response = await httpClient.get(`/api/users/${userId}/notification-preferences`);
      // return response;

      // Return defaults for now
      return {
        userId,
        emailNotifications: true,
        inAppNotifications: true,
        pushNotifications: false,
        notifyOnSuccess: true,
        notifyOnFailure: true,
        notifyOnWarning: true,
        minimumJobSize: 100
      };
    } catch (error) {
      console.error('[BulkOperationNotificationService] Failed to load user preferences, using defaults:', error);

      return {
        userId,
        emailNotifications: true,
        inAppNotifications: true,
        pushNotifications: false,
        notifyOnSuccess: true,
        notifyOnFailure: true,
        notifyOnWarning: true,
        minimumJobSize: 100
      };
    }
  }

  private async saveUserPreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    try {
      // This would save to your API
      // await httpClient.put(`/api/users/${userId}/notification-preferences`, preferences);
      console.log(`[BulkOperationNotificationService] Saved preferences for user ${userId}`);
    } catch (error) {
      console.error('[BulkOperationNotificationService] Failed to save user preferences:', error);
    }
  }

  private async sendToErrorTracking(report: ErrorReport): Promise<void> {
    try {
      // This would integrate with error tracking service like Sentry
      console.log('[BulkOperationNotificationService] Sending error report to tracking service:', {
        reportId: report.id,
        errorType: report.error.type,
        jobId: report.jobId,
        userId: report.userId
      });

      // Example integration
      // await errorTrackingService.captureException(report.error, {
      //   tags: {
      //     jobType: report.jobType,
      //     errorType: report.error.type
      //   },
      //   user: { id: report.userId },
      //   extra: report.context
      // });
    } catch (error) {
      console.error('[BulkOperationNotificationService] Failed to send to error tracking:', error);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const bulkOperationNotificationService = new BulkOperationNotificationService();
export default bulkOperationNotificationService;