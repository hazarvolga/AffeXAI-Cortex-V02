import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WorkflowExecutorService } from './workflow-executor.service';

/**
 * Automation Scheduler Service
 * Handles scheduled workflow execution
 */
@Injectable()
export class AutomationSchedulerService {
  private readonly logger = new Logger(AutomationSchedulerService.name);

  constructor(private workflowExecutor: WorkflowExecutorService) {}

  /**
   * Process pending schedules every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handlePendingSchedules(): Promise<void> {
    this.logger.log('Processing pending automation schedules...');

    try {
      await this.workflowExecutor.processPendingSchedules();
    } catch (error) {
      this.logger.error('Failed to process pending schedules:', error);
    }
  }
}
