import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EmailAutomation, AutomationStatus } from '../entities/email-automation.entity';
import { AutomationExecution, ExecutionStatus } from '../entities/automation-execution.entity';
import { AutomationTrigger, TriggerStatus } from '../entities/automation-trigger.entity';
import { Subscriber } from '../entities/subscriber.entity';
import { TenantService } from '../../../core/tenant/tenant.service';
import { CreateAutomationDto, UpdateAutomationDto, GetExecutionsQueryDto } from '../dto/automation.dto';
import { TriggerEvaluatorService } from './trigger-evaluator.service';

/**
 * Automation Service
 * Manages email automation workflows
 */
@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    @InjectRepository(EmailAutomation)
    private automationRepo: Repository<EmailAutomation>,
    @InjectRepository(AutomationExecution)
    private executionRepo: Repository<AutomationExecution>,
    @InjectRepository(AutomationTrigger)
    private triggerRepo: Repository<AutomationTrigger>,
    @InjectRepository(Subscriber)
    private subscriberRepo: Repository<Subscriber>,
    private readonly triggerEvaluator: TriggerEvaluatorService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Get current tenant ID from TenantService
   * @private
   */
  private getActiveTenantId(): string {
    return this.tenantService.getTenantId();
  }

  /**
   * Create automation
   */
  async create(dto: CreateAutomationDto, tenantId: string): Promise<EmailAutomation> {
    // Validate workflow steps
    this.validateWorkflowSteps(dto.workflowSteps);

    const automation = this.automationRepo.create({
      name: dto.name,
      description: dto.description,
      triggerType: dto.triggerType,
      triggerConfig: dto.triggerConfig,
      workflowSteps: dto.workflowSteps,
      segmentId: dto.segmentId,
      isActive: false,
      tenantId,
    });

    const saved = await this.automationRepo.save(automation);
    this.logger.log(`Created automation: ${saved.id}`);
    return saved;
  }

  /**
   * Find all automations
   */
  async findAll(tenantId: string): Promise<EmailAutomation[]> {
    return this.automationRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find automation by ID
   */
  async findOne(id: string, tenantId: string): Promise<EmailAutomation> {
    const automation = await this.automationRepo.findOne({
      where: { id, tenantId },
      relations: ['segment'],
    });

    if (!automation) {
      throw new NotFoundException(`Automation ${id} not found`);
    }

    return automation;
  }

  /**
   * Update automation
   */
  async update(id: string, dto: UpdateAutomationDto, tenantId: string): Promise<EmailAutomation> {
    const automation = await this.findOne(id, tenantId);

    // Prevent editing active automations
    if (automation.isActive && dto.workflowSteps) {
      throw new BadRequestException('Cannot modify workflow of active automation');
    }

    // Validate workflow steps if provided
    if (dto.workflowSteps) {
      this.validateWorkflowSteps(dto.workflowSteps);
    }

    Object.assign(automation, dto);
    const updated = await this.automationRepo.save(automation);
    this.logger.log(`Updated automation: ${id}`);
    return updated;
  }

  /**
   * Delete automation
   */
  async remove(id: string, tenantId: string): Promise<void> {
    const automation = await this.findOne(id, tenantId);

    if (automation.isActive) {
      throw new BadRequestException('Cannot delete active automation. Pause it first.');
    }

    await this.automationRepo.softRemove(automation);
    this.logger.log(`Deleted automation: ${id}`);
  }

  /**
   * Activate automation
   */
  async activate(id: string, tenantId: string, registerExisting: boolean = false): Promise<EmailAutomation> {
    const automation = await this.findOne(id, tenantId);

    if (!automation.canBeActivated()) {
      throw new BadRequestException('Automation cannot be activated. Check workflow steps.');
    }

    automation.activate();
    const activated = await this.automationRepo.save(automation);

    // Register existing subscribers if requested
    if (registerExisting) {
      await this.registerExistingSubscribers(automation);
    }

    this.logger.log(`Activated automation: ${id}`);
    return activated;
  }

  /**
   * Pause automation
   */
  async pause(id: string, tenantId: string, cancelPending: boolean = false): Promise<EmailAutomation> {
    const automation = await this.findOne(id, tenantId);

    automation.pause();
    const paused = await this.automationRepo.save(automation);

    // Cancel pending executions if requested
    if (cancelPending) {
      await this.executionRepo.update(
        {
          automationId: id,
          tenantId,
          status: In([ExecutionStatus.PENDING, ExecutionStatus.RUNNING]),
        },
        { status: ExecutionStatus.CANCELLED },
      );
    }

    this.logger.log(`Paused automation: ${id}`);
    return paused;
  }

  /**
   * Get executions with pagination
   */
  async getExecutions(query: GetExecutionsQueryDto, tenantId: string): Promise<{
    executions: AutomationExecution[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { automationId, subscriberId, status, page = 1, limit = 20 } = query;

    const qb = this.executionRepo
      .createQueryBuilder('execution')
      .leftJoinAndSelect('execution.automation', 'automation')
      .leftJoinAndSelect('execution.subscriber', 'subscriber');

    if (automationId) {
      qb.andWhere('execution.automationId = :automationId', { automationId });
    }

    if (subscriberId) {
      qb.andWhere('execution.subscriberId = :subscriberId', { subscriberId });
    }

    if (status) {
      qb.andWhere('execution.status = :status', { status });
    }

    qb.andWhere('execution.tenantId = :tenantId', { tenantId });

    const total = await qb.getCount();
    const executions = await qb
      .orderBy('execution.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      executions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get automation analytics
   */
  async getAnalytics(
    automationId: string,
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const automation = await this.findOne(automationId, tenantId);

    const qb = this.executionRepo
      .createQueryBuilder('execution')
      .where('execution.automationId = :automationId', { automationId });

    if (startDate) {
      qb.andWhere('execution.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('execution.createdAt <= :endDate', { endDate });
    }

    const executions = await qb.getMany();

    const totalExecutions = executions.length;
    const completedExecutions = executions.filter(
      (e) => e.status === ExecutionStatus.COMPLETED,
    ).length;
    const failedExecutions = executions.filter(
      (e) => e.status === ExecutionStatus.FAILED,
    ).length;

    const successRate =
      totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;

    const avgExecutionTime =
      executions.length > 0
        ? executions.reduce((sum, e) => sum + (e.executionTime || 0), 0) /
        executions.length
        : 0;

    // Step performance
    const stepPerformance = this.calculateStepPerformance(
      executions,
      automation.workflowSteps,
    );

    // Timeline (group by day)
    const timeline = this.calculateTimeline(executions);

    return {
      automationId: automation.id,
      automationName: automation.name,
      totalExecutions,
      completedExecutions,
      failedExecutions,
      successRate: Math.round(successRate * 100) / 100,
      avgExecutionTime: Math.round(avgExecutionTime),
      totalSubscribers: automation.subscriberCount,
      activeSubscribers: await this.getActiveSubscriberCount(automationId),
      stepPerformance,
      timeline,
    };
  }

  /**
   * Test automation with a subscriber
   */
  async test(
    automationId: string,
    subscriberId: string,
    tenantId: string,
    dryRun: boolean = true,
  ): Promise<any> {
    const automation = await this.findOne(automationId, tenantId);
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: subscriberId, tenantId },
    });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber ${subscriberId} not found`);
    }

    if (dryRun) {
      // Simulate execution without actually sending emails
      return {
        automation: {
          id: automation.id,
          name: automation.name,
        },
        subscriber: {
          id: subscriber.id,
          email: subscriber.email,
        },
        steps: automation.workflowSteps.map((step) => ({
          id: step.id,
          type: step.type,
          config: step.config,
          status: 'simulated',
        })),
        message: 'Test simulation completed successfully',
      };
    }

    const execution = this.executionRepo.create({
      automationId,
      status: ExecutionStatus.PENDING,
      tenantId,
    });

    await this.executionRepo.save(execution);

    return {
      executionId: execution.id,
      message: 'Test execution created',
    };
  }

  /**
   * Private: Validate workflow steps
   */
  private validateWorkflowSteps(steps: any[]): void {
    if (!steps || steps.length === 0) {
      throw new BadRequestException('Workflow must have at least one step');
    }

    // Check unique step IDs
    const stepIds = steps.map((s) => s.id);
    const uniqueIds = new Set(stepIds);
    if (stepIds.length !== uniqueIds.size) {
      throw new BadRequestException('Workflow steps must have unique IDs');
    }

    // Validate step references
    for (const step of steps) {
      if (step.nextStepId && !stepIds.includes(step.nextStepId)) {
        throw new BadRequestException(
          `Invalid nextStepId reference: ${step.nextStepId}`,
        );
      }

      if (step.conditionalPaths) {
        for (const path of step.conditionalPaths) {
          if (!stepIds.includes(path.nextStepId)) {
            throw new BadRequestException(
              `Invalid conditional path nextStepId: ${path.nextStepId}`,
            );
          }
        }
      }

      // Validate step config based on type
      this.validateStepConfig(step);
    }
  }

  /**
   * Private: Validate step configuration
   */
  private validateStepConfig(step: any): void {
    switch (step.type) {
      case 'send_email':
        if (!step.config.templateId && !step.config.subject) {
          throw new BadRequestException(
            `send_email step ${step.id} requires templateId or subject`,
          );
        }
        break;

      case 'delay':
        if (!step.config.duration || typeof step.config.duration !== 'number') {
          throw new BadRequestException(
            `delay step ${step.id} requires duration (number in minutes)`,
          );
        }
        break;

      case 'condition':
        if (!step.config.condition || !step.conditionalPaths) {
          throw new BadRequestException(
            `condition step ${step.id} requires condition and conditionalPaths`,
          );
        }
        break;

      case 'split':
        if (!step.conditionalPaths || step.conditionalPaths.length < 2) {
          throw new BadRequestException(
            `split step ${step.id} requires at least 2 conditional paths`,
          );
        }
        break;

      case 'exit':
        // No specific validation for exit step
        break;

      default:
        throw new BadRequestException(`Invalid step type: ${step.type}`);
    }
  }

  /**
   * Private: Register existing subscribers
   */
  private async registerExistingSubscribers(
    automation: EmailAutomation,
  ): Promise<void> {
    let subscribers: Subscriber[];

    if (automation.segmentId) {
      subscribers = await this.subscriberRepo
        .createQueryBuilder('subscriber')
        .where('subscriber.status = :status', { status: 'active' })
        .andWhere('subscriber.tenantId = :tenantId', { tenantId: automation.tenantId })
        .andWhere(':segmentId = ANY(subscriber.segments)', {
          segmentId: automation.segmentId,
        })
        .getMany();
    } else {
      subscribers = await this.subscriberRepo.find({
        where: { status: 'active', tenantId: automation.tenantId },
      });
    }

    for (const subscriber of subscribers) {
      const existingTrigger = await this.triggerRepo.findOne({
        where: {
          automationId: automation.id,
          subscriberId: subscriber.id,
          tenantId: automation.tenantId,
        },
      });

      if (!existingTrigger) {
        const trigger = this.triggerRepo.create({
          automationId: automation.id,
          subscriberId: subscriber.id,
          triggerType: automation.triggerType,
          triggerData: { source: 'existing_subscribers' },
          status: TriggerStatus.PENDING,
          tenantId: automation.tenantId,
        });

        await this.triggerRepo.save(trigger);
      }
    }

    this.logger.log(
      `Registered ${subscribers.length} existing subscribers to automation ${automation.id}`,
    );
  }

  /**
   * Private: Calculate step performance
   */
  private calculateStepPerformance(
    executions: AutomationExecution[],
    workflowSteps: any[],
  ): any[] {
    const stepStats = new Map();

    for (const step of workflowSteps) {
      stepStats.set(step.id, {
        stepId: step.id,
        stepType: step.type,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalTime: 0,
      });
    }

    for (const execution of executions) {
      for (const result of execution.stepResults || []) {
        const stats = stepStats.get(result.stepId);
        if (stats) {
          stats.totalExecutions++;
          if (result.status === 'completed') {
            stats.successfulExecutions++;
          } else if (result.status === 'failed') {
            stats.failedExecutions++;
          }
          stats.totalTime += result.executionTime || 0;
        }
      }
    }

    return Array.from(stepStats.values()).map((stats) => ({
      ...stats,
      avgExecutionTime:
        stats.totalExecutions > 0
          ? Math.round(stats.totalTime / stats.totalExecutions)
          : 0,
    }));
  }

  /**
   * Private: Calculate timeline
   */
  private calculateTimeline(executions: AutomationExecution[]): any[] {
    const timeline = new Map();

    for (const execution of executions) {
      const date = execution.createdAt.toISOString().split('T')[0];
      const stats = timeline.get(date) || {
        date,
        executions: 0,
        completed: 0,
        failed: 0,
      };

      stats.executions++;
      if (execution.status === ExecutionStatus.COMPLETED) {
        stats.completed++;
      } else if (execution.status === ExecutionStatus.FAILED) {
        stats.failed++;
      }

      timeline.set(date, stats);
    }

    return Array.from(timeline.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  /**
   * Private: Get active subscriber count
   */
  private async getActiveSubscriberCount(automationId: string): Promise<number> {
    return this.executionRepo.count({
      where: {
        automationId,
        status: In([ExecutionStatus.PENDING, ExecutionStatus.RUNNING]),
      },
    });
  }
}
