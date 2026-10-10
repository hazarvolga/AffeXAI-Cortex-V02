import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WorkflowExecutorService } from '../services/workflow-executor.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationExecution } from '../entities/automation-execution.entity';
import { AutomationSchedule } from '../entities/automation-schedule.entity';
import {
  AUTOMATION_QUEUE_NAME,
  AutomationJobType,
  ExecuteAutomationJobData,
  ProcessScheduledStepJobData,
  RetryFailedStepJobData,
  ProcessTriggerJobData,
} from '../queues/automation.queue';
import { TenantService } from '../../../core/tenant/tenant.service';

/**
 * Automation Queue Processor
 * Processes automation jobs from the queue
 */
@Processor(AUTOMATION_QUEUE_NAME)
export class AutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(
    private workflowExecutor: WorkflowExecutorService,
    @InjectRepository(AutomationExecution)
    private executionRepo: Repository<AutomationExecution>,
    @InjectRepository(AutomationSchedule)
    private scheduleRepo: Repository<AutomationSchedule>,
    private readonly tenantService: TenantService,
  ) {
    super();
  }

  /**
   * Main process method - routes to specific handlers
   */
  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    const tenantId = job.data.tenantId || 'default';

    return this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        switch (job.name) {
          case AutomationJobType.EXECUTE_AUTOMATION:
            return await this.handleExecuteAutomation(job);

          case AutomationJobType.PROCESS_SCHEDULED_STEP:
            return await this.handleProcessScheduledStep(job);

          case AutomationJobType.RETRY_FAILED_STEP:
            return await this.handleRetryFailedStep(job);

          case AutomationJobType.PROCESS_TRIGGER:
            return await this.handleProcessTrigger(job);

          default:
            throw new Error(`Unknown job type: ${job.name}`);
        }
      } catch (error) {
        this.logger.error(`Error processing job ${job.id}:`, error);
        throw error;
      }
    });
  }

  /**
   * Handle execute automation job
   */
  private async handleExecuteAutomation(
    job: Job<ExecuteAutomationJobData>,
  ): Promise<void> {
    const { automationId, subscriberId, triggerId, metadata } = job.data;

    this.logger.log(
      `Executing automation ${automationId} for subscriber ${subscriberId}`,
    );

    // Update job progress
    await job.updateProgress(10);

    // Execute workflow
    const execution = await this.workflowExecutor.executeWorkflow(
      automationId,
      subscriberId,
      triggerId,
    );

    await job.updateProgress(50);

    // Wait for execution to complete (with timeout)
    await this.waitForExecution(execution.id, 300000); // 5 minutes timeout

    await job.updateProgress(100);

    this.logger.log(
      `Completed automation ${automationId} for subscriber ${subscriberId}`,
    );
  }

  /**
   * Handle process scheduled step job
   */
  private async handleProcessScheduledStep(
    job: Job<ProcessScheduledStepJobData>,
  ): Promise<void> {
    const { scheduleId, automationId, subscriberId, stepIndex, metadata } =
      job.data;

    this.logger.log(
      `Processing scheduled step ${stepIndex} for automation ${automationId}`,
    );

    await job.updateProgress(10);

    // Resume execution from schedule
    await this.workflowExecutor.resumeExecution(scheduleId);

    await job.updateProgress(100);

    this.logger.log(`Completed scheduled step ${scheduleId}`);
  }

  /**
   * Handle retry failed step job
   */
  private async handleRetryFailedStep(
    job: Job<RetryFailedStepJobData>,
  ): Promise<void> {
    const { executionId, stepId, attemptNumber, error } = job.data;

    this.logger.log(
      `Retrying failed step ${stepId} for execution ${executionId} (attempt ${attemptNumber})`,
    );

    await job.updateProgress(10);

    // Load execution
    const execution = await this.executionRepo.findOne({
      where: { id: executionId },
      relations: ['automation', 'subscriber'],
    });

    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    // Find the failed step
    const step = execution.automation.getStepById(stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found`);
    }

    await job.updateProgress(50);

    // Reset execution to retry from this step
    execution.status = 'running' as any;
    execution.currentStepIndex = execution.automation.workflowSteps.findIndex(
      (s) => s.id === stepId,
    );
    await this.executionRepo.save(execution);

    // Continue execution
    await this.workflowExecutor.processExecution(executionId);

    await job.updateProgress(100);

    this.logger.log(
      `Completed retry for step ${stepId} (attempt ${attemptNumber})`,
    );
  }

  /**
   * Handle process trigger job
   */
  private async handleProcessTrigger(
    job: Job<ProcessTriggerJobData>,
  ): Promise<void> {
    const { triggerId, automationId, subscriberId, triggerType, triggerData } =
      job.data;

    this.logger.log(
      `Processing trigger ${triggerId} for automation ${automationId}`,
    );

    await job.updateProgress(10);

    // Execute automation from trigger
    const execution = await this.workflowExecutor.executeWorkflow(
      automationId,
      subscriberId,
      triggerId,
    );

    await job.updateProgress(50);

    // Wait for execution to complete
    await this.waitForExecution(execution.id, 300000);

    await job.updateProgress(100);

    this.logger.log(`Completed trigger ${triggerId}`);
  }

  /**
   * Wait for execution to complete
   */
  private async waitForExecution(
    executionId: string,
    timeoutMs: number,
  ): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 1000; // 1 second

    while (Date.now() - startTime < timeoutMs) {
      const execution = await this.executionRepo.findOne({
        where: { id: executionId },
      });

      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      if (
        execution.status === 'completed' ||
        execution.status === 'failed' ||
        execution.status === 'cancelled'
      ) {
        return;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Execution ${executionId} timed out after ${timeoutMs}ms`);
  }

  /**
   * Handle job completion
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} (${job.name}) completed successfully`);
  }

  /**
   * Handle job failure
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempts:`,
      error,
    );
  }

  /**
   * Handle job progress
   */
  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number) {
    this.logger.debug(`Job ${job.id} (${job.name}) progress: ${progress}%`);
  }

  /**
   * Handle job active
   */
  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} (${job.name}) started processing`);
  }
}
