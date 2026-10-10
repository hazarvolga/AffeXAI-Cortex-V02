import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  AUTOMATION_QUEUE_NAME,
  AutomationJobType,
  AUTOMATION_JOB_OPTIONS,
  AutomationJobPriority,
  ExecuteAutomationJobData,
  ProcessScheduledStepJobData,
  RetryFailedStepJobData,
  ProcessTriggerJobData,
} from '../queues/automation.queue';
import { TenantService } from '../../../core/tenant/tenant.service';

/**
 * Automation Queue Service
 * Manages automation job queue operations
 */
@Injectable()
export class AutomationQueueService {
  private readonly logger = new Logger(AutomationQueueService.name);

  constructor(
    @InjectQueue(AUTOMATION_QUEUE_NAME)
    private automationQueue: Queue,
    private readonly tenantService: TenantService,
  ) { }

  private getTenantId(): string {
    return this.tenantService.getTenantId() || 'default';
  }

  /**
   * Add execute automation job
   */
  async addExecuteAutomationJob(
    data: ExecuteAutomationJobData,
    priority: AutomationJobPriority = AutomationJobPriority.NORMAL,
    delayMs?: number,
  ): Promise<void> {
    this.logger.log(
      `Adding execute automation job for automation ${data.automationId}, subscriber ${data.subscriberId}`,
    );

    const tenantId = this.getTenantId();

    await this.automationQueue.add(
      AutomationJobType.EXECUTE_AUTOMATION,
      { ...data, tenantId },
      {
        ...AUTOMATION_JOB_OPTIONS,
        priority,
        delay: delayMs,
      },
    );
  }

  /**
   * Add process scheduled step job
   */
  async addProcessScheduledStepJob(
    data: ProcessScheduledStepJobData,
    scheduledFor: Date,
  ): Promise<void> {
    const delayMs = scheduledFor.getTime() - Date.now();

    if (delayMs < 0) {
      this.logger.warn(
        `Scheduled time is in the past for schedule ${data.scheduleId}, executing immediately`,
      );
    }

    this.logger.log(
      `Adding scheduled step job for schedule ${data.scheduleId}, delay: ${Math.max(0, delayMs)}ms`,
    );

    const tenantId = this.getTenantId();

    await this.automationQueue.add(
      AutomationJobType.PROCESS_SCHEDULED_STEP,
      { ...data, tenantId },
      {
        ...AUTOMATION_JOB_OPTIONS,
        priority: AutomationJobPriority.NORMAL,
        delay: Math.max(0, delayMs),
      },
    );
  }

  /**
   * Add retry failed step job
   */
  async addRetryFailedStepJob(
    data: RetryFailedStepJobData,
    delayMs: number = 5000,
  ): Promise<void> {
    this.logger.log(
      `Adding retry job for step ${data.stepId}, execution ${data.executionId} (attempt ${data.attemptNumber})`,
    );

    const tenantId = this.getTenantId();

    await this.automationQueue.add(
      AutomationJobType.RETRY_FAILED_STEP,
      { ...data, tenantId },
      {
        ...AUTOMATION_JOB_OPTIONS,
        priority: AutomationJobPriority.HIGH,
        delay: delayMs,
        attempts: 3 - (data.attemptNumber - 1), // Reduce attempts for retries
      },
    );
  }

  /**
   * Add process trigger job
   */
  async addProcessTriggerJob(
    data: ProcessTriggerJobData,
    priority: AutomationJobPriority = AutomationJobPriority.NORMAL,
  ): Promise<void> {
    this.logger.log(
      `Adding process trigger job for trigger ${data.triggerId}, automation ${data.automationId}`,
    );

    const tenantId = this.getTenantId();

    await this.automationQueue.add(AutomationJobType.PROCESS_TRIGGER,
      { ...data, tenantId },
      {
        ...AUTOMATION_JOB_OPTIONS,
        priority,
      }
    );
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    const [waiting, active, completed, failed, delayed] =
      await Promise.all([
        this.automationQueue.getWaitingCount(),
        this.automationQueue.getActiveCount(),
        this.automationQueue.getCompletedCount(),
        this.automationQueue.getFailedCount(),
        this.automationQueue.getDelayedCount(),
      ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: 0, // BullMQ doesn't have getPausedCount in this version
    };
  }

  /**
   * Get queue jobs
   */
  async getQueueJobs(
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
    start: number = 0,
    end: number = 10,
  ) {
    switch (status) {
      case 'waiting':
        return this.automationQueue.getWaiting(start, end);
      case 'active':
        return this.automationQueue.getActive(start, end);
      case 'completed':
        return this.automationQueue.getCompleted(start, end);
      case 'failed':
        return this.automationQueue.getFailed(start, end);
      case 'delayed':
        return this.automationQueue.getDelayed(start, end);
      default:
        return [];
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue(): Promise<void> {
    this.logger.log('Pausing automation queue');
    await this.automationQueue.pause();
  }

  /**
   * Resume queue
   */
  async resumeQueue(): Promise<void> {
    this.logger.log('Resuming automation queue');
    await this.automationQueue.resume();
  }

  /**
   * Clean queue
   */
  async cleanQueue(
    grace: number = 86400000, // 24 hours in milliseconds
    status: 'completed' | 'failed' = 'completed',
  ): Promise<number> {
    this.logger.log(`Cleaning ${status} jobs older than ${grace}ms`);
    const jobIds = await this.automationQueue.clean(grace, 1000, status);
    this.logger.log(`Cleaned ${jobIds.length} ${status} jobs`);
    return jobIds.length;
  }

  /**
   * Drain queue (remove all jobs)
   */
  async drainQueue(): Promise<void> {
    this.logger.warn('Draining automation queue - all jobs will be removed');
    await this.automationQueue.drain();
  }

  /**
   * Obliterate queue (remove all jobs and keys)
   */
  async obliterateQueue(): Promise<void> {
    this.logger.warn(
      'Obliterating automation queue - all data will be removed',
    );
    await this.automationQueue.obliterate();
  }
}
