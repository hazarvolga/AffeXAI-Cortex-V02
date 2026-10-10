import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { SubscriberService } from '../subscriber.service';
import { GroupService } from '../group.service';
import { SegmentService } from '../segment.service';
import { AdvancedEmailValidationService } from './advanced-email-validation.service';
import { ImportResult, ImportResultStatus } from '../entities/import-result.entity';
import { ImportJob } from '../entities/import-job.entity';
import { Subscriber } from '../entities/subscriber.entity';
import { CreateSubscriberDto } from '../dto/create-subscriber.dto';
import { UpdateSubscriberDto } from '../dto/update-subscriber.dto';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface ImportIntegrationOptions {
  groupIds?: string[];
  segmentIds?: string[];
  duplicateHandling: 'skip' | 'update' | 'replace';
  validationThreshold: number;
  columnMapping: Record<string, string>;
}

export interface SubscriberImportResult {
  success: boolean;
  subscriberId?: string;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  error?: string;
}

export interface BatchImportSummary {
  totalProcessed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

@Injectable()
export class ImportIntegrationService {
  private readonly logger = new Logger(ImportIntegrationService.name);

  constructor(
    @InjectRepository(ImportResult)
    private readonly importResultRepository: Repository<ImportResult>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepository: Repository<Subscriber>,
    private readonly subscriberService: SubscriberService,
    private readonly groupService: GroupService,
    private readonly segmentService: SegmentService,
    private readonly advancedEmailValidationService: AdvancedEmailValidationService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Process validated import results and create/update subscribers
   */
  async processImportResults(
    jobId: string,
    options: ImportIntegrationOptions,
    tenantId: string,
  ): Promise<BatchImportSummary> {
    this.logger.log(`Processing import results for job ${jobId} (Tenant: ${tenantId})`);

    // Run within tenant context for SubscriberService
    return this.tenantService.runWithTenant({ tenantId }, async () => {
      const summary: BatchImportSummary = {
        totalProcessed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors: []
      };

      try {
        // Get all valid and risky import results for the job
        const importResults = await this.importResultRepository.find({
          where: {
            importJobId: jobId,
            status: In([ImportResultStatus.VALID, ImportResultStatus.RISKY]),
            tenantId,
          },
          order: { rowNumber: 'ASC' }
        });

        this.logger.log(`Found ${importResults.length} results to process for job ${jobId}`);

        // Process results in batches to avoid memory issues
        const batchSize = 100;
        for (let i = 0; i < importResults.length; i += batchSize) {
          const batch = importResults.slice(i, i + batchSize);
          const batchSummary = await this.processBatch(batch, options); // tenantId removed (in context)

          // Merge batch summary into total summary
          summary.totalProcessed += batchSummary.totalProcessed;
          summary.created += batchSummary.created;
          summary.updated += batchSummary.updated;
          summary.skipped += batchSummary.skipped;
          summary.failed += batchSummary.failed;
          summary.errors.push(...batchSummary.errors);

          this.logger.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(importResults.length / batchSize)} for job ${jobId}`);
        }

        this.logger.log(`Import processing completed for job ${jobId}. Created: ${summary.created}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`);

        return summary;

      } catch (error) {
        this.logger.error(`Failed to process import results for job ${jobId}:`, error);
        summary.errors.push(`Processing failed: ${error.message}`);
        return summary;
      }
    });
  }

  /**
   * Process a batch of import results
   */
  private async processBatch(
    importResults: ImportResult[],
    options: ImportIntegrationOptions,
  ): Promise<BatchImportSummary> {
    const summary: BatchImportSummary = {
      totalProcessed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    for (const result of importResults) {
      try {
        const importResult = await this.processSubscriber(result, options);

        const tenantId = this.tenantService.getTenantId();
        // Update import result with subscriber info
        await this.importResultRepository.update({ id: result.id, tenantId }, {
          imported: importResult.success,
          subscriberId: importResult.subscriberId,
          error: importResult.error
        });

        // Update summary
        summary.totalProcessed++;
        switch (importResult.action) {
          case 'created':
            summary.created++;
            break;
          case 'updated':
            summary.updated++;
            break;
          case 'skipped':
            summary.skipped++;
            break;
          case 'failed':
            summary.failed++;
            if (importResult.error) {
              summary.errors.push(`Row ${result.rowNumber}: ${importResult.error}`);
            }
            break;
        }

      } catch (error) {
        this.logger.error(`Error processing import result ${result.id}:`, error);
        summary.totalProcessed++;
        summary.failed++;
        summary.errors.push(`Row ${result.rowNumber}: ${error.message}`);

        const tenantId = this.tenantService.getTenantId();
        // Update import result with error
        await this.importResultRepository.update({ id: result.id, tenantId }, {
          imported: false,
          error: error.message
        });
      }
    }

    return summary;
  }

  /**
   * Process a single subscriber from import result
   */
  private async processSubscriber(
    importResult: ImportResult,
    options: ImportIntegrationOptions,
  ): Promise<SubscriberImportResult> {
    const email = importResult.email;
    const originalData = importResult.originalData || {};
    const tenantId = this.tenantService.getTenantId(); // Get from context

    // Check if subscriber already exists
    // Note: Use subscriberService.findOneByEmail if available, or direct repo with manual tenantId
    // Since we are in runWithTenant, TypeORM scoping depends on how repo is used.
    // If Repository is tenant-aware via global filter, it's automatic.
    // If NOT, we must pass tenantId manually here for FINDING.
    // But subscriberService.create/update are refactored to NOT take tenantId.
    const existingSubscriber = await this.subscriberRepository.findOne({
      where: { email, tenantId }
    });

    if (existingSubscriber) {
      return await this.handleExistingSubscriber(
        existingSubscriber,
        originalData,
        options,
        importResult,
      );
    } else {
      return await this.createNewSubscriber(
        originalData,
        options,
        importResult,
      );
    }
  }

  /**
   * Handle existing subscriber based on duplicate handling strategy
   */
  private async handleExistingSubscriber(
    existingSubscriber: Subscriber,
    originalData: Record<string, any>,
    options: ImportIntegrationOptions,
    importResult: ImportResult,
  ): Promise<SubscriberImportResult> {
    switch (options.duplicateHandling) {
      case 'skip':
        return {
          success: true,
          subscriberId: existingSubscriber.id,
          action: 'skipped'
        };

      case 'update':
        return await this.updateExistingSubscriber(
          existingSubscriber,
          originalData,
          options,
          false // Don't replace all data
        );

      case 'replace':
        return await this.updateExistingSubscriber(
          existingSubscriber,
          originalData,
          options,
          true // Replace all data
        );

      default:
        return {
          success: false,
          action: 'failed',
          error: `Invalid duplicate handling strategy: ${options.duplicateHandling}`
        };
    }
  }

  /**
   * Update existing subscriber
   */
  private async updateExistingSubscriber(
    existingSubscriber: Subscriber,
    originalData: Record<string, any>,
    options: ImportIntegrationOptions,
    replaceAll: boolean
  ): Promise<SubscriberImportResult> {
    try {
      const updateData = this.mapDataToSubscriber(originalData, options.columnMapping);

      // If not replacing all, only update non-empty fields
      if (!replaceAll) {
        Object.keys(updateData).forEach(key => {
          if (!updateData[key] || updateData[key] === '') {
            delete updateData[key];
          }
        });
      }

      // Add groups and segments
      if (options.groupIds && options.groupIds.length > 0) {
        const existingGroups = existingSubscriber.groups || [];
        updateData.groups = [...new Set([...existingGroups, ...options.groupIds])];
      }

      if (options.segmentIds && options.segmentIds.length > 0) {
        const existingSegments = existingSubscriber.segments || [];
        updateData.segments = [...new Set([...existingSegments, ...options.segmentIds])];
      }

      const updatedSubscriber = await this.subscriberService.update(
        existingSubscriber.id,
        updateData as UpdateSubscriberDto,
      ); // Removed tenantId

      return {
        success: true,
        subscriberId: updatedSubscriber.id,
        action: 'updated'
      };

    } catch (error) {
      return {
        success: false,
        action: 'failed',
        error: `Failed to update subscriber: ${error.message}`
      };
    }
  }

  /**
   * Create new subscriber
   */
  private async createNewSubscriber(
    originalData: Record<string, any>,
    options: ImportIntegrationOptions,
    importResult: ImportResult,
  ): Promise<SubscriberImportResult> {
    try {
      const subscriberData = this.mapDataToSubscriber(originalData, options.columnMapping);

      // Add groups and segments
      if (options.groupIds && options.groupIds.length > 0) {
        subscriberData.groups = options.groupIds;
      }

      if (options.segmentIds && options.segmentIds.length > 0) {
        subscriberData.segments = options.segmentIds;
      }

      // Set status based on validation result
      subscriberData.status = this.determineSubscriberStatus(importResult);

      // Use validation result for mailerCheckResult
      subscriberData.mailerCheckResult = this.getMailerCheckResult(importResult);

      const newSubscriber = await this.subscriberService.create(
        subscriberData as CreateSubscriberDto,
      ); // Removed tenantId

      return {
        success: true,
        subscriberId: newSubscriber.id,
        action: 'created'
      };

    } catch (error) {
      return {
        success: false,
        action: 'failed',
        error: `Failed to create subscriber: ${error.message}`
      };
    }
  }

  /**
   * Map CSV data to subscriber fields based on column mapping
   */
  private mapDataToSubscriber(
    originalData: Record<string, any>,
    columnMapping: Record<string, string>
  ): Partial<CreateSubscriberDto> {
    const subscriberData: Partial<CreateSubscriberDto> = {};

    Object.entries(columnMapping).forEach(([csvColumn, subscriberField]) => {
      const value = originalData[csvColumn];
      if (value !== undefined && value !== null && value !== '') {
        // Handle specific field types
        switch (subscriberField) {
          case 'email':
            subscriberData.email = String(value).toLowerCase().trim();
            break;
          case 'firstName':
            subscriberData.firstName = String(value).trim();
            break;
          case 'lastName':
            subscriberData.lastName = String(value).trim();
            break;
          case 'company':
            subscriberData.company = String(value).trim();
            break;
          case 'phone':
            subscriberData.phone = String(value).trim();
            break;
          case 'location':
            subscriberData.location = String(value).trim();
            break;
          case 'customerStatus':
            subscriberData.customerStatus = String(value).trim();
            break;
          case 'subscriptionType':
            subscriberData.subscriptionType = String(value).trim();
            break;
          default:
            // Handle custom fields or ignore unknown fields
            break;
        }
      }
    });

    return subscriberData;
  }

  /**
   * Determine subscriber status based on import result
   */
  private determineSubscriberStatus(importResult: ImportResult): string {
    switch (importResult.status) {
      case ImportResultStatus.VALID:
        return 'active';
      case ImportResultStatus.RISKY:
        return 'pending'; // Require manual review for risky emails
      case ImportResultStatus.INVALID:
        return 'bounced';
      case ImportResultStatus.DUPLICATE:
        return 'active';
      default:
        return 'pending';
    }
  }

  /**
   * Get mailer check result from import validation
   */
  private getMailerCheckResult(importResult: ImportResult): string {
    if (importResult.validationDetails) {
      const details = importResult.validationDetails;

      if (!details.syntaxValid) return 'invalid_syntax';
      if (!details.domainExists) return 'domain_not_found';
      if (!details.mxRecordExists) return 'no_mx_record';
      if (details.isDisposable) return 'disposable';
      if (details.isRoleAccount) return 'role_account';
      if (details.hasTypos) return 'typo_detected';
      if (details.ipReputation === 'poor') return 'poor_reputation';

      return 'valid';
    }

    return importResult.status === ImportResultStatus.VALID ? 'valid' : 'risky';
  }

  /**
   * Validate groups and segments exist
   */
  async validateGroupsAndSegments(
    tenantId: string,
    groupIds?: string[],
    segmentIds?: string[]
  ): Promise<{ validGroups: string[]; validSegments: string[]; errors: string[] }> {
    const errors: string[] = [];
    const validGroups: string[] = [];
    const validSegments: string[] = [];

    // Validate groups
    if (groupIds && groupIds.length > 0) {
      for (const groupId of groupIds) {
        try {
          await this.groupService.findOne(groupId, tenantId);
          validGroups.push(groupId);
        } catch (error) {
          errors.push(`Group ${groupId} not found`);
        }
      }
    }

    // Validate segments
    if (segmentIds && segmentIds.length > 0) {
      for (const segmentId of segmentIds) {
        try {
          await this.segmentService.findOne(segmentId, tenantId);
          validSegments.push(segmentId);
        } catch (error) {
          errors.push(`Segment ${segmentId} not found`);
        }
      }
    }

    return { validGroups, validSegments, errors };
  }

  /**
   * Get import integration statistics
   */
  async getIntegrationStatistics(jobId: string): Promise<{
    totalResults: number;
    processedResults: number;
    createdSubscribers: number;
    updatedSubscribers: number;
    skippedResults: number;
    failedResults: number;
  }> {
    const tenantId = this.tenantService.getTenantId();
    const [totalResults, processedResults, createdSubscribers, updatedSubscribers] = await Promise.all([
      this.importResultRepository.count({ where: { importJobId: jobId, tenantId } }),
      this.importResultRepository.count({ where: { importJobId: jobId, imported: true, tenantId } }),
      this.importResultRepository.count({
        where: {
          importJobId: jobId,
          imported: true,
          subscriberId: Not(IsNull()),
          tenantId,
        }
      }),
      // This would need a more complex query to distinguish between created and updated
      0 // Placeholder for now
    ]);

    const skippedResults = await this.importResultRepository.count({
      where: {
        importJobId: jobId,
        status: ImportResultStatus.DUPLICATE,
        imported: false,
        tenantId,
      }
    });

    const failedResults = await this.importResultRepository.count({
      where: {
        importJobId: jobId,
        imported: false,
        error: Not(IsNull()),
        tenantId,
      }
    });

    return {
      totalResults,
      processedResults,
      createdSubscribers,
      updatedSubscribers,
      skippedResults,
      failedResults
    };
  }
}