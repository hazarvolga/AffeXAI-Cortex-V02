import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BulkExportService, ExportJobData } from '../services/bulk-export.service';
import { ExportJobStatus } from '../entities/export-job.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber } from '../entities/subscriber.entity';
import { TenantService } from '../../../core/tenant/tenant.service';
import * as fs from 'fs/promises';

@Processor('export')
export class ExportJobProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportJobProcessor.name);

  constructor(
    private readonly bulkExportService: BulkExportService,
    @InjectRepository(Subscriber)
    private readonly subscriberRepository: Repository<Subscriber>,
    private readonly tenantService: TenantService,
  ) {
    super();
  }

  async process(job: Job<ExportJobData>): Promise<void> {
    const { jobId, filters, options } = job.data;

    this.logger.log(`Starting export job ${jobId}`);

    const tenantId = job.data.filters?.tenantId || 'default';

    return this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        // Update job status to processing
        await this.bulkExportService.updateExportProgress(
          jobId,
          0,
          0,
          ExportJobStatus.PROCESSING,
        );

        // Get total count for progress tracking
        const query = await this.bulkExportService.buildSubscriberQuery(filters);
        const totalRecords = await query.getCount();

        this.logger.log(`Export job ${jobId}: Found ${totalRecords} subscribers to export`);

        // Update total records
        await this.bulkExportService.updateExportProgress(jobId, 0, totalRecords);

        if (totalRecords === 0) {
          // Handle empty result set
          await this.handleEmptyExport(jobId, options);
          return;
        }

        // Process in batches for memory efficiency
        const batchSize = options.batchSize || 1000;
        let processedRecords = 0;
        const allData: any[] = [];

        // Stream processing for large datasets
        for (let offset = 0; offset < totalRecords; offset += batchSize) {
          // Update progress
          job.updateProgress(Math.round((processedRecords / totalRecords) * 100));

          // Get batch of subscribers
          const batchQuery = await this.bulkExportService.buildSubscriberQuery(filters);
          const subscribers = await batchQuery
            .skip(offset)
            .take(batchSize)
            .getMany();

          this.logger.log(`Export job ${jobId}: Processing batch ${offset + 1}-${Math.min(offset + batchSize, totalRecords)} of ${totalRecords}`);

          // Format subscriber data
          const formattedBatch = await this.bulkExportService.formatSubscriberData(
            subscribers,
            options,
          );

          allData.push(...formattedBatch);
          processedRecords += subscribers.length;

          // Update progress in database
          await this.bulkExportService.updateExportProgress(
            jobId,
            processedRecords,
            totalRecords,
          );

          // Add small delay to prevent overwhelming the database
          if (offset + batchSize < totalRecords) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Generate the export file
        const exportJob = await this.bulkExportService.getExportStatus(jobId);
        await this.generateExportFile(allData, exportJob.filePath, options.format);

        // Update file size
        await this.bulkExportService.updateFileSize(jobId, exportJob.filePath);

        // Mark job as completed
        await this.bulkExportService.updateExportProgress(
          jobId,
          processedRecords,
          totalRecords,
          ExportJobStatus.COMPLETED,
        );

        this.logger.log(`Export job ${jobId} completed successfully. Exported ${processedRecords} records.`);

      } catch (error) {
        this.logger.error(`Export job ${jobId} failed: ${error.message}`, error.stack);

        // Mark job as failed
        await this.bulkExportService.markExportAsFailed(
          jobId,
          `Export processing failed: ${error.message}`,
        );

        throw error;
      }
    });
  }

  /**
   * Handle empty export results
   */
  private async handleEmptyExport(
    jobId: string,
    options: { format: 'csv' | 'xlsx' },
  ): Promise<void> {
    try {
      const exportJob = await this.bulkExportService.getExportStatus(jobId);

      // Create empty file with headers
      await this.generateExportFile([], exportJob.filePath, options.format);

      // Update file size
      await this.bulkExportService.updateFileSize(jobId, exportJob.filePath);

      // Mark as completed
      await this.bulkExportService.updateExportProgress(
        jobId,
        0,
        0,
        ExportJobStatus.COMPLETED,
      );

      this.logger.log(`Export job ${jobId} completed with empty result set`);
    } catch (error) {
      this.logger.error(`Failed to handle empty export for job ${jobId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate export file based on format
   */
  private async generateExportFile(
    data: any[],
    filePath: string,
    format: 'csv' | 'xlsx',
  ): Promise<void> {
    try {
      // Ensure directory exists
      const dir = require('path').dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      if (format === 'csv') {
        await this.bulkExportService.generateCsvFile(data, filePath);
      } else if (format === 'xlsx') {
        await this.bulkExportService.generateExcelFile(data, filePath);
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }

      this.logger.log(`Generated ${format.toUpperCase()} file: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to generate export file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle job completion
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job<ExportJobData>) {
    this.logger.log(`Export job ${job.data.jobId} completed successfully`);
  }

  /**
   * Handle job failure
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job<ExportJobData>, error: Error) {
    this.logger.error(
      `Export job ${job.data.jobId} failed: ${error.message}`,
      error.stack,
    );
  }

  /**
   * Handle job progress updates
   */
  @OnWorkerEvent('progress')
  onProgress(job: Job<ExportJobData>, progress: number) {
    this.logger.log(`Export job ${job.data.jobId} progress: ${progress}%`);
  }

  /**
   * Handle job stalling
   */
  @OnWorkerEvent('stalled')
  onStalled(job: Job<ExportJobData>) {
    this.logger.warn(`Export job ${job.data.jobId} stalled`);
  }
}