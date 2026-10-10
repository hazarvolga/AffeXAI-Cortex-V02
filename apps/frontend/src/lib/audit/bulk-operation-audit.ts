/**
 * Bulk Operation Audit Trail System
 * 
 * Comprehensive audit logging for compliance requirements including:
 * - GDPR compliance tracking
 * - Data processing activity logs
 * - User action auditing
 * - Compliance reporting
 * - Data retention management
 */

import { bulkOperationLogger, LogLevel, LogCategory } from '../logging/bulk-operation-logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum AuditEventType {
  // Data Processing Events
  DATA_IMPORT_STARTED = 'DATA_IMPORT_STARTED',
  DATA_IMPORT_COMPLETED = 'DATA_IMPORT_COMPLETED',
  DATA_EXPORT_STARTED = 'DATA_EXPORT_STARTED',
  DATA_EXPORT_COMPLETED = 'DATA_EXPORT_COMPLETED',
  DATA_VALIDATION_PERFORMED = 'DATA_VALIDATION_PERFORMED',
  
  // User Actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_ACCESS_GRANTED = 'USER_ACCESS_GRANTED',
  USER_ACCESS_DENIED = 'USER_ACCESS_DENIED',
  
  // Data Subject Rights (GDPR)
  DATA_ACCESS_REQUEST = 'DATA_ACCESS_REQUEST',
  DATA_DELETION_REQUEST = 'DATA_DELETION_REQUEST',
  DATA_PORTABILITY_REQUEST = 'DATA_PORTABILITY_REQUEST',
  DATA_RECTIFICATION_REQUEST = 'DATA_RECTIFICATION_REQUEST',
  CONSENT_GRANTED = 'CONSENT_GRANTED',
  CONSENT_WITHDRAWN = 'CONSENT_WITHDRAWN',
  
  // Security Events
  SECURITY_BREACH_DETECTED = 'SECURITY_BREACH_DETECTED',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  MALWARE_DETECTED = 'MALWARE_DETECTED',
  
  // System Events
  SYSTEM_CONFIGURATION_CHANGED = 'SYSTEM_CONFIGURATION_CHANGED',
  DATA_RETENTION_POLICY_APPLIED = 'DATA_RETENTION_POLICY_APPLIED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  BACKUP_RESTORED = 'BACKUP_RESTORED'
}

export enum DataProcessingLegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests'
}

export enum DataCategory {
  PERSONAL_IDENTIFIERS = 'personal_identifiers',
  CONTACT_INFORMATION = 'contact_information',
  DEMOGRAPHIC_DATA = 'demographic_data',
  BEHAVIORAL_DATA = 'behavioral_data',
  TECHNICAL_DATA = 'technical_data',
  SPECIAL_CATEGORY = 'special_category'
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId: string;
  userRole?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource: string;
  resourceId: string;
  action: string;
  details: Record<string, any>;
  dataCategories?: DataCategory[];
  legalBasis?: DataProcessingLegalBasis;
  consentId?: string;
  success: boolean;
  error?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  retentionPeriod?: number; // in days
  encrypted: boolean;
}

export interface DataProcessingActivity {
  id: string;
  timestamp: Date;
  controller: string;
  processor?: string;
  purpose: string;
  legalBasis: DataProcessingLegalBasis;
  dataCategories: DataCategory[];
  dataSubjects: string[];
  recipients?: string[];
  thirdCountryTransfers?: boolean;
  retentionPeriod: number;
  securityMeasures: string[];
  automatedDecisionMaking?: boolean;
  consentRequired: boolean;
  consentObtained?: boolean;
  relatedAuditEvents: string[];
}

export interface ComplianceReport {
  id: string;
  generatedAt: Date;
  reportType: 'gdpr' | 'audit_trail' | 'data_processing' | 'security';
  timeRange: { start: Date; end: Date };
  requestedBy: string;
  summary: {
    totalEvents: number;
    dataProcessingActivities: number;
    consentEvents: number;
    securityEvents: number;
    dataSubjectRequests: number;
  };
  findings: Array<{
    category: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    count: number;
    recommendations?: string[];
  }>;
  events: AuditEvent[];
  dataProcessingActivities: DataProcessingActivity[];
}

// ============================================================================
// Audit Trail Implementation
// ============================================================================

export class BulkOperationAuditTrail {
  private auditEvents: Map<string, AuditEvent> = new Map();
  private dataProcessingActivities: Map<string, DataProcessingActivity> = new Map();
  private encryptionKey: string = 'audit-encryption-key'; // In production, use proper key management

  /**
   * Log an audit event
   */
  logEvent(
    eventType: AuditEventType,
    userId: string,
    resource: string,
    resourceId: string,
    action: string,
    details: Record<string, any>,
    options: {
      userRole?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      dataCategories?: DataCategory[];
      legalBasis?: DataProcessingLegalBasis;
      consentId?: string;
      success?: boolean;
      error?: string;
      riskLevel?: 'low' | 'medium' | 'high' | 'critical';
      retentionPeriod?: number;
    } = {}
  ): string {
    const auditEvent: AuditEvent = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      eventType,
      userId,
      userRole: options.userRole,
      sessionId: options.sessionId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      resource,
      resourceId,
      action,
      details: this.encryptSensitiveData(details),
      dataCategories: options.dataCategories,
      legalBasis: options.legalBasis,
      consentId: options.consentId,
      success: options.success ?? true,
      error: options.error,
      riskLevel: options.riskLevel ?? 'low',
      retentionPeriod: options.retentionPeriod ?? 2555, // 7 years default
      encrypted: this.containsSensitiveData(details)
    };

    this.auditEvents.set(auditEvent.id, auditEvent);

    // Log to the main logging system
    bulkOperationLogger.log(
      auditEvent.success ? LogLevel.INFO : LogLevel.WARN,
      LogCategory.AUDIT,
      `Audit event: ${eventType}`,
      { userId, operation: action, sessionId: options.sessionId },
      {
        eventId: auditEvent.id,
        resource,
        resourceId,
        riskLevel: auditEvent.riskLevel,
        dataCategories: options.dataCategories,
        legalBasis: options.legalBasis
      }
    );

    return auditEvent.id;
  }

  /**
   * Log data processing activity
   */
  logDataProcessingActivity(
    controller: string,
    purpose: string,
    legalBasis: DataProcessingLegalBasis,
    dataCategories: DataCategory[],
    dataSubjects: string[],
    options: {
      processor?: string;
      recipients?: string[];
      thirdCountryTransfers?: boolean;
      retentionPeriod?: number;
      securityMeasures?: string[];
      automatedDecisionMaking?: boolean;
      consentRequired?: boolean;
      consentObtained?: boolean;
    } = {}
  ): string {
    const activity: DataProcessingActivity = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      controller,
      processor: options.processor,
      purpose,
      legalBasis,
      dataCategories,
      dataSubjects,
      recipients: options.recipients,
      thirdCountryTransfers: options.thirdCountryTransfers ?? false,
      retentionPeriod: options.retentionPeriod ?? 2555,
      securityMeasures: options.securityMeasures ?? ['encryption', 'access_control'],
      automatedDecisionMaking: options.automatedDecisionMaking ?? false,
      consentRequired: options.consentRequired ?? false,
      consentObtained: options.consentObtained,
      relatedAuditEvents: []
    };

    this.dataProcessingActivities.set(activity.id, activity);

    bulkOperationLogger.log(
      LogLevel.INFO,
      LogCategory.AUDIT,
      `Data processing activity logged: ${purpose}`,
      { userId: controller },
      {
        activityId: activity.id,
        legalBasis,
        dataCategories,
        dataSubjectCount: dataSubjects.length,
        consentRequired: activity.consentRequired
      }
    );

    return activity.id;
  }

  /**
   * Log bulk import audit event
   */
  logBulkImportAudit(
    userId: string,
    jobId: string,
    fileName: string,
    recordCount: number,
    validRecords: number,
    invalidRecords: number,
    options: {
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      legalBasis?: DataProcessingLegalBasis;
      consentId?: string;
    } = {}
  ): string {
    return this.logEvent(
      AuditEventType.DATA_IMPORT_COMPLETED,
      userId,
      'bulk_import',
      jobId,
      'import_subscribers',
      {
        fileName,
        totalRecords: recordCount,
        validRecords,
        invalidRecords,
        successRate: recordCount > 0 ? (validRecords / recordCount) * 100 : 0
      },
      {
        ...options,
        dataCategories: [DataCategory.CONTACT_INFORMATION, DataCategory.PERSONAL_IDENTIFIERS],
        riskLevel: recordCount > 10000 ? 'high' : recordCount > 1000 ? 'medium' : 'low'
      }
    );
  }

  /**
   * Log bulk export audit event
   */
  logBulkExportAudit(
    userId: string,
    jobId: string,
    recordCount: number,
    filters: Record<string, any>,
    options: {
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      legalBasis?: DataProcessingLegalBasis;
    } = {}
  ): string {
    return this.logEvent(
      AuditEventType.DATA_EXPORT_COMPLETED,
      userId,
      'bulk_export',
      jobId,
      'export_subscribers',
      {
        recordCount,
        filters,
        exportedFields: filters.fields || 'all'
      },
      {
        ...options,
        dataCategories: [DataCategory.CONTACT_INFORMATION, DataCategory.PERSONAL_IDENTIFIERS],
        riskLevel: recordCount > 10000 ? 'high' : recordCount > 1000 ? 'medium' : 'low'
      }
    );
  }

  /**
   * Log GDPR data subject request
   */
  logDataSubjectRequest(
    requestType: 'access' | 'deletion' | 'portability' | 'rectification',
    dataSubjectEmail: string,
    requestedBy: string,
    options: {
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      requestDetails?: Record<string, any>;
      success?: boolean;
      error?: string;
    } = {}
  ): string {
    const eventTypeMap = {
      access: AuditEventType.DATA_ACCESS_REQUEST,
      deletion: AuditEventType.DATA_DELETION_REQUEST,
      portability: AuditEventType.DATA_PORTABILITY_REQUEST,
      rectification: AuditEventType.DATA_RECTIFICATION_REQUEST
    };

    return this.logEvent(
      eventTypeMap[requestType],
      requestedBy,
      'data_subject_request',
      dataSubjectEmail,
      `${requestType}_request`,
      {
        dataSubjectEmail,
        requestType,
        requestDetails: options.requestDetails
      },
      {
        ...options,
        dataCategories: [DataCategory.PERSONAL_IDENTIFIERS, DataCategory.CONTACT_INFORMATION],
        legalBasis: DataProcessingLegalBasis.LEGAL_OBLIGATION,
        riskLevel: 'high'
      }
    );
  }

  /**
   * Log consent event
   */
  logConsentEvent(
    action: 'granted' | 'withdrawn',
    dataSubjectEmail: string,
    consentId: string,
    purpose: string,
    options: {
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      consentDetails?: Record<string, any>;
    } = {}
  ): string {
    return this.logEvent(
      action === 'granted' ? AuditEventType.CONSENT_GRANTED : AuditEventType.CONSENT_WITHDRAWN,
      dataSubjectEmail,
      'consent',
      consentId,
      `consent_${action}`,
      {
        dataSubjectEmail,
        purpose,
        consentDetails: options.consentDetails
      },
      {
        ...options,
        dataCategories: [DataCategory.CONTACT_INFORMATION],
        legalBasis: DataProcessingLegalBasis.CONSENT,
        consentId,
        riskLevel: 'medium'
      }
    );
  }

  /**
   * Get audit events by criteria
   */
  getAuditEvents(criteria: {
    eventType?: AuditEventType;
    userId?: string;
    resource?: string;
    startTime?: Date;
    endTime?: Date;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    success?: boolean;
    limit?: number;
  }): AuditEvent[] {
    let events = Array.from(this.auditEvents.values());

    // Apply filters
    if (criteria.eventType) {
      events = events.filter(e => e.eventType === criteria.eventType);
    }

    if (criteria.userId) {
      events = events.filter(e => e.userId === criteria.userId);
    }

    if (criteria.resource) {
      events = events.filter(e => e.resource === criteria.resource);
    }

    if (criteria.startTime) {
      events = events.filter(e => e.timestamp >= criteria.startTime!);
    }

    if (criteria.endTime) {
      events = events.filter(e => e.timestamp <= criteria.endTime!);
    }

    if (criteria.riskLevel) {
      events = events.filter(e => e.riskLevel === criteria.riskLevel);
    }

    if (criteria.success !== undefined) {
      events = events.filter(e => e.success === criteria.success);
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (criteria.limit) {
      events = events.slice(0, criteria.limit);
    }

    return events;
  }

  /**
   * Get data processing activities
   */
  getDataProcessingActivities(criteria: {
    controller?: string;
    legalBasis?: DataProcessingLegalBasis;
    dataCategory?: DataCategory;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): DataProcessingActivity[] {
    let activities = Array.from(this.dataProcessingActivities.values());

    // Apply filters
    if (criteria.controller) {
      activities = activities.filter(a => a.controller === criteria.controller);
    }

    if (criteria.legalBasis) {
      activities = activities.filter(a => a.legalBasis === criteria.legalBasis);
    }

    if (criteria.dataCategory) {
      activities = activities.filter(a => a.dataCategories.includes(criteria.dataCategory!));
    }

    if (criteria.startTime) {
      activities = activities.filter(a => a.timestamp >= criteria.startTime!);
    }

    if (criteria.endTime) {
      activities = activities.filter(a => a.timestamp <= criteria.endTime!);
    }

    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (criteria.limit) {
      activities = activities.slice(0, criteria.limit);
    }

    return activities;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(
    reportType: 'gdpr' | 'audit_trail' | 'data_processing' | 'security',
    timeRange: { start: Date; end: Date },
    requestedBy: string
  ): ComplianceReport {
    const events = this.getAuditEvents({
      startTime: timeRange.start,
      endTime: timeRange.end
    });

    const activities = this.getDataProcessingActivities({
      startTime: timeRange.start,
      endTime: timeRange.end
    });

    // Filter events by report type
    let filteredEvents = events;
    if (reportType === 'gdpr') {
      const gdprEventTypes = [
        AuditEventType.DATA_ACCESS_REQUEST,
        AuditEventType.DATA_DELETION_REQUEST,
        AuditEventType.DATA_PORTABILITY_REQUEST,
        AuditEventType.DATA_RECTIFICATION_REQUEST,
        AuditEventType.CONSENT_GRANTED,
        AuditEventType.CONSENT_WITHDRAWN
      ];
      filteredEvents = events.filter(e => gdprEventTypes.includes(e.eventType));
    } else if (reportType === 'security') {
      const securityEventTypes = [
        AuditEventType.SECURITY_BREACH_DETECTED,
        AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
        AuditEventType.MALWARE_DETECTED
      ];
      filteredEvents = events.filter(e => securityEventTypes.includes(e.eventType));
    }

    // Calculate summary statistics
    const consentEvents = events.filter(e => 
      e.eventType === AuditEventType.CONSENT_GRANTED || 
      e.eventType === AuditEventType.CONSENT_WITHDRAWN
    );

    const securityEvents = events.filter(e => 
      e.eventType === AuditEventType.SECURITY_BREACH_DETECTED ||
      e.eventType === AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT ||
      e.eventType === AuditEventType.MALWARE_DETECTED
    );

    const dataSubjectRequests = events.filter(e => 
      e.eventType === AuditEventType.DATA_ACCESS_REQUEST ||
      e.eventType === AuditEventType.DATA_DELETION_REQUEST ||
      e.eventType === AuditEventType.DATA_PORTABILITY_REQUEST ||
      e.eventType === AuditEventType.DATA_RECTIFICATION_REQUEST
    );

    // Generate findings
    const findings: ComplianceReport['findings'] = [];

    // Check for high-risk events
    const highRiskEvents = events.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical');
    if (highRiskEvents.length > 0) {
      findings.push({
        category: 'High Risk Events',
        severity: 'warning',
        message: `${highRiskEvents.length} high-risk events detected`,
        count: highRiskEvents.length,
        recommendations: ['Review high-risk events for compliance', 'Implement additional security measures']
      });
    }

    // Check for failed events
    const failedEvents = events.filter(e => !e.success);
    if (failedEvents.length > 0) {
      findings.push({
        category: 'Failed Operations',
        severity: 'error',
        message: `${failedEvents.length} operations failed`,
        count: failedEvents.length,
        recommendations: ['Investigate failed operations', 'Improve error handling']
      });
    }

    // Check consent compliance
    const consentRequiredActivities = activities.filter(a => a.consentRequired);
    const consentObtainedActivities = consentRequiredActivities.filter(a => a.consentObtained);
    if (consentRequiredActivities.length > consentObtainedActivities.length) {
      findings.push({
        category: 'Consent Compliance',
        severity: 'error',
        message: 'Some activities require consent but consent was not obtained',
        count: consentRequiredActivities.length - consentObtainedActivities.length,
        recommendations: ['Obtain required consent', 'Review consent management process']
      });
    }

    const report: ComplianceReport = {
      id: this.generateAuditId(),
      generatedAt: new Date(),
      reportType,
      timeRange,
      requestedBy,
      summary: {
        totalEvents: events.length,
        dataProcessingActivities: activities.length,
        consentEvents: consentEvents.length,
        securityEvents: securityEvents.length,
        dataSubjectRequests: dataSubjectRequests.length
      },
      findings,
      events: filteredEvents,
      dataProcessingActivities: activities
    };

    // Log report generation
    this.logEvent(
      AuditEventType.SYSTEM_CONFIGURATION_CHANGED,
      requestedBy,
      'compliance_report',
      report.id,
      'generate_report',
      {
        reportType,
        timeRange,
        eventCount: filteredEvents.length,
        findingCount: findings.length
      },
      {
        riskLevel: 'medium'
      }
    );

    return report;
  }

  /**
   * Apply data retention policy
   */
  applyDataRetentionPolicy(): number {
    const now = new Date();
    let deletedCount = 0;

    // Delete expired audit events
    for (const [id, event] of this.auditEvents.entries()) {
      const retentionEndDate = new Date(event.timestamp);
      retentionEndDate.setDate(retentionEndDate.getDate() + (event.retentionPeriod || 2555));

      if (now > retentionEndDate) {
        this.auditEvents.delete(id);
        deletedCount++;
      }
    }

    // Delete expired data processing activities
    for (const [id, activity] of this.dataProcessingActivities.entries()) {
      const retentionEndDate = new Date(activity.timestamp);
      retentionEndDate.setDate(retentionEndDate.getDate() + activity.retentionPeriod);

      if (now > retentionEndDate) {
        this.dataProcessingActivities.delete(id);
      }
    }

    if (deletedCount > 0) {
      bulkOperationLogger.log(
        LogLevel.INFO,
        LogCategory.AUDIT,
        `Data retention policy applied: ${deletedCount} records deleted`,
        { userId: 'system' },
        { deletedCount, retentionPolicyDate: now }
      );
    }

    return deletedCount;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private containsSensitiveData(data: Record<string, any>): boolean {
    const sensitiveKeys = ['email', 'phone', 'name', 'address', 'ssn', 'creditCard'];
    return Object.keys(data).some(key => 
      sensitiveKeys.some(sensitiveKey => 
        key.toLowerCase().includes(sensitiveKey.toLowerCase())
      )
    );
  }

  private encryptSensitiveData(data: Record<string, any>): Record<string, any> {
    if (!this.containsSensitiveData(data)) {
      return data;
    }

    // In a real implementation, use proper encryption
    // For now, just mark sensitive fields as encrypted
    const encrypted = { ...data };
    const sensitiveKeys = ['email', 'phone', 'name', 'address', 'ssn', 'creditCard'];

    for (const [key, value] of Object.entries(encrypted)) {
      if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
        encrypted[key] = `[ENCRYPTED:${typeof value}]`;
      }
    }

    return encrypted;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const bulkOperationAudit = new BulkOperationAuditTrail();
export default bulkOperationAudit;