import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailAutomation, WorkflowStep } from '../entities/email-automation.entity';
import { AutomationExecution, ExecutionStatus, StepResult } from '../entities/automation-execution.entity';
import { AutomationSchedule, ScheduleStatus } from '../entities/automation-schedule.entity';
import { Subscriber } from '../entities/subscriber.entity';
import { EmailCampaignService } from '../email-campaign.service';
import { TenantService } from '../../../core/tenant/tenant.service';
import { Organization } from '../../organizations/entities/organization.entity';

/**
 * Workflow Executor Service
 * Executes automation workflow steps
 */
@Injectable()
export class WorkflowExecutorService {
  private readonly logger = new Logger(WorkflowExecutorService.name);

  constructor(
    @InjectRepository(EmailAutomation)
    private automationRepo: Repository<EmailAutomation>,
    @InjectRepository(AutomationExecution)
    private executionRepo: Repository<AutomationExecution>,
    @InjectRepository(AutomationSchedule)
    private scheduleRepo: Repository<AutomationSchedule>,
    @InjectRepository(Subscriber)
    private subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Organization)
    private organizationRepo: Repository<Organization>,
    private emailCampaignService: EmailCampaignService,
    private tenantService: TenantService,
  ) { }

  /**
   * Get current tenant ID from TenantService
   * @private
   */
  private getActiveTenantId(): string {
    return this.tenantService.getTenantId();
  }

  /**
   * Execute automation workflow for a subscriber
   */
  async executeWorkflow(
    automationId: string,
    subscriberId: string,
    triggerId?: string,
  ): Promise<AutomationExecution> {
    const tenantId = this.getActiveTenantId();
    this.logger.log(`Starting workflow execution for automation ${automationId}, subscriber ${subscriberId} for tenant ${tenantId}`);

    const automation = await this.automationRepo.findOne({
      where: { id: automationId, tenantId },
    });

    if (!automation) {
      throw new Error(`Automation ${automationId} not found`);
    }

    const subscriber = await this.subscriberRepo.findOne({
      where: { id: subscriberId, tenantId },
    });

    if (!subscriber) {
      throw new Error(`Subscriber ${subscriberId} not found`);
    }

    // Create execution record
    const execution = this.executionRepo.create({
      automationId,
      subscriberId,
      triggerId,
      status: ExecutionStatus.PENDING,
      currentStepIndex: 0,
      stepResults: [],
      tenantId,
    });

    const savedExecution = await this.executionRepo.save(execution);

    // Start execution asynchronously
    this.processExecution(savedExecution.id).catch((error) => {
      this.logger.error(`Failed to process execution ${savedExecution.id}:`, error);
    });

    return savedExecution;
  }

  /**
   * Process execution (main workflow loop)
   */
  async processExecution(executionId: string): Promise<void> {
    const tenantId = this.getActiveTenantId();
    const execution = await this.executionRepo.findOne({
      where: { id: executionId, tenantId },
      relations: ['automation', 'subscriber'],
    });

    if (!execution) {
      this.logger.error(`Execution ${executionId} not found`);
      return;
    }

    const { automation, subscriber } = execution;

    try {
      execution.start();
      await this.executionRepo.save(execution);

      let currentStep = automation.getFirstStep();
      let stepIndex = 0;

      while (currentStep) {
        this.logger.debug(`Executing step ${currentStep.id} (${currentStep.type})`);

        const stepResult = await this.executeStep(
          currentStep,
          automation,
          subscriber,
          execution,
        );

        execution.addStepResult(stepResult);
        await this.executionRepo.save(execution);

        // Check if step failed
        if (stepResult.status === 'failed') {
          execution.fail(stepResult.error || 'Step execution failed');
          await this.executionRepo.save(execution);
          break;
        }

        // Check for exit step
        if (currentStep.type === 'exit') {
          break;
        }

        // Get next step
        const conditionResult = stepResult.data?.conditionResult;
        currentStep = automation.getNextStep(currentStep.id, conditionResult);
        stepIndex++;

        // Safety check for infinite loops
        if (stepIndex > 100) {
          execution.fail('Maximum step limit reached (100 steps)');
          await this.executionRepo.save(execution);
          break;
        }
      }

      // Mark as completed if no errors
      if (execution.status === ExecutionStatus.RUNNING) {
        execution.complete();
        await this.executionRepo.save(execution);
        this.logger.log(`Execution ${executionId} completed successfully`);
      }

      // Update automation statistics
      automation.updateStatistics(execution);
      await this.automationRepo.save(automation);
    } catch (error) {
      this.logger.error(`Error processing execution ${executionId}:`, error);
      execution.fail(error.message || 'Unknown error');
      await this.executionRepo.save(execution);
    }
  }

  /**
   * Execute single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    automation: EmailAutomation,
    subscriber: Subscriber,
    execution: AutomationExecution,
  ): Promise<StepResult> {
    const startedAt = new Date();

    try {
      let result: any = {};

      switch (step.type) {
        case 'send_email':
          result = await this.executeSendEmail(step, subscriber);
          break;

        case 'delay':
          result = await this.executeDelay(step, automation, subscriber, execution);
          break;

        case 'condition':
          result = await this.executeCondition(step, subscriber);
          break;

        case 'split':
          result = await this.executeSplit(step, subscriber);
          break;

        case 'exit':
          result = { message: 'Workflow exit' };
          break;

        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      const completedAt = new Date();
      const executionTime = completedAt.getTime() - startedAt.getTime();

      return {
        stepId: step.id,
        stepType: step.type,
        status: 'completed',
        startedAt,
        completedAt,
        executionTime,
        data: result,
      };
    } catch (error) {
      const completedAt = new Date();
      const executionTime = completedAt.getTime() - startedAt.getTime();

      return {
        stepId: step.id,
        stepType: step.type,
        status: 'failed',
        startedAt,
        completedAt,
        executionTime,
        error: error.message || 'Step execution failed',
      };
    }
  }

  /**
   * Execute send_email step
   */
  private async executeSendEmail(
    step: WorkflowStep,
    subscriber: Subscriber,
  ): Promise<any> {
    const { templateId, subject, content, fromName } = step.config;

    // Send email using EmailCampaignService
    // This is simplified - you'd integrate with your actual email sending logic
    this.logger.debug(`Sending email to ${subscriber.email}: ${subject || 'from template'}`);

    // Simulate email sending
    const emailId = `email-${Date.now()}`;

    return {
      emailId,
      recipient: subscriber.email,
      subject,
      templateId,
      sentAt: new Date(),
    };
  }

  /**
   * Execute delay step
   */
  private async executeDelay(
    step: WorkflowStep,
    automation: EmailAutomation,
    subscriber: Subscriber,
    execution: AutomationExecution,
  ): Promise<any> {
    const { duration } = step.config; // duration in minutes

    if (!duration || duration <= 0) {
      throw new Error('Invalid delay duration');
    }

    const scheduledFor = new Date();
    scheduledFor.setMinutes(scheduledFor.getMinutes() + duration);

    // Create schedule record
    const schedule = this.scheduleRepo.create({
      automationId: automation.id,
      subscriberId: subscriber.id,
      stepIndex: execution.currentStepIndex,
      scheduledFor,
      status: ScheduleStatus.PENDING,
      tenantId: execution.tenantId,
    });

    await this.scheduleRepo.save(schedule);

    this.logger.debug(`Scheduled next step for ${scheduledFor.toISOString()}`);

    // Pause execution - will be resumed by scheduler
    execution.status = ExecutionStatus.PENDING;
    await this.executionRepo.save(execution);

    return {
      scheduleId: schedule.id,
      scheduledFor,
      delayMinutes: duration,
    };
  }

  /**
   * Execute condition step
   */
  private async executeCondition(
    step: WorkflowStep,
    subscriber: Subscriber,
  ): Promise<any> {
    const { condition } = step.config;

    if (!condition) {
      throw new Error('Condition not specified');
    }

    // Evaluate condition
    const conditionResult = this.evaluateCondition(condition, subscriber);

    this.logger.debug(`Condition "${condition}" evaluated to: ${conditionResult}`);

    return {
      condition,
      conditionResult,
    };
  }

  /**
   * Execute split step (A/B variant selection)
   */
  private async executeSplit(
    step: WorkflowStep,
    subscriber: Subscriber,
  ): Promise<any> {
    const { splitPercentages } = step.config;

    if (!splitPercentages || !Array.isArray(splitPercentages)) {
      throw new Error('Split percentages not configured');
    }

    // Random variant selection based on percentages
    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedPath = 0;

    for (let i = 0; i < splitPercentages.length; i++) {
      cumulative += splitPercentages[i];
      if (random <= cumulative) {
        selectedPath = i;
        break;
      }
    }

    this.logger.debug(`Split test: selected path ${selectedPath}`);

    return {
      selectedPath,
      splitPercentages,
      random,
    };
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(condition: string, subscriber: Subscriber): boolean {
    try {
      // Simple condition evaluation
      // Format: "field operator value" (e.g., "status equals active")
      const parts = condition.split(' ');
      if (parts.length !== 3) {
        throw new Error('Invalid condition format');
      }

      const [field, operator, value] = parts;
      const subscriberValue = subscriber[field];

      switch (operator) {
        case 'equals':
          return subscriberValue === value;
        case 'not_equals':
          return subscriberValue !== value;
        case 'contains':
          return typeof subscriberValue === 'string' && subscriberValue.includes(value);
        case 'greater_than':
          return Number(subscriberValue) > Number(value);
        case 'less_than':
          return Number(subscriberValue) < Number(value);
        default:
          throw new Error(`Unknown operator: ${operator}`);
      }
    } catch (error) {
      this.logger.error(`Failed to evaluate condition "${condition}":`, error);
      return false;
    }
  }

  /**
   * Resume execution after delay
   */
  async resumeExecution(scheduleId: string): Promise<void> {
    const tenantId = this.getActiveTenantId();
    const schedule = await this.scheduleRepo.findOne({
      where: { id: scheduleId, tenantId },
    });

    if (!schedule) {
      this.logger.error(`Schedule ${scheduleId} not found`);
      return;
    }

    schedule.markAsProcessing();
    await this.scheduleRepo.save(schedule);

    try {
      // Find execution
      const execution = await this.executionRepo.findOne({
        where: {
          automationId: schedule.automationId,
          subscriberId: schedule.subscriberId,
          status: ExecutionStatus.PENDING,
          tenantId,
        },
      });

      if (!execution) {
        throw new Error('Execution not found');
      }

      // Resume processing
      execution.status = ExecutionStatus.RUNNING;
      await this.executionRepo.save(execution);

      await this.processExecution(execution.id);

      schedule.markAsCompleted();
      await this.scheduleRepo.save(schedule);
    } catch (error) {
      this.logger.error(`Failed to resume execution from schedule ${scheduleId}:`, error);
      schedule.markAsFailed(error.message);
      await this.scheduleRepo.save(schedule);
    }
  }

  /**
   * Process pending schedules (cron job)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingSchedules(): Promise<void> {
    this.logger.log('Processing pending schedules...');

    const activeOrganizations = await this.organizationRepo.find({ where: { isActive: true } });

    for (const org of activeOrganizations) {
      await this.tenantService.runWithTenant({ tenantId: org.slug, source: 'system' }, async () => {
        const pendingSchedules = await this.scheduleRepo
          .createQueryBuilder('schedule')
          .where('schedule.status = :status', { status: ScheduleStatus.PENDING })
          .andWhere('schedule.tenantId = :tenantId', { tenantId: org.slug })
          .andWhere('schedule.scheduledFor <= :now', { now: new Date() })
          .limit(100)
          .getMany();

        if (pendingSchedules.length > 0) {
          this.logger.log(`Processing ${pendingSchedules.length} pending schedules for tenant ${org.slug}`);
          for (const schedule of pendingSchedules) {
            await this.resumeExecution(schedule.id);
          }
        }
      });
    }
  }
}
