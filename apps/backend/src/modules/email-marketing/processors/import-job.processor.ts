import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { BulkImportService } from '../services/bulk-import.service';
import { FileProcessingService } from '../services/file-processing.service';
import { AdvancedEmailValidationService } from '../services/advanced-email-validation.service';
import { ImportIntegrationService } from '../services/import-integration.service';
import { ImportJobStatus } from '../entities/import-job.entity';
import { ImportResult, ImportResultStatus } from '../entities/import-result.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface ImportJobData {
  jobId: string;
  filePath: string;
  tenantId: string; // Added tenantId
  options: {
    groupIds?: string[];
    segmentIds?: string[];
    duplicateHandling: 'skip' | 'update' | 'replace';
    validationThreshold: number;
    batchSize: number;
    columnMapping: Record<string, string>;
  };
}

export interface ValidationJobData {
  jobId: string;
  batch: Array<{
    email: string;
    rowNumber: number;
    originalData: Record<string, any>;
  }>;
  options: ImportJobData['options'];
}

@Processor('import')
@Injectable()
export class ImportJobProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportJobProcessor.name);

  constructor(
    private readonly bulkImportService: BulkImportService,
    private readonly fileProcessingService: FileProcessingService,
    private readonly emailValidationService: AdvancedEmailValidationService,
    private readonly importIntegrationService: ImportIntegrationService,
    @InjectRepository(ImportResult)
    private readonly importResultRepository: Repository<ImportResult>,
    private readonly tenantService: TenantService,
  ) {
    super();
  }

  async process(job: Job<ImportJobData>): Promise<void> {
    const { jobId, filePath, options } = job.data;

    this.logger.log(`Processing import job ${jobId}`);

    const tenantId = job.data.tenantId || 'default';

    return this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        // Update job status to processing
        await this.bulkImportService.updateJobProgress(jobId, {
          status: ImportJobStatus.PROCESSING,
          progressPercentage: 0
        });

        // Step 1: Parse CSV file
        const parseResult = await this.fileProcessingService.parseCsvFile(filePath, job.data.tenantId);

        if (parseResult.errors.length > 0) {
          this.logger.warn(`CSV parsing warnings for job ${jobId}:`, parseResult.errors);
        }

        // Step 2: Process data in batches
        const batchSize = options.batchSize || 100;
        const totalRows = parseResult.data.length;
        let processedCount = 0;
        let validCount = 0;
        let invalidCount = 0;
        let riskyCount = 0;
        let duplicateCount = 0;

        this.logger.log(`Processing ${totalRows} records in batches of ${batchSize}`);

        for (let i = 0; i < totalRows; i += batchSize) {
          const batch = parseResult.data.slice(i, i + batchSize);

          // Process batch
          const batchResults = await this.processBatch(jobId, batch, options, i + 1);

          // Update counters
          batchResults.forEach(result => {
            switch (result.status) {
              case ImportResultStatus.VALID:
                validCount++;
                break;
              case ImportResultStatus.INVALID:
                invalidCount++;
                break;
              case ImportResultStatus.RISKY:
                riskyCount++;
                break;
              case ImportResultStatus.DUPLICATE:
                duplicateCount++;
                break;
            }
          });

          processedCount += batch.length;
          const progressPercentage = (processedCount / totalRows) * 100;

          // Update job progress
          await this.bulkImportService.updateJobProgress(jobId, {
            processedRecords: processedCount,
            validRecords: validCount,
            invalidRecords: invalidCount,
            riskyRecords: riskyCount,
            duplicateRecords: duplicateCount,
            progressPercentage
          });

          this.logger.log(`Job ${jobId}: Processed ${processedCount}/${totalRows} records (${progressPercentage.toFixed(1)}%)`);

          // Small delay to prevent overwhelming the system
          if (i + batchSize < totalRows) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Step 3: Generate validation summary
        const validationSummary = {
          totalProcessed: processedCount,
          validEmails: validCount,
          invalidEmails: invalidCount,
          riskyEmails: riskyCount,
          duplicates: duplicateCount,
          averageConfidenceScore: await this.calculateAverageConfidence(jobId),
          processingTimeMs: Date.now() - job.timestamp
        };

        // Step 4: Process valid results and create/update subscribers
        this.logger.log(`Processing ${validCount} valid records for subscriber creation/update`);

        const integrationSummary = await this.importIntegrationService.processImportResults(jobId, {
          groupIds: options.groupIds,
          segmentIds: options.segmentIds,
          duplicateHandling: options.duplicateHandling,
          validationThreshold: options.validationThreshold,
          columnMapping: options.columnMapping
        }, job.data.tenantId);

        this.logger.log(`Integration completed: Created ${integrationSummary.created}, Updated ${integrationSummary.updated}, Skipped ${integrationSummary.skipped}, Failed ${integrationSummary.failed}`);

        // Step 5: Complete the job
        await this.bulkImportService.updateJobProgress(jobId, {
          status: ImportJobStatus.COMPLETED,
          progressPercentage: 100,
          validationSummary
        });

        // Step 6: Clean up temporary files
        await this.fileProcessingService.cleanupTempFiles(jobId);

        this.logger.log(`Import job ${jobId} completed successfully. Valid: ${validCount}, Invalid: ${invalidCount}, Risky: ${riskyCount}, Duplicates: ${duplicateCount}`);

      } catch (error) {
        this.logger.error(`Import job ${jobId} failed:`, error);

        await this.bulkImportService.updateJobProgress(jobId, {
          status: ImportJobStatus.FAILED,
          error: error.message
        });

        // Clean up on failure
        await this.fileProcessingService.cleanupTempFiles(jobId);

        throw error;
      }
    });
  }

  /**
   * Process a batch of records
   */
  private async processBatch(
    jobId: string,
    batch: any[],
    options: ImportJobData['options'],
    startRowNumber: number
  ): Promise<ImportResult[]> {
    const results: ImportResult[] = [];

    for (let i = 0; i < batch.length; i++) {
      const row = batch[i];
      const rowNumber = startRowNumber + i;

      try {
        const result = await this.processRecord(jobId, row, options, rowNumber);
        results.push(result);
      } catch (error) {
        this.logger.error(`Error processing row ${rowNumber} in job ${jobId}:`);
        this.logger.error(error);

        // Find email column for error reporting
        const emailColumn = Object.keys(options.columnMapping).find(
          col => options.columnMapping[col] === 'email'
        );

        // Create error result
        const errorResult = this.importResultRepository.create({
          importJobId: jobId,
          email: (emailColumn ? row[emailColumn] : null) || 'unknown',
          status: ImportResultStatus.INVALID,
          confidenceScore: 0,
          imported: false,
          error: error.message,
          originalData: row,
          rowNumber
        });

        results.push(await this.importResultRepository.save(errorResult));
      }
    }

    return results;
  }

  /**
   * Process a single record
   */
  private async processRecord(
    jobId: string,
    row: any,
    options: ImportJobData['options'],
    rowNumber: number
  ): Promise<ImportResult> {
    // Find CSV column mapped to 'email' field
    // columnMapping format: { 'CSV Column Name': 'fieldKey' }
    const emailColumn = Object.keys(options.columnMapping).find(
      col => options.columnMapping[col] === 'email'
    );
    const email = emailColumn ? row[emailColumn] : null;

    // DEBUG: Log first row to see mapping
    if (rowNumber === 1) {
      this.logger.debug(`Row data keys: ${Object.keys(row).join(', ')}`);
      this.logger.debug(`Column mapping: ${JSON.stringify(options.columnMapping)}`);
      this.logger.debug(`Email column found: ${emailColumn}`);
      this.logger.debug(`Email value: ${email}`);
    }

    if (!email) {
      throw new Error('Email field is required');
    }

    // Step 1: Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return this.createImportResult(jobId, {
        email,
        status: ImportResultStatus.INVALID,
        confidenceScore: 0,
        issues: ['Invalid email format'],
        imported: false,
        originalData: row,
        rowNumber
      });
    }

    // Step 2: Advanced email validation
    let validationResult;
    try {
      validationResult = await this.emailValidationService.validateEmail(email);
    } catch (error) {
      this.logger.warn(`Email validation service failed for ${email}:`, error);
      // Fallback to basic validation
      validationResult = {
        isValid: true,
        confidenceScore: 50,
        details: {
          syntaxValid: true,
          domainExists: true,
          mxRecordExists: true,
          isDisposable: false,
          isRoleAccount: false,
          hasTypos: false,
          ipReputation: 'unknown' as const,
          confidenceScore: 50,
          validationProvider: 'fallback',
          validatedAt: new Date()
        }
      };
    }

    // Step 3: Determine status based on validation and threshold
    let status: ImportResultStatus;
    const confidenceScore = validationResult.confidenceScore;

    if (!validationResult.isValid || confidenceScore < options.validationThreshold) {
      status = ImportResultStatus.INVALID;
    } else if (confidenceScore < 80) {
      status = ImportResultStatus.RISKY;
    } else {
      // Check for duplicates
      const duplicateCheck = await this.bulkImportService.checkDuplicates([email], options.duplicateHandling);
      const isDuplicate = duplicateCheck.get(email)?.isDuplicate || false;

      status = isDuplicate ? ImportResultStatus.DUPLICATE : ImportResultStatus.VALID;
    }

    // Step 4: Create import result
    return this.createImportResult(jobId, {
      email,
      status,
      confidenceScore,
      validationDetails: validationResult.details,
      issues: this.extractIssues(validationResult),
      suggestions: this.extractSuggestions(validationResult),
      imported: false, // Will be updated in integration step
      originalData: row,
      rowNumber
    });
  }

  /**
   * Create and save import result
   */
  private async createImportResult(jobId: string, data: {
    email: string;
    status: ImportResultStatus;
    confidenceScore: number;
    validationDetails?: any;
    issues?: string[];
    suggestions?: string[];
    imported: boolean;
    error?: string;
    originalData: Record<string, any>;
    rowNumber: number;
    subscriberId?: string;
  }): Promise<ImportResult> {
    const result = this.importResultRepository.create({
      importJobId: jobId,
      ...data
    });

    return await this.importResultRepository.save(result);
  }

  /**
   * Extract issues from validation result
   */
  private extractIssues(validationResult: any): string[] {
    const issues: string[] = [];

    if (validationResult.details) {
      const details = validationResult.details;

      if (!details.syntaxValid) {
        issues.push('Invalid email syntax');
      }

      if (!details.domainExists) {
        issues.push('Domain does not exist');
      }

      if (!details.mxRecordExists) {
        issues.push('No MX record found for domain');
      }

      if (details.isDisposable) {
        issues.push('Disposable email address');
      }

      if (details.isRoleAccount) {
        issues.push('Role-based email address');
      }

      if (details.hasTypos) {
        issues.push('Possible typo in email address');
      }

      if (details.ipReputation === 'poor') {
        issues.push('Domain has poor reputation');
      }
    }

    return issues;
  }

  /**
   * Extract suggestions from validation result
   */
  private extractSuggestions(validationResult: any): string[] {
    const suggestions: string[] = [];

    if (validationResult.suggestion) {
      suggestions.push(`Did you mean: ${validationResult.suggestion}?`);
    }

    if (validationResult.details?.hasTypos && validationResult.correctedEmail) {
      suggestions.push(`Consider using: ${validationResult.correctedEmail}`);
    }

    return suggestions;
  }

  /**
   * Calculate average confidence score for the job
   */
  private async calculateAverageConfidence(jobId: string): Promise<number> {
    const result = await this.importResultRepository
      .createQueryBuilder('result')
      .select('AVG(result.confidenceScore)', 'average')
      .where('result.importJobId = :jobId', { jobId })
      .getRawOne();

    return Math.round(result?.average || 0);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<ImportJobData>) {
    this.logger.log(`Import job ${job.data.jobId} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ImportJobData>, error: Error) {
    this.logger.error(`Import job ${job.data.jobId} failed:`, error);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<ImportJobData>, progress: number) {
    this.logger.debug(`Import job ${job.data.jobId} progress: ${progress}%`);
  }
}