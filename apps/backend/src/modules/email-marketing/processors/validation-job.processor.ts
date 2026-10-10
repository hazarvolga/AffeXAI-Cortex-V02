import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { AdvancedEmailValidationService } from '../services/advanced-email-validation.service';
import { ImportResult, ImportResultStatus } from '../entities/import-result.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface ValidationJobData {
  jobId: string;
  resultIds: string[]; // IDs of ImportResult records to validate
  options: {
    validationThreshold: number;
    batchSize: number;
  };
  tenantId: string; // Added tenantId
}

export interface BatchValidationResult {
  resultId: string;
  email: string;
  isValid: boolean;
  confidenceScore: number;
  details: any;
  issues: string[];
  suggestions: string[];
  status: ImportResultStatus;
}

@Processor('validation')
@Injectable()
export class ValidationJobProcessor extends WorkerHost {
  private readonly logger = new Logger(ValidationJobProcessor.name);

  constructor(
    private readonly emailValidationService: AdvancedEmailValidationService,
    @InjectRepository(ImportResult)
    private readonly importResultRepository: Repository<ImportResult>,
    private readonly tenantService: TenantService,
  ) {
    super();
  }

  async process(job: Job<ValidationJobData>): Promise<void> {
    const { jobId, resultIds, options } = job.data;

    this.logger.log(`Processing validation job for import ${jobId} with ${resultIds.length} records`);

    const tenantId = job.data.tenantId || 'default';

    return this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        // Get import results to validate
        const importResults = await this.importResultRepository.findByIds(resultIds);

        if (importResults.length === 0) {
          this.logger.warn(`No import results found for validation job ${jobId}`);
          return;
        }

        // Process in batches to avoid overwhelming the validation service
        const batchSize = options.batchSize || 50;
        const totalResults = importResults.length;
        let processedCount = 0;

        for (let i = 0; i < totalResults; i += batchSize) {
          const batch = importResults.slice(i, i + batchSize);

          // Validate batch
          const validationResults = await this.validateBatch(batch, options);

          // Update import results with validation data
          await this.updateImportResults(validationResults);

          processedCount += batch.length;
          const progress = (processedCount / totalResults) * 100;

          // Update job progress
          await job.updateProgress(progress);

          this.logger.log(`Validation job ${jobId}: Processed ${processedCount}/${totalResults} records (${progress.toFixed(1)}%)`);

          // Small delay between batches to prevent rate limiting
          if (i + batchSize < totalResults) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        this.logger.log(`Validation job for import ${jobId} completed successfully`);

      } catch (error) {
        this.logger.error(`Validation job for import ${jobId} failed:`, error);
        throw error;
      }
    });
  }

  /**
   * Validate a batch of import results
   */
  private async validateBatch(
    importResults: ImportResult[],
    options: ValidationJobData['options']
  ): Promise<BatchValidationResult[]> {
    const results: BatchValidationResult[] = [];

    // Process each email in the batch
    for (const importResult of importResults) {
      try {
        const validationResult = await this.validateSingleEmail(importResult.email, options);

        results.push({
          resultId: importResult.id,
          email: importResult.email,
          ...validationResult
        });

      } catch (error) {
        this.logger.error(`Failed to validate email ${importResult.email}:`, error);

        // Create fallback result for failed validation
        results.push({
          resultId: importResult.id,
          email: importResult.email,
          isValid: false,
          confidenceScore: 0,
          details: null,
          issues: ['Validation service failed'],
          suggestions: [],
          status: ImportResultStatus.INVALID
        });
      }
    }

    return results;
  }

  /**
   * Validate a single email address
   */
  private async validateSingleEmail(
    email: string,
    options: ValidationJobData['options']
  ): Promise<Omit<BatchValidationResult, 'resultId' | 'email'>> {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        confidenceScore: 0,
        details: null,
        issues: ['Invalid email format'],
        suggestions: [],
        status: ImportResultStatus.INVALID
      };
    }

    // Advanced validation using the email validation service
    let validationResult;
    try {
      validationResult = await this.emailValidationService.validateEmail(email);
    } catch (error) {
      // Fallback to basic validation if service fails
      this.logger.warn(`Email validation service failed for ${email}, using fallback`);

      return {
        isValid: true,
        confidenceScore: 50,
        details: {
          syntaxValid: true,
          domainExists: true,
          mxRecordExists: true,
          isDisposable: false,
          isRoleAccount: false,
          hasTypos: false,
          ipReputation: 'unknown',
          confidenceScore: 50,
          validationProvider: 'fallback',
          validatedAt: new Date()
        },
        issues: ['Validation service unavailable'],
        suggestions: [],
        status: ImportResultStatus.RISKY
      };
    }

    // Determine status based on validation result and threshold
    const confidenceScore = validationResult.confidenceScore;
    let status: ImportResultStatus;

    if (!validationResult.isValid || confidenceScore < options.validationThreshold) {
      status = ImportResultStatus.INVALID;
    } else if (confidenceScore < 80) {
      status = ImportResultStatus.RISKY;
    } else {
      status = ImportResultStatus.VALID;
    }

    return {
      isValid: validationResult.isValid,
      confidenceScore,
      details: validationResult.details,
      issues: this.extractIssues(validationResult),
      suggestions: this.extractSuggestions(validationResult),
      status
    };
  }

  /**
   * Update import results with validation data
   */
  private async updateImportResults(validationResults: BatchValidationResult[]): Promise<void> {
    const updatePromises = validationResults.map(result => {
      return this.importResultRepository.update(result.resultId, {
        status: result.status,
        confidenceScore: result.confidenceScore,
        validationDetails: result.details,
        issues: result.issues,
        suggestions: result.suggestions
      });
    });

    await Promise.all(updatePromises);
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

  @OnWorkerEvent('completed')
  onCompleted(job: Job<ValidationJobData>) {
    this.logger.log(`Validation job for import ${job.data.jobId} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ValidationJobData>, error: Error) {
    this.logger.error(`Validation job for import ${job.data.jobId} failed:`, error);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<ValidationJobData>, progress: number) {
    this.logger.debug(`Validation job for import ${job.data.jobId} progress: ${progress}%`);
  }
}