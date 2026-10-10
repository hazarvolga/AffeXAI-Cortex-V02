import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ExportJob, ExportJobStatus } from '../entities/export-job.entity';
import { Subscriber } from '../entities/subscriber.entity';
import { Group } from '../entities/group.entity';
import { Segment } from '../entities/segment.entity';
import { SubscriberStatus } from '@affexai/shared-types';
import { ExportFilters, ExportOptions } from '../entities/export-job.entity';
import { BulkOperationsComplianceService, BulkExportComplianceOptions } from './bulk-operations-compliance.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TenantService } from '../../../core/tenant/tenant.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createObjectCsvWriter } from 'csv-writer';
import { Workbook } from 'exceljs';

export interface ExportJobData {
  jobId: string;
  filters: ExportFilters;
  options: ExportOptions;
}

@Injectable()
export class BulkExportService {
  private readonly logger = new Logger(BulkExportService.name);
  private readonly exportDir = path.join(process.cwd(), 'temp', 'exports');

  constructor(
    @InjectRepository(ExportJob)
    private readonly exportJobRepository: Repository<ExportJob>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepository: Repository<Subscriber>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Segment)
    private readonly segmentRepository: Repository<Segment>,
    private readonly complianceService: BulkOperationsComplianceService,
    @InjectQueue('export')
    private readonly exportQueue: Queue,
    private readonly tenantService: TenantService,
  ) {
    this.ensureExportDirectory();
  }

  /**
   * Get current tenant ID from TenantService
   * @private
   */
  private getActiveTenantId(): string {
    return this.tenantService.getTenantId();
  }

  private async ensureExportDirectory(): Promise<void> {
    try {
      await fs.access(this.exportDir);
    } catch {
      await fs.mkdir(this.exportDir, { recursive: true });
    }
  }

  /**
   * Create a new export job
   */
  async createExportJob(
    filters: ExportFilters,
    options: ExportOptions,
    tenantId: string,
    userId?: string,
  ): Promise<ExportJob> {
    try {
      // Validate filters and options
      await this.validateExportRequest(filters, options);

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `subscribers-export-${timestamp}.${options.format}`;
      const filePath = path.join(this.exportDir, fileName);

      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create export job
      const exportJob = this.exportJobRepository.create({
        fileName,
        filePath,
        status: ExportJobStatus.PENDING,
        filters,
        options,
        expiresAt,
        userId,
        tenantId,
        totalRecords: 0,
        processedRecords: 0,
        progressPercentage: 0,
      });

      const savedJob = await this.exportJobRepository.save(exportJob);

      // Add job to queue for processing
      await this.exportQueue.add('process-export', {
        jobId: savedJob.id,
        filters,
        options,
      } as ExportJobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.logger.log(`Created export job ${savedJob.id} for user ${userId}`);
      return savedJob;
    } catch (error) {
      this.logger.error(`Failed to create export job: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get export job status
   */
  async getExportStatus(jobId: string): Promise<ExportJob> {
    const tenantId = this.getActiveTenantId();
    const job = await this.exportJobRepository.findOne({
      where: { id: jobId, tenantId }
    });
    if (!job) {
      throw new NotFoundException(`Export job ${jobId} not found`);
    }
    return job;
  }

  /**
   * Build subscriber query with filters
   */
  async buildSubscriberQuery(filters: ExportFilters): Promise<SelectQueryBuilder<Subscriber>> {
    const query = this.subscriberRepository.createQueryBuilder('subscriber');

    // Base tenant filter
    query.andWhere('subscriber.tenantId = :tenantId', { tenantId: filters.tenantId });

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      query.andWhere('subscriber.status IN (:...statuses)', { statuses: filters.status });
    }

    // Filter by groups
    if (filters.groupIds && filters.groupIds.length > 0) {
      query.andWhere('JSON_OVERLAPS(subscriber.groups, :groupIds)', {
        groupIds: JSON.stringify(filters.groupIds),
      });
    }

    // Filter by segments
    if (filters.segmentIds && filters.segmentIds.length > 0) {
      query.andWhere('JSON_OVERLAPS(subscriber.segments, :segmentIds)', {
        segmentIds: JSON.stringify(filters.segmentIds),
      });
    }

    // Filter by date range
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        query.andWhere('subscriber.subscribedAt >= :startDate', {
          startDate: filters.dateRange.start,
        });
      }
      if (filters.dateRange.end) {
        query.andWhere('subscriber.subscribedAt <= :endDate', {
          endDate: filters.dateRange.end,
        });
      }
    }

    // Filter by validation status
    if (filters.validationStatus && filters.validationStatus.length > 0) {
      query.andWhere('subscriber.mailerCheckResult IN (:...validationStatuses)', {
        validationStatuses: filters.validationStatus,
      });
    }

    return query;
  }

  /**
   * Format subscriber data for export
   */
  async formatSubscriberData(
    subscribers: Subscriber[],
    options: ExportOptions,
  ): Promise<any[]> {
    const formattedData: any[] = [];

    for (const subscriber of subscribers) {
      const row: any = {};

      // Add selected fields
      for (const field of options.fields) {
        switch (field) {
          case 'email':
            row.email = subscriber.email;
            break;
          case 'firstName':
            row.firstName = subscriber.firstName || '';
            break;
          case 'lastName':
            row.lastName = subscriber.lastName || '';
            break;
          case 'company':
            row.company = subscriber.company || '';
            break;
          case 'phone':
            row.phone = subscriber.phone || '';
            break;
          case 'status':
            row.status = subscriber.status;
            break;
          case 'customerStatus':
            row.customerStatus = subscriber.customerStatus || '';
            break;
          case 'subscriptionType':
            row.subscriptionType = subscriber.subscriptionType || '';
            break;
          case 'location':
            row.location = subscriber.location || '';
            break;
          case 'sent':
            row.sent = subscriber.sent;
            break;
          case 'opens':
            row.opens = subscriber.opens;
            break;
          case 'clicks':
            row.clicks = subscriber.clicks;
            break;
          case 'subscribedAt':
            row.subscribedAt = subscriber.subscribedAt.toISOString();
            break;
          case 'lastUpdated':
            row.lastUpdated = subscriber.lastUpdated.toISOString();
            break;
          case 'groups':
            row.groups = Array.isArray(subscriber.groups)
              ? subscriber.groups.join(';')
              : '';
            break;
          case 'segments':
            row.segments = Array.isArray(subscriber.segments)
              ? subscriber.segments.join(';')
              : '';
            break;
          default:
            // Handle custom fields or metadata
            if (options.includeMetadata && field.startsWith('metadata.')) {
              const metadataKey = field.replace('metadata.', '');
              // Note: This would require a metadata column in the subscriber entity
              // For now, we'll skip unknown fields
            }
            break;
        }
      }

      formattedData.push(row);
    }

    return formattedData;
  }

  /**
   * Generate CSV file
   */
  async generateCsvFile(data: any[], filePath: string): Promise<void> {
    if (data.length === 0) {
      // Create empty file with headers
      const headers = ['email']; // Default header
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: headers.map(h => ({ id: h, title: h })),
      });
      await csvWriter.writeRecords([]);
      return;
    }

    const headers = Object.keys(data[0]);
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers.map(header => ({ id: header, title: header })),
    });

    await csvWriter.writeRecords(data);
  }

  /**
   * Generate Excel file
   */
  async generateExcelFile(data: any[], filePath: string): Promise<void> {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Subscribers');
    const headers = data.length > 0 ? Object.keys(data[0]) : ['email'];

    worksheet.columns = headers.map((header) => ({ header, key: header }));
    worksheet.addRows(data);
    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * Update export job progress
   */
  async updateExportProgress(
    jobId: string,
    processedRecords: number,
    totalRecords: number,
    status?: ExportJobStatus,
  ): Promise<void> {
    const progressPercentage = totalRecords > 0 ? (processedRecords / totalRecords) * 100 : 0;

    const updateData: Partial<ExportJob> = {
      processedRecords,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
    };

    if (status) {
      updateData.status = status;
      if (status === ExportJobStatus.COMPLETED || status === ExportJobStatus.FAILED) {
        updateData.completedAt = new Date();
      }
    }

    const tenantId = this.getActiveTenantId();
    await this.exportJobRepository.update({ id: jobId, tenantId }, updateData);
  }

  /**
   * Mark export job as failed
   */
  async markExportAsFailed(jobId: string, error: string): Promise<void> {
    const tenantId = this.getActiveTenantId();
    await this.exportJobRepository.update({ id: jobId, tenantId }, {
      status: ExportJobStatus.FAILED,
      error,
      completedAt: new Date(),
    });
  }

  /**
   * Get file size and update job
   */
  async updateFileSize(jobId: string, filePath: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      const tenantId = this.getActiveTenantId();
      await this.exportJobRepository.update({ id: jobId, tenantId }, {
        fileSizeBytes: stats.size,
      });
    } catch (error) {
      this.logger.warn(`Failed to get file size for ${filePath}: ${error.message}`);
    }
  }

  /**
   * Validate export request
   */
  private async validateExportRequest(
    filters: ExportFilters,
    options: ExportOptions,
  ): Promise<void> {
    // Validate format
    if (!['csv', 'xlsx'].includes(options.format)) {
      throw new BadRequestException('Invalid export format. Must be csv or xlsx');
    }

    // Validate fields
    if (!options.fields || options.fields.length === 0) {
      throw new BadRequestException('At least one field must be selected for export');
    }

    const validFields = [
      'email', 'firstName', 'lastName', 'company', 'phone', 'status',
      'customerStatus', 'subscriptionType', 'location', 'sent', 'opens',
      'clicks', 'subscribedAt', 'lastUpdated', 'groups', 'segments'
    ];

    const invalidFields = options.fields.filter(field =>
      !validFields.includes(field) && !field.startsWith('metadata.')
    );

    if (invalidFields.length > 0) {
      throw new BadRequestException(`Invalid fields: ${invalidFields.join(', ')}`);
    }

    // Validate batch size
    if (options.batchSize && (options.batchSize < 100 || options.batchSize > 10000)) {
      throw new BadRequestException('Batch size must be between 100 and 10000');
    }

    // Validate group IDs exist
    if (filters.groupIds && filters.groupIds.length > 0) {
      const existingGroups = await this.groupRepository.findByIds(filters.groupIds);
      if (existingGroups.length !== filters.groupIds.length) {
        throw new BadRequestException('One or more group IDs do not exist');
      }
    }

    // Validate segment IDs exist
    if (filters.segmentIds && filters.segmentIds.length > 0) {
      const existingSegments = await this.segmentRepository.findByIds(filters.segmentIds);
      if (existingSegments.length !== filters.segmentIds.length) {
        throw new BadRequestException('One or more segment IDs do not exist');
      }
    }

    // Validate date range
    if (filters.dateRange) {
      if (filters.dateRange.start && filters.dateRange.end) {
        if (filters.dateRange.start > filters.dateRange.end) {
          throw new BadRequestException('Start date must be before end date');
        }
      }
    }
  }

  /**
   * Get available export fields
   */
  getAvailableFields(): string[] {
    return [
      'email',
      'firstName',
      'lastName',
      'company',
      'phone',
      'status',
      'customerStatus',
      'subscriptionType',
      'location',
      'sent',
      'opens',
      'clicks',
      'subscribedAt',
      'lastUpdated',
      'groups',
      'segments'
    ];
  }

  /**
   * Clean up expired export files
   */
  async cleanupExpiredExports(): Promise<void> {
    try {
      const expiredJobs = await this.exportJobRepository
        .createQueryBuilder('job')
        .where('job.expiresAt < :now', { now: new Date() })
        .andWhere('job.status = :status', { status: ExportJobStatus.COMPLETED })
        .getMany();

      for (const job of expiredJobs) {
        try {
          // Delete file if it exists
          await fs.unlink(job.filePath);
          this.logger.log(`Deleted expired export file: ${job.filePath}`);
        } catch (error) {
          this.logger.warn(`Failed to delete expired file ${job.filePath}: ${error.message}`);
        }

        // Update job status
        await this.exportJobRepository.update({ id: job.id, tenantId: job.tenantId }, {
          status: ExportJobStatus.FAILED,
          error: 'Export file expired and was deleted',
        });
      }

      this.logger.log(`Cleaned up ${expiredJobs.length} expired export files`);
    } catch (error) {
      this.logger.error(`Failed to cleanup expired exports: ${error.message}`, error.stack);
    }
  }

  /**
   * List export jobs with pagination and filtering
   */
  async listExportJobs(options: {
    userId?: string;
    tenantId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    jobs: ExportJob[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { userId, tenantId: filterTenantId, status, page = 1, limit = 20 } = options;
    const tenantId = filterTenantId || this.getActiveTenantId();

    const queryBuilder = this.exportJobRepository.createQueryBuilder('job')
      .where('job.tenantId = :tenantId', { tenantId });

    if (userId) {
      queryBuilder.andWhere('job.userId = :userId', { userId });
    }

    if (status) {
      queryBuilder.andWhere('job.status = :status', { status });
    }

    queryBuilder
      .orderBy('job.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [jobs, total] = await queryBuilder.getManyAndCount();

    return {
      jobs,
      total,
      page,
      limit
    };
  }

  /**
   * Create export job with GDPR compliance
   */
  async createExportJobWithGdprCompliance(
    filters: ExportFilters,
    options: ExportOptions & { gdprCompliance?: BulkExportComplianceOptions },
    userId?: string
  ): Promise<ExportJob> {
    try {
      this.logger.log('Creating GDPR-compliant export job');

      // Validate GDPR compliance if required
      if (options.gdprCompliance) {
        const complianceValidation = await this.complianceService.validateBulkExportCompliance(
          filters,
          options.gdprCompliance
        );

        if (!complianceValidation.isCompliant) {
          throw new BadRequestException(`Export failed GDPR compliance validation: ${complianceValidation.issues.join(', ')}`);
        }

        this.logger.log(`GDPR compliance validation passed for export`);
      }

      // Create the export job
      const tenantId = this.getActiveTenantId();
      return await this.createExportJob(filters, options, tenantId, userId);

    } catch (error) {
      this.logger.error(`Failed to create GDPR-compliant export job: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process export with GDPR compliance
   */
  async processExportWithGdprCompliance(
    jobId: string,
    complianceOptions: BulkExportComplianceOptions
  ): Promise<void> {
    try {
      this.logger.log(`Processing GDPR-compliant export for job ${jobId}`);
      const tenantId = this.getActiveTenantId();

      const job = await this.exportJobRepository.findOne({
        where: { id: jobId, tenantId }
      });
      if (!job) {
        throw new NotFoundException(`Export job ${jobId} not found`);
      }

      // Build query for subscribers
      const query = await this.buildSubscriberQuery(job.filters);
      const subscribers = await query.getMany();

      // Process with compliance service
      const { data: processedData, report } = await this.complianceService.processBulkExportWithCompliance(
        subscribers,
        complianceOptions,
        jobId
      );

      // Generate file with processed data
      const fileName = `export_${jobId}_${Date.now()}.${job.options.format}`;
      const filePath = path.join(this.exportDir, fileName);

      if (job.options.format === 'csv') {
        await this.generateCsvFile(processedData, filePath);
      } else {
        await this.generateExcelFile(processedData, filePath);
      }

      // Update job with compliance results
      await this.exportJobRepository.update({ id: jobId, tenantId }, {
        status: ExportJobStatus.COMPLETED,
        filePath,
        fileName,
        processedRecords: report.compliantRecords,
        totalRecords: report.totalRecords,
        progressPercentage: 100,
        error: report.issues.length > 0 ? report.issues.join('; ') : undefined
      });

      this.logger.log(`GDPR-compliant export completed for job ${jobId}: ${report.compliantRecords}/${report.totalRecords} records`);

    } catch (error) {
      this.logger.error(`GDPR-compliant export failed for job ${jobId}:`, error);
      const tenantId = this.getActiveTenantId();

      await this.exportJobRepository.update({ id: jobId, tenantId }, {
        status: ExportJobStatus.FAILED,
        error: `GDPR compliance processing failed: ${error.message}`,
        progressPercentage: 100
      });

      throw error;
    }
  }

  /**
   * Cancel export job
   */
  async cancelExportJob(jobId: string): Promise<void> {
    const tenantId = this.getActiveTenantId();
    const job = await this.exportJobRepository.findOne({
      where: { id: jobId, tenantId }
    });

    if (!job) {
      throw new NotFoundException(`Export job ${jobId} not found`);
    }

    if (job.status === ExportJobStatus.COMPLETED || job.status === ExportJobStatus.FAILED) {
      throw new BadRequestException(`Cannot cancel job in ${job.status} status`);
    }

    // Remove from queue if still pending
    if (job.status === ExportJobStatus.PENDING) {
      // Note: Queue job removal would be implemented here
      // await this.exportQueue.removeJobs(jobId);
    }

    await this.exportJobRepository.update({ id: jobId, tenantId }, {
      status: ExportJobStatus.FAILED,
      error: 'Job cancelled by user',
      completedAt: new Date()
    });

    // Clean up partial file if it exists
    try {
      await fs.unlink(job.filePath);
    } catch (error) {
      // File might not exist yet, which is fine
      this.logger.debug(`Could not delete file during cancellation: ${error.message}`);
    }

    this.logger.log(`Export job ${jobId} cancelled`);
  }

  /**
   * Clean up old export jobs and files
   */
  async cleanupOldJobs(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const oldJobs = await this.exportJobRepository.find({
      where: {
        createdAt: { $lt: cutoffDate } as any
      }
    });

    let cleanedCount = 0;

    for (const job of oldJobs) {
      try {
        // Clean up file
        try {
          await fs.unlink(job.filePath);
        } catch (error) {
          // File might not exist, which is fine
          this.logger.debug(`Could not delete file during cleanup: ${error.message}`);
        }

        // Delete job
        await this.exportJobRepository.remove(job);

        cleanedCount++;
      } catch (error) {
        this.logger.warn(`Failed to cleanup export job ${job.id}: ${error.message}`);
      }
    }

    this.logger.log(`Cleaned up ${cleanedCount} old export jobs`);
    return cleanedCount;
  }
}
