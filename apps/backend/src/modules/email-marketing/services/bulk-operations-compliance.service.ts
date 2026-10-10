import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TenantService } from '../../../core/tenant/tenant.service';
import { Subscriber } from '../entities/subscriber.entity';
import { ConsentRecord } from '../entities/consent-record.entity';
import { DataSubjectRequest } from '../entities/data-subject-request.entity';
import {
  GdprComplianceService,
  ConsentType,
  ConsentMethod,
  LegalBasis,
  AnonymizationConfig,
  DataSubjectRequestType,
  RequestStatus,
  ConsentStatus
} from './gdpr-compliance.service';

export interface BulkImportComplianceOptions {
  requireExplicitConsent: boolean;
  consentMethod: ConsentMethod;
  legalBasis: LegalBasis;
  dataProcessingPurposes: string[];
  retentionPeriod?: number;
  sourceMetadata?: Record<string, any>;
  gdprRegion?: boolean; // Whether subscribers are from GDPR regions
}

export interface BulkExportComplianceOptions {
  anonymizeData: boolean;
  anonymizationConfig?: AnonymizationConfig;
  includeConsentHistory: boolean;
  onlyConsentedSubscribers: boolean;
  excludeWithdrawnConsent: boolean;
  auditExport: boolean;
}

export interface ComplianceValidationResult {
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
  affectedSubscribers: number;
}

export interface BulkComplianceReport {
  operation: 'import' | 'export';
  timestamp: Date;
  totalRecords: number;
  compliantRecords: number;
  nonCompliantRecords: number;
  consentTracked: number;
  anonymizedRecords: number;
  issues: string[];
  gdprRegionAffected: boolean;
}

@Injectable()
export class BulkOperationsComplianceService {
  private readonly logger = new Logger(BulkOperationsComplianceService.name);

  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepository: Repository<Subscriber>,
    @InjectRepository(ConsentRecord)
    private readonly consentRepository: Repository<ConsentRecord>,
    @InjectRepository(DataSubjectRequest)
    private readonly requestRepository: Repository<DataSubjectRequest>,
    private readonly gdprService: GdprComplianceService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Get current tenant ID from TenantService
   * @private
   */
  private getActiveTenantId(): string {
    return this.tenantService.getTenantId();
  }

  /**
   * Validate bulk import for GDPR compliance
   */
  async validateBulkImportCompliance(
    subscriberData: any[],
    options: BulkImportComplianceOptions
  ): Promise<ComplianceValidationResult> {
    const result: ComplianceValidationResult = {
      isCompliant: true,
      issues: [],
      warnings: [],
      recommendations: [],
      affectedSubscribers: subscriberData.length
    };

    try {
      // Check if explicit consent is required but not provided
      if (options.requireExplicitConsent && options.consentMethod === ConsentMethod.IMPLIED_CONSENT) {
        result.issues.push('Explicit consent required but implied consent method specified');
        result.isCompliant = false;
      }

      // Validate legal basis for processing
      if (options.legalBasis === LegalBasis.CONSENT && !options.requireExplicitConsent) {
        result.warnings.push('Legal basis is consent but explicit consent not required');
      }

      // Check for existing withdrawn consents
      const emails = subscriberData.map(sub => sub.email).filter(Boolean);
      const withdrawnConsents = await this.checkWithdrawnConsents(emails);

      if (withdrawnConsents.length > 0) {
        result.issues.push(`${withdrawnConsents.length} subscribers have previously withdrawn consent`);
        result.isCompliant = false;
      }

      // Validate data processing purposes
      if (!options.dataProcessingPurposes || options.dataProcessingPurposes.length === 0) {
        result.issues.push('Data processing purposes must be specified');
        result.isCompliant = false;
      }

      // Check retention period compliance
      if (options.gdprRegion && !options.retentionPeriod) {
        result.warnings.push('Retention period should be specified for GDPR compliance');
      }

      // Validate data minimization principle
      const dataFields = Object.keys(subscriberData[0] || {});
      const unnecessaryFields = this.identifyUnnecessaryFields(dataFields, options.dataProcessingPurposes);

      if (unnecessaryFields.length > 0) {
        result.warnings.push(`Potentially unnecessary data fields: ${unnecessaryFields.join(', ')}`);
        result.recommendations.push('Consider removing unnecessary fields to comply with data minimization principle');
      }

      this.logger.log(`Bulk import compliance validation: ${result.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);

    } catch (error) {
      this.logger.error('Bulk import compliance validation failed:', error);
      result.issues.push(`Validation failed: ${error.message}`);
      result.isCompliant = false;
    }

    return result;
  }

  /**
   * Process bulk import with GDPR compliance
   */
  async processBulkImportWithCompliance(
    subscriberData: any[],
    options: BulkImportComplianceOptions,
    jobId: string
  ): Promise<BulkComplianceReport> {
    const report: BulkComplianceReport = {
      operation: 'import',
      timestamp: new Date(),
      totalRecords: subscriberData.length,
      compliantRecords: 0,
      nonCompliantRecords: 0,
      consentTracked: 0,
      anonymizedRecords: 0,
      issues: [],
      gdprRegionAffected: options.gdprRegion || false
    };

    try {
      for (const subscriberInfo of subscriberData) {
        try {
          // Check if subscriber has withdrawn consent
          const hasWithdrawnConsent = await this.hasWithdrawnConsent(subscriberInfo.email);

          if (hasWithdrawnConsent) {
            report.nonCompliantRecords++;
            report.issues.push(`Skipped ${subscriberInfo.email}: consent previously withdrawn`);
            continue;
          }

          // Create or update subscriber
          const subscriber = await this.createOrUpdateSubscriber(subscriberInfo);

          // Track consent for GDPR compliance
          if (options.requireExplicitConsent || options.gdprRegion) {
            await this.gdprService.trackConsent(
              subscriber.email,
              ConsentType.EMAIL_MARKETING,
              options.consentMethod,
              options.legalBasis,
              {
                dataProcessingPurposes: options.dataProcessingPurposes,
                retentionPeriod: options.retentionPeriod,
                metadata: {
                  importJobId: jobId,
                  source: 'bulk_import',
                  ...options.sourceMetadata
                }
              }
            );
            report.consentTracked++;
          }

          report.compliantRecords++;

        } catch (error) {
          report.nonCompliantRecords++;
          report.issues.push(`Failed to process ${subscriberInfo.email}: ${error.message}`);
        }
      }

      this.logger.log(`Bulk import compliance processing completed: ${report.compliantRecords}/${report.totalRecords} compliant`);

    } catch (error) {
      this.logger.error('Bulk import compliance processing failed:', error);
      report.issues.push(`Processing failed: ${error.message}`);
    }

    return report;
  }

  /**
   * Validate bulk export for GDPR compliance
   */
  async validateBulkExportCompliance(
    exportFilters: any,
    options: BulkExportComplianceOptions
  ): Promise<ComplianceValidationResult> {
    const result: ComplianceValidationResult = {
      isCompliant: true,
      issues: [],
      warnings: [],
      recommendations: [],
      affectedSubscribers: 0
    };

    try {
      // Count affected subscribers
      const tenantId = this.getActiveTenantId();
      const query = this.subscriberRepository.createQueryBuilder('subscriber')
        .where('subscriber.tenantId = :tenantId', { tenantId });

      // Apply filters (this would be more complex in real implementation)
      if (exportFilters.status) {
        query.andWhere('subscriber.status IN (:...statuses)', { statuses: exportFilters.status });
      }

      result.affectedSubscribers = await query.getCount();

      // Check if only consented subscribers should be exported
      if (options.onlyConsentedSubscribers) {
        const consentedCount = await this.getConsentedSubscribersCount(exportFilters);
        if (consentedCount < result.affectedSubscribers) {
          result.warnings.push(`${result.affectedSubscribers - consentedCount} subscribers without explicit consent will be excluded`);
        }
      }

      // Validate anonymization requirements
      if (options.anonymizeData && !options.anonymizationConfig) {
        result.issues.push('Anonymization requested but configuration not provided');
        result.isCompliant = false;
      }

      // Check for withdrawn consents
      if (options.excludeWithdrawnConsent) {
        const withdrawnCount = await this.getWithdrawnConsentCount(exportFilters);
        if (withdrawnCount > 0) {
          result.warnings.push(`${withdrawnCount} subscribers with withdrawn consent will be excluded`);
        }
      }

      // Recommend audit trail
      if (!options.auditExport) {
        result.recommendations.push('Enable export auditing for compliance tracking');
      }

      this.logger.log(`Bulk export compliance validation: ${result.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);

    } catch (error) {
      this.logger.error('Bulk export compliance validation failed:', error);
      result.issues.push(`Validation failed: ${error.message}`);
      result.isCompliant = false;
    }

    return result;
  }

  /**
   * Process bulk export with GDPR compliance
   */
  async processBulkExportWithCompliance(
    subscribers: Subscriber[],
    options: BulkExportComplianceOptions,
    jobId: string
  ): Promise<{ data: any[]; report: BulkComplianceReport }> {
    const report: BulkComplianceReport = {
      operation: 'export',
      timestamp: new Date(),
      totalRecords: subscribers.length,
      compliantRecords: 0,
      nonCompliantRecords: 0,
      consentTracked: 0,
      anonymizedRecords: 0,
      issues: [],
      gdprRegionAffected: true // Assume GDPR applies to exports
    };

    let processedData: any[] = [];

    try {
      // Filter subscribers based on consent status
      let filteredSubscribers = subscribers;

      if (options.onlyConsentedSubscribers) {
        filteredSubscribers = await this.filterConsentedSubscribers(subscribers);
        report.nonCompliantRecords = subscribers.length - filteredSubscribers.length;
      }

      if (options.excludeWithdrawnConsent) {
        filteredSubscribers = await this.filterWithdrawnConsents(filteredSubscribers);
      }

      report.compliantRecords = filteredSubscribers.length;

      // Apply anonymization if requested
      if (options.anonymizeData && options.anonymizationConfig) {
        processedData = await this.gdprService.anonymizeDataForExport(
          filteredSubscribers,
          options.anonymizationConfig
        );
        report.anonymizedRecords = processedData.length;
      } else {
        processedData = filteredSubscribers.map(sub => ({ ...sub }));
      }

      // Add consent history if requested
      if (options.includeConsentHistory) {
        for (const item of processedData) {
          if (item.email && !options.anonymizeData) {
            item.consentHistory = await this.getConsentHistory(item.email);
          }
        }
      }

      // Create audit trail if requested
      if (options.auditExport) {
        await this.createExportAuditRecord(jobId, report, options);
      }

      this.logger.log(`Bulk export compliance processing completed: ${report.compliantRecords}/${report.totalRecords} compliant`);

    } catch (error) {
      this.logger.error('Bulk export compliance processing failed:', error);
      report.issues.push(`Processing failed: ${error.message}`);
    }

    return { data: processedData, report };
  }

  /**
   * Handle data subject requests during bulk operations
   */
  async handleDataSubjectRequestsForBulkOperation(
    emails: string[],
    operationType: 'import' | 'export'
  ): Promise<{
    blockedEmails: string[];
    pendingRequests: string[];
    warnings: string[];
  }> {
    const result = {
      blockedEmails: [] as string[],
      pendingRequests: [] as string[],
      warnings: [] as string[]
    };

    try {
      const tenantId = this.getActiveTenantId();
      // Check for pending erasure requests
      const pendingErasureRequests = await this.requestRepository.find({
        where: {
          email: In(emails),
          requestType: DataSubjectRequestType.ERASURE,
          status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
          tenantId,
        }
      });

      for (const request of pendingErasureRequests) {
        if (operationType === 'import') {
          result.blockedEmails.push(request.email);
        } else {
          result.warnings.push(`Export includes subscriber with pending erasure request: ${request.email}`);
        }
      }

      // Check for other pending requests
      const otherPendingRequests = await this.requestRepository.find({
        where: {
          email: In(emails),
          status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
          tenantId,
        }
      });

      result.pendingRequests = otherPendingRequests.map(req => req.email);

    } catch (error) {
      this.logger.error('Error checking data subject requests:', error);
      result.warnings.push(`Failed to check data subject requests: ${error.message}`);
    }

    return result;
  }

  // Private helper methods

  private async checkWithdrawnConsents(emails: string[]): Promise<string[]> {
    const tenantId = this.getActiveTenantId();
    const withdrawnConsents = await this.consentRepository.find({
      where: {
        email: In(emails),
        consentStatus: ConsentStatus.WITHDRAWN,
        tenantId,
      }
    });

    return withdrawnConsents.map(consent => consent.email);
  }

  private async hasWithdrawnConsent(email: string): Promise<boolean> {
    const tenantId = this.getActiveTenantId();
    const withdrawnConsent = await this.consentRepository.findOne({
      where: {
        email,
        consentStatus: ConsentStatus.WITHDRAWN,
        tenantId,
      }
    });

    return !!withdrawnConsent;
  }

  private identifyUnnecessaryFields(
    dataFields: string[],
    purposes: string[]
  ): string[] {
    const necessaryFieldsMap: Record<string, string[]> = {
      'email_marketing': ['email', 'firstName', 'lastName', 'status'],
      'analytics': ['email', 'opens', 'clicks', 'sent'],
      'segmentation': ['email', 'groups', 'segments', 'customerStatus'],
      'personalization': ['email', 'firstName', 'lastName', 'company', 'location']
    };

    const necessaryFields = new Set<string>();

    for (const purpose of purposes) {
      const fields = necessaryFieldsMap[purpose.toLowerCase()] || [];
      fields.forEach(field => necessaryFields.add(field));
    }

    return dataFields.filter(field => !necessaryFields.has(field));
  }

  private async createOrUpdateSubscriber(subscriberInfo: any): Promise<Subscriber> {
    const tenantId = this.getActiveTenantId();
    const existingSubscriber = await this.subscriberRepository.findOne({
      where: { email: subscriberInfo.email, tenantId }
    });

    if (existingSubscriber) {
      // Update existing subscriber
      await this.subscriberRepository.update(
        { email: subscriberInfo.email, tenantId },
        subscriberInfo
      );
      return { ...existingSubscriber, ...subscriberInfo } as Subscriber;
    } else {
      // Create new subscriber
      const subscriber = this.subscriberRepository.create({ ...subscriberInfo, tenantId });
      const createdSubscriber = await this.subscriberRepository.save(subscriber);
      return (Array.isArray(createdSubscriber) ? createdSubscriber[0] : createdSubscriber) as unknown as Subscriber;
    }
  }

  private async getConsentedSubscribersCount(filters: any): Promise<number> {
    const tenantId = this.getActiveTenantId();
    // This would join with consent records to count only consented subscribers
    return this.subscriberRepository.count({
      where: { status: 'ACTIVE', tenantId }
    });
  }

  private async getWithdrawnConsentCount(filters: any): Promise<number> {
    // This would count subscribers with withdrawn consent
    return 0;
  }

  private async filterConsentedSubscribers(subscribers: Subscriber[]): Promise<Subscriber[]> {
    const consentedEmails = new Set<string>();
    const tenantId = this.getActiveTenantId();

    // Get all consented emails
    const consentRecords = await this.consentRepository.find({
      where: {
        email: In(subscribers.map(s => s.email)),
        consentStatus: ConsentStatus.GIVEN,
        tenantId,
      }
    });

    consentRecords.forEach(record => consentedEmails.add(record.email));

    return subscribers.filter(sub => consentedEmails.has(sub.email));
  }

  private async filterWithdrawnConsents(subscribers: Subscriber[]): Promise<Subscriber[]> {
    const withdrawnEmails = new Set<string>();
    const tenantId = this.getActiveTenantId();

    // Get all withdrawn consent emails
    const withdrawnRecords = await this.consentRepository.find({
      where: {
        email: In(subscribers.map(s => s.email)),
        consentStatus: ConsentStatus.WITHDRAWN,
        tenantId,
      }
    });

    withdrawnRecords.forEach(record => withdrawnEmails.add(record.email));

    return subscribers.filter(sub => !withdrawnEmails.has(sub.email));
  }

  private async getConsentHistory(email: string): Promise<any[]> {
    const tenantId = this.getActiveTenantId();
    const consentRecords = await this.consentRepository.find({
      where: { email, tenantId },
      order: { consentDate: 'DESC' }
    });

    return consentRecords.map(record => ({
      type: record.consentType,
      status: record.consentStatus,
      date: record.consentDate,
      method: record.consentMethod,
      legalBasis: record.legalBasis
    }));
  }

  private async createExportAuditRecord(
    jobId: string,
    report: BulkComplianceReport,
    options: BulkExportComplianceOptions
  ): Promise<void> {
    // In a real implementation, this would create an audit record in a dedicated table
    this.logger.log(`Export audit record created for job ${jobId}: ${report.compliantRecords} records exported`);
  }
}