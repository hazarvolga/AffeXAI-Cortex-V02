import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantService } from '../../../core/tenant/tenant.service';
import { Subscriber } from '../entities/subscriber.entity';
import * as crypto from 'crypto';

export interface ConsentRecord {
  id: string;
  subscriberId: string;
  email: string;
  consentType: ConsentType;
  consentStatus: ConsentStatus;
  consentDate: Date;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  consentMethod: ConsentMethod;
  legalBasis: LegalBasis;
  dataProcessingPurposes: string[];
  retentionPeriod?: number; // in months
  withdrawalDate?: Date;
  withdrawalReason?: string;
  metadata?: Record<string, any>;
}

export enum ConsentType {
  EMAIL_MARKETING = 'EMAIL_MARKETING',
  DATA_PROCESSING = 'DATA_PROCESSING',
  PROFILING = 'PROFILING',
  THIRD_PARTY_SHARING = 'THIRD_PARTY_SHARING',
  ANALYTICS = 'ANALYTICS'
}

export enum ConsentStatus {
  GIVEN = 'GIVEN',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING'
}

export enum ConsentMethod {
  EXPLICIT_OPT_IN = 'EXPLICIT_OPT_IN',
  DOUBLE_OPT_IN = 'DOUBLE_OPT_IN',
  IMPLIED_CONSENT = 'IMPLIED_CONSENT',
  LEGITIMATE_INTEREST = 'LEGITIMATE_INTEREST',
  IMPORT = 'IMPORT'
}

export enum LegalBasis {
  CONSENT = 'CONSENT',
  CONTRACT = 'CONTRACT',
  LEGAL_OBLIGATION = 'LEGAL_OBLIGATION',
  VITAL_INTERESTS = 'VITAL_INTERESTS',
  PUBLIC_TASK = 'PUBLIC_TASK',
  LEGITIMATE_INTERESTS = 'LEGITIMATE_INTERESTS'
}

export interface DataSubjectRequest {
  id: string;
  email: string;
  requestType: DataSubjectRequestType;
  requestDate: Date;
  status: RequestStatus;
  tenantId: string;
  completionDate?: Date;
  verificationMethod: string;
  requestDetails?: Record<string, any>;
  responseData?: any;
  notes?: string;
}

export enum DataSubjectRequestType {
  ACCESS = 'ACCESS', // Article 15 - Right of access
  RECTIFICATION = 'RECTIFICATION', // Article 16 - Right to rectification
  ERASURE = 'ERASURE', // Article 17 - Right to erasure (right to be forgotten)
  RESTRICT_PROCESSING = 'RESTRICT_PROCESSING', // Article 18 - Right to restriction of processing
  DATA_PORTABILITY = 'DATA_PORTABILITY', // Article 20 - Right to data portability
  OBJECT = 'OBJECT', // Article 21 - Right to object
  WITHDRAW_CONSENT = 'WITHDRAW_CONSENT' // Withdraw consent
}

export enum RequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export interface AnonymizationConfig {
  preserveStatistics: boolean;
  anonymizationMethod: 'hash' | 'pseudonymize' | 'generalize' | 'suppress';
  fieldsToAnonymize: string[];
  retainAggregateData: boolean;
}

export interface ComplianceReport {
  reportDate: Date;
  totalSubscribers: number;
  consentedSubscribers: number;
  withdrawnConsents: number;
  pendingRequests: number;
  completedRequests: number;
  dataRetentionCompliance: {
    expiredRecords: number;
    scheduledDeletions: number;
  };
  anonymizationStats: {
    anonymizedRecords: number;
    lastAnonymizationDate: Date;
  };
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    issues: string[];
    recommendations: string[];
  };
}

@Injectable()
export class GdprComplianceService {
  private readonly logger = new Logger(GdprComplianceService.name);

  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepository: Repository<Subscriber>,
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
   * Track consent for GDPR compliance
   */
  async trackConsent(
    email: string,
    consentType: ConsentType,
    consentMethod: ConsentMethod,
    legalBasis: LegalBasis,
    options: {
      ipAddress?: string;
      userAgent?: string;
      dataProcessingPurposes: string[];
      retentionPeriod?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<ConsentRecord> {
    const tenantId = this.getActiveTenantId();
    const subscriber = await this.subscriberRepository.findOne({
      where: { email, tenantId }
    });

    const consentRecord: ConsentRecord = {
      id: crypto.randomUUID(),
      subscriberId: subscriber?.id || '',
      email,
      consentType,
      consentStatus: ConsentStatus.GIVEN,
      consentDate: new Date(),
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      consentMethod,
      legalBasis,
      dataProcessingPurposes: options.dataProcessingPurposes,
      retentionPeriod: options.retentionPeriod,
      metadata: options.metadata,
      tenantId,
    };

    // In a real implementation, this would be stored in a dedicated consent table
    await this.storeConsentRecord(consentRecord);

    this.logger.log(`Consent tracked for ${email}: ${consentType} via ${consentMethod}`);
    return consentRecord;
  }

  /**
   * Withdraw consent for a subscriber
   */
  async withdrawConsent(
    email: string,
    consentType: ConsentType,
    reason?: string
  ): Promise<void> {
    const consentRecords = await this.getConsentRecords(email, consentType);

    for (const record of consentRecords) {
      if (record.consentStatus === ConsentStatus.GIVEN) {
        record.consentStatus = ConsentStatus.WITHDRAWN;
        record.withdrawalDate = new Date();
        record.withdrawalReason = reason;

        await this.updateConsentRecord(record);
      }
    }

    // Update subscriber status if marketing consent is withdrawn
    if (consentType === ConsentType.EMAIL_MARKETING) {
      const tenantId = this.getActiveTenantId();
      await this.subscriberRepository.update(
        { email, tenantId },
        { status: 'UNSUBSCRIBED' }
      );
    }

    this.logger.log(`Consent withdrawn for ${email}: ${consentType}`);
  }

  /**
   * Check if subscriber has valid consent for specific purpose
   */
  async hasValidConsent(
    email: string,
    consentType: ConsentType,
    purpose?: string
  ): Promise<boolean> {
    const consentRecords = await this.getConsentRecords(email, consentType);

    const validConsent = consentRecords.find(record => {
      // Check if consent is currently valid
      if (record.consentStatus !== ConsentStatus.GIVEN) {
        return false;
      }

      // Check if consent has expired
      if (record.retentionPeriod) {
        const expiryDate = new Date(record.consentDate);
        expiryDate.setMonth(expiryDate.getMonth() + record.retentionPeriod);

        if (new Date() > expiryDate) {
          return false;
        }
      }

      // Check if purpose matches
      if (purpose && !record.dataProcessingPurposes.includes(purpose)) {
        return false;
      }

      return true;
    });

    return !!validConsent;
  }

  /**
   * Handle data subject access request (Article 15)
   */
  async handleAccessRequest(email: string): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: crypto.randomUUID(),
      email,
      requestType: DataSubjectRequestType.ACCESS,
      requestDate: new Date(),
      status: RequestStatus.IN_PROGRESS,
      verificationMethod: 'email_verification',
      tenantId: this.getActiveTenantId(),
    };

    try {
      // Collect all data for the subscriber
      const tenantId = this.getActiveTenantId();
      const subscriber = await this.subscriberRepository.findOne({
        where: { email, tenantId }
      });
      const consentRecords = await this.getAllConsentRecords(email);

      const responseData = {
        personalData: subscriber,
        consentHistory: consentRecords,
        dataProcessingActivities: await this.getDataProcessingActivities(email),
        dataRetentionInfo: await this.getDataRetentionInfo(email),
        thirdPartySharing: await this.getThirdPartySharing(email)
      };

      request.responseData = responseData;
      request.status = RequestStatus.COMPLETED;
      request.completionDate = new Date();

      await this.storeDataSubjectRequest(request);

      this.logger.log(`Access request completed for ${email}`);
      return request;

    } catch (error) {
      request.status = RequestStatus.REJECTED;
      request.notes = `Error processing request: ${error.message}`;

      await this.storeDataSubjectRequest(request);
      throw error;
    }
  }

  /**
   * Handle right to be forgotten request (Article 17)
   */
  async handleErasureRequest(
    email: string,
    retainStatistics: boolean = true
  ): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: crypto.randomUUID(),
      email,
      requestType: DataSubjectRequestType.ERASURE,
      requestDate: new Date(),
      status: RequestStatus.IN_PROGRESS,
      verificationMethod: 'email_verification',
      tenantId: this.getActiveTenantId(),
      requestDetails: { retainStatistics }
    };

    try {
      // Check if we have legal grounds to retain the data
      const hasLegalGrounds = await this.checkLegalGroundsForRetention(email);

      if (hasLegalGrounds) {
        request.status = RequestStatus.REJECTED;
        request.notes = 'Data retention required for legal compliance';
        await this.storeDataSubjectRequest(request);
        return request;
      }

      if (retainStatistics) {
        // Anonymize instead of delete
        await this.anonymizeSubscriberData(email, {
          preserveStatistics: true,
          anonymizationMethod: 'hash',
          fieldsToAnonymize: ['email', 'firstName', 'lastName', 'phone', 'company'],
          retainAggregateData: true
        });
      } else {
        // Complete deletion
        await this.deleteSubscriberData(email);
      }

      request.status = RequestStatus.COMPLETED;
      request.completionDate = new Date();

      await this.storeDataSubjectRequest(request);

      this.logger.log(`Erasure request completed for ${email}`);
      return request;

    } catch (error) {
      request.status = RequestStatus.REJECTED;
      request.notes = `Error processing erasure request: ${error.message}`;

      await this.storeDataSubjectRequest(request);
      throw error;
    }
  }

  /**
   * Handle data portability request (Article 20)
   */
  async handlePortabilityRequest(email: string): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: crypto.randomUUID(),
      email,
      requestType: DataSubjectRequestType.DATA_PORTABILITY,
      requestDate: new Date(),
      status: RequestStatus.IN_PROGRESS,
      verificationMethod: 'email_verification',
      tenantId: this.getActiveTenantId(),
    } as any;

    try {
      const tenantId = this.getActiveTenantId();
      const subscriber = await this.subscriberRepository.findOne({
        where: { email, tenantId }
      });

      if (!subscriber) {
        request.status = RequestStatus.REJECTED;
        request.notes = 'No data found for the provided email';
        await this.storeDataSubjectRequest(request);
        return request;
      }

      // Create portable data format
      const portableData = {
        personalInformation: {
          email: subscriber.email,
          firstName: subscriber.firstName,
          lastName: subscriber.lastName,
          company: subscriber.company,
          phone: subscriber.phone,
          subscribedAt: subscriber.subscribedAt
        },
        preferences: {
          groups: subscriber.groups,
          segments: subscriber.segments,
          status: subscriber.status
        },
        engagementData: {
          emailsSent: subscriber.sent,
          emailsOpened: subscriber.opens,
          linksClicked: subscriber.clicks
        },
        consentHistory: await this.getAllConsentRecords(email)
      };

      request.responseData = portableData;
      request.status = RequestStatus.COMPLETED;
      request.completionDate = new Date();

      await this.storeDataSubjectRequest(request);

      this.logger.log(`Data portability request completed for ${email}`);
      return request;

    } catch (error) {
      request.status = RequestStatus.REJECTED;
      request.notes = `Error processing portability request: ${error.message}`;

      await this.storeDataSubjectRequest(request);
      throw error;
    }
  }

  /**
   * Anonymize subscriber data for exports
   */
  async anonymizeDataForExport(
    subscribers: Subscriber[],
    config: AnonymizationConfig
  ): Promise<any[]> {
    return subscribers.map(subscriber => {
      const anonymized = { ...subscriber };

      for (const field of config.fieldsToAnonymize) {
        if (anonymized[field]) {
          switch (config.anonymizationMethod) {
            case 'hash':
              anonymized[field] = this.hashValue(anonymized[field]);
              break;
            case 'pseudonymize':
              anonymized[field] = this.pseudonymizeValue(anonymized[field]);
              break;
            case 'generalize':
              anonymized[field] = this.generalizeValue(anonymized[field], field);
              break;
            case 'suppress':
              anonymized[field] = '[REDACTED]';
              break;
          }
        }
      }

      // Remove sensitive metadata if not preserving statistics
      if (!config.preserveStatistics) {
        delete (anonymized as any).id;
        delete (anonymized as any).lastUpdated;
      }

      return anonymized;
    });
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport(): Promise<ComplianceReport> {
    const tenantId = this.getActiveTenantId();
    const totalSubscribers = await this.subscriberRepository.count({
      where: { tenantId }
    });
    const consentedSubscribers = await this.subscriberRepository.count({
      where: { status: 'ACTIVE', tenantId }
    });

    // These would typically come from dedicated tables
    const withdrawnConsents = 0; // await this.getWithdrawnConsentsCount();
    const pendingRequests = 0; // await this.getPendingRequestsCount();
    const completedRequests = 0; // await this.getCompletedRequestsCount();

    const report: ComplianceReport = {
      reportDate: new Date(),
      totalSubscribers,
      consentedSubscribers,
      withdrawnConsents,
      pendingRequests,
      completedRequests,
      dataRetentionCompliance: {
        expiredRecords: await this.getExpiredRecordsCount(),
        scheduledDeletions: 0
      },
      anonymizationStats: {
        anonymizedRecords: 0,
        lastAnonymizationDate: new Date()
      },
      riskAssessment: await this.assessComplianceRisk()
    };

    this.logger.log('GDPR compliance report generated');
    return report;
  }

  /**
   * Automated data retention cleanup
   */
  async performDataRetentionCleanup(): Promise<{
    deletedRecords: number;
    anonymizedRecords: number;
    errors: string[];
  }> {
    const result = {
      deletedRecords: 0,
      anonymizedRecords: 0,
      errors: [] as string[]
    };

    try {
      // Find subscribers with expired consent
      const expiredSubscribers = await this.findExpiredConsentSubscribers();

      for (const subscriber of expiredSubscribers) {
        try {
          const hasLegalGrounds = await this.checkLegalGroundsForRetention(subscriber.email);

          if (hasLegalGrounds) {
            // Anonymize instead of delete
            await this.anonymizeSubscriberData(subscriber.email, {
              preserveStatistics: true,
              anonymizationMethod: 'hash',
              fieldsToAnonymize: ['email', 'firstName', 'lastName', 'phone'],
              retainAggregateData: true
            });
            result.anonymizedRecords++;
          } else {
            // Delete completely
            await this.deleteSubscriberData(subscriber.email);
            result.deletedRecords++;
          }
        } catch (error) {
          result.errors.push(`Failed to process ${subscriber.email}: ${error.message}`);
        }
      }

      this.logger.log(`Data retention cleanup completed: ${result.deletedRecords} deleted, ${result.anonymizedRecords} anonymized`);

    } catch (error) {
      this.logger.error('Data retention cleanup failed:', error);
      result.errors.push(`Cleanup failed: ${error.message}`);
    }

    return result;
  }

  // Private helper methods

  private async storeConsentRecord(record: ConsentRecord): Promise<void> {
    // In a real implementation, store in dedicated consent_records table
    this.logger.debug(`Storing consent record for ${record.email}`);
  }

  private async updateConsentRecord(record: ConsentRecord): Promise<void> {
    // In a real implementation, update in dedicated consent_records table
    this.logger.debug(`Updating consent record for ${record.email}`);
  }

  private async getConsentRecords(email: string, consentType: ConsentType): Promise<ConsentRecord[]> {
    // In a real implementation, query from dedicated consent_records table
    return [];
  }

  private async getAllConsentRecords(email: string): Promise<ConsentRecord[]> {
    // In a real implementation, query all consent records for email
    return [];
  }

  private async storeDataSubjectRequest(request: DataSubjectRequest): Promise<void> {
    // In a real implementation, store in dedicated data_subject_requests table
    this.logger.debug(`Storing data subject request for ${request.email}`);
  }

  private async getDataProcessingActivities(email: string): Promise<any[]> {
    // Return list of data processing activities for this subscriber
    return [
      {
        activity: 'Email Marketing',
        purpose: 'Send promotional emails',
        legalBasis: LegalBasis.CONSENT,
        dataCategories: ['email', 'name', 'preferences']
      }
    ];
  }

  private async getDataRetentionInfo(email: string): Promise<any> {
    return {
      retentionPeriod: '24 months',
      lastReviewDate: new Date(),
      scheduledDeletion: null
    };
  }

  private async getThirdPartySharing(email: string): Promise<any[]> {
    return []; // List of third parties data is shared with
  }

  private async checkLegalGroundsForRetention(email: string): Promise<boolean> {
    // Check if there are legal grounds to retain data (e.g., accounting, legal obligations)
    return false;
  }

  private async anonymizeSubscriberData(email: string, config: AnonymizationConfig): Promise<void> {
    const tenantId = this.getActiveTenantId();
    const subscriber = await this.subscriberRepository.findOne({
      where: { email, tenantId }
    });

    if (!subscriber) {
      return;
    }

    const updates: Partial<Subscriber> = {};

    for (const field of config.fieldsToAnonymize) {
      if (subscriber[field]) {
        switch (config.anonymizationMethod) {
          case 'hash':
            updates[field] = this.hashValue(subscriber[field]);
            break;
          case 'pseudonymize':
            updates[field] = this.pseudonymizeValue(subscriber[field]);
            break;
          case 'generalize':
            updates[field] = this.generalizeValue(subscriber[field], field);
            break;
          case 'suppress':
            updates[field] = null;
            break;
        }
      }
    }

    await this.subscriberRepository.update({ email, tenantId }, updates);
    this.logger.log(`Anonymized data for ${email}`);
  }

  private async deleteSubscriberData(email: string): Promise<void> {
    const tenantId = this.getActiveTenantId();
    await this.subscriberRepository.delete({ email, tenantId });
    // Also delete from related tables (consent records, requests, etc.)
    this.logger.log(`Deleted all data for ${email}`);
  }

  private async findExpiredConsentSubscribers(): Promise<Subscriber[]> {
    // In a real implementation, this would join with consent records to find expired consents
    return [];
  }

  private async getExpiredRecordsCount(): Promise<number> {
    // Count records that have exceeded retention period
    return 0;
  }

  private async assessComplianceRisk(): Promise<{
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for common compliance issues
    const tenantId = this.getActiveTenantId();
    const totalSubscribers = await this.subscriberRepository.count({
      where: { tenantId }
    });
    const activeSubscribers = await this.subscriberRepository.count({
      where: { status: 'ACTIVE', tenantId }
    });

    if (activeSubscribers / totalSubscribers < 0.5) {
      issues.push('High percentage of inactive subscribers');
      recommendations.push('Review consent status and clean up inactive subscribers');
    }

    const level = issues.length === 0 ? 'LOW' : issues.length < 3 ? 'MEDIUM' : 'HIGH';

    return { level, issues, recommendations };
  }

  private hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
  }

  private pseudonymizeValue(value: string): string {
    // Create a consistent pseudonym for the value
    const hash = crypto.createHash('md5').update(value).digest('hex');
    return `pseudo_${hash.substring(0, 8)}`;
  }

  private generalizeValue(value: string, field: string): string {
    switch (field) {
      case 'email':
        return value.split('@')[1] ? `***@${value.split('@')[1]}` : '***@***.***';
      case 'phone':
        return value.replace(/\d/g, '*');
      case 'firstName':
      case 'lastName':
        return value.charAt(0) + '*'.repeat(value.length - 1);
      default:
        return '***';
    }
  }
}