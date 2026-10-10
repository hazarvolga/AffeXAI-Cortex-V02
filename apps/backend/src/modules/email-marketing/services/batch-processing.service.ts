import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface BatchProcessingOptions {
  batchSize: number;
  concurrency: number;
  delayBetweenBatches: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface BatchJob<T> {
  id: string;
  data: T;
  priority?: number;
}

@Injectable()
export class BatchProcessingService {
  private readonly logger = new Logger(BatchProcessingService.name);

  constructor(
    @InjectQueue('import') private readonly importQueue: Queue,
    @InjectQueue('validation') private readonly validationQueue: Queue,
    private readonly tenantService: TenantService,
  ) { }

  private getTenantId(): string {
    return this.tenantService.getTenantId() || 'default';
  }

  /**
   * Process items in batches with configurable options
   */
  async processBatches<T>(
    items: T[],
    processor: (batch: T[], batchIndex: number) => Promise<void>,
    options: Partial<BatchProcessingOptions> = {}
  ): Promise<void> {
    const config: BatchProcessingOptions = {
      batchSize: 100,
      concurrency: 3,
      delayBetweenBatches: 100,
      retryAttempts: 3,
      retryDelay: 1000,
      ...options
    };

    const totalItems = items.length;
    const totalBatches = Math.ceil(totalItems / config.batchSize);

    this.logger.log(`Processing ${totalItems} items in ${totalBatches} batches (size: ${config.batchSize}, concurrency: ${config.concurrency})`);

    // Create batches
    const batches: T[][] = [];
    for (let i = 0; i < totalItems; i += config.batchSize) {
      batches.push(items.slice(i, i + config.batchSize));
    }

    // Process batches with controlled concurrency
    await this.processBatchesWithConcurrency(batches, processor, config);
  }

  /**
   * Queue import job for processing
   */
  async queueImportJob(jobData: {
    jobId: string;
    filePath: string;
    options: any;
    tenantId?: string;
  }, priority: number = 0): Promise<void> {
    const tenantId = jobData.tenantId || this.getTenantId();
    await this.importQueue.add('process-import', { ...jobData, tenantId }, {
      priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 10,
      removeOnFail: 5
    });

    this.logger.log(`Queued import job ${jobData.jobId} with priority ${priority}`);
  }

  /**
   * Queue validation job for processing
   */
  async queueValidationJob(jobData: {
    jobId: string;
    resultIds: string[];
    options: any;
    tenantId?: string;
  }, priority: number = 0): Promise<void> {
    const tenantId = jobData.tenantId || this.getTenantId();
    await this.validationQueue.add('validate-batch', { ...jobData, tenantId }, {
      priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: 10,
      removeOnFail: 5
    });

    this.logger.log(`Queued validation job for import ${jobData.jobId} with ${jobData.resultIds.length} records`);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    import: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
    validation: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
  }> {
    const [importStats, validationStats] = await Promise.all([
      this.getQueueStatistics(this.importQueue),
      this.getQueueStatistics(this.validationQueue)
    ]);

    return {
      import: importStats,
      validation: validationStats
    };
  }

  /**
   * Pause all queues
   */
  async pauseQueues(): Promise<void> {
    await Promise.all([
      this.importQueue.pause(),
      this.validationQueue.pause()
    ]);

    this.logger.log('All queues paused');
  }

  /**
   * Resume all queues
   */
  async resumeQueues(): Promise<void> {
    await Promise.all([
      this.importQueue.resume(),
      this.validationQueue.resume()
    ]);

    this.logger.log('All queues resumed');
  }

  /**
   * Clean up completed and failed jobs
   */
  async cleanupQueues(olderThanHours: number = 24): Promise<{
    importCleaned: number;
    validationCleaned: number;
  }> {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);

    const [importCleaned, validationCleaned] = await Promise.all([
      this.cleanupQueue(this.importQueue, cutoffTime),
      this.cleanupQueue(this.validationQueue, cutoffTime)
    ]);

    this.logger.log(`Cleaned up ${importCleaned} import jobs and ${validationCleaned} validation jobs`);

    return {
      importCleaned,
      validationCleaned
    };
  }

  /**
   * Cancel all jobs for a specific import
   */
  async cancelImportJobs(jobId: string): Promise<void> {
    // Cancel import jobs
    const importJobs = await this.importQueue.getJobs(['waiting', 'active']);
    const importJobsToCancel = importJobs.filter(job => job.data.jobId === jobId);

    for (const job of importJobsToCancel) {
      await job.remove();
    }

    // Cancel validation jobs
    const validationJobs = await this.validationQueue.getJobs(['waiting', 'active']);
    const validationJobsToCancel = validationJobs.filter(job => job.data.jobId === jobId);

    for (const job of validationJobsToCancel) {
      await job.remove();
    }

    this.logger.log(`Cancelled ${importJobsToCancel.length} import jobs and ${validationJobsToCancel.length} validation jobs for import ${jobId}`);
  }

  /**
   * Process batches with controlled concurrency
   */
  private async processBatchesWithConcurrency<T>(
    batches: T[][],
    processor: (batch: T[], batchIndex: number) => Promise<void>,
    config: BatchProcessingOptions
  ): Promise<void> {
    const semaphore = new Array(config.concurrency).fill(null);
    let batchIndex = 0;
    let completedBatches = 0;

    const processBatch = async (batch: T[], index: number): Promise<void> => {
      let attempts = 0;

      while (attempts < config.retryAttempts) {
        try {
          await processor(batch, index);
          completedBatches++;
          this.logger.debug(`Completed batch ${index + 1}/${batches.length} (${completedBatches}/${batches.length})`);
          return;
        } catch (error) {
          attempts++;
          this.logger.warn(`Batch ${index + 1} failed (attempt ${attempts}/${config.retryAttempts}):`, error);

          if (attempts < config.retryAttempts) {
            await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempts));
          } else {
            throw error;
          }
        }
      }
    };

    const workers = semaphore.map(async () => {
      while (batchIndex < batches.length) {
        const currentIndex = batchIndex++;
        const batch = batches[currentIndex];

        await processBatch(batch, currentIndex);

        // Delay between batches
        if (currentIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
        }
      }
    });

    await Promise.all(workers);
  }

  /**
   * Get statistics for a specific queue
   */
  private async getQueueStatistics(queue: Queue): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  }

  /**
   * Clean up old jobs from a queue
   */
  private async cleanupQueue(queue: Queue, cutoffTime: number): Promise<number> {
    let cleanedCount = 0;

    // Clean completed jobs
    const completedJobs = await queue.getCompleted();
    for (const job of completedJobs) {
      if (job.timestamp < cutoffTime) {
        await job.remove();
        cleanedCount++;
      }
    }

    // Clean failed jobs
    const failedJobs = await queue.getFailed();
    for (const job of failedJobs) {
      if (job.timestamp < cutoffTime) {
        await job.remove();
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}