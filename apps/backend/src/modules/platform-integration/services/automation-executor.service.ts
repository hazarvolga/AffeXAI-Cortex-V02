import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { AutomationRule, AutomationAction } from '../entities/automation-rule.entity';
import { AutomationApproval, ApprovalStatus, ApprovalPriority, ActionImpactLevel } from '../entities/automation-approval.entity';
import { PlatformEvent } from '../entities/platform-event.entity';
import { EmailCampaignService } from '../../email-marketing/email-campaign.service';
import { WebhookService } from './webhook.service';
import { TenantService } from '../../../core/tenant/tenant.service';
import { randomUUID } from 'crypto';

/**
 * AutomationExecutor Service
 * 
 * Executes automation actions when rules are triggered.
 * Handles approval workflow integration.
 * 
 * Features:
 * - Action execution with approval checks
 * - Multi-action sequencing
 * - Error handling and retry logic
 * - Execution logging
 * - Auto-approval based on conditions
 */
@Injectable()
export class AutomationExecutorService {
  private readonly logger = new Logger(AutomationExecutorService.name);

  constructor(
    @InjectRepository(AutomationRule)
    private readonly ruleRepository: Repository<AutomationRule>,
    @InjectRepository(AutomationApproval)
    private readonly approvalRepository: Repository<AutomationApproval>,
    @Inject(forwardRef(() => EmailCampaignService))
    private readonly emailCampaignService: EmailCampaignService,
    private readonly webhookService: WebhookService,
    private readonly tenantService: TenantService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Listen to automation trigger events from EventBus
   */
  @OnEvent('automation.trigger')
  async handleAutomationTrigger(data: {
    rule: AutomationRule;
    event: PlatformEvent;
  }): Promise<void> {
    const { rule, event } = data;

    this.logger.log(
      `Handling automation trigger: ${rule.name} (${rule.id})`,
      { eventId: event.id },
    );

    try {
      await this.dispatch(rule, event);
    } catch (error) {
      this.logger.error(
        `Failed to handle automation trigger: ${rule.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /** Durable workers call this method so execution failures can be retried. */
  async dispatch(rule: AutomationRule, event: PlatformEvent): Promise<void> {
    if (!event.tenantId || rule.tenantId !== event.tenantId) {
      throw new Error('Automation rule and event tenant mismatch');
    }
    await this.tenantService.runWithTenant({ tenantId: event.tenantId }, async () => {
      if (
        !rule.requiresApproval ||
        rule.impactLevel === ActionImpactLevel.LOW ||
        rule.impactLevel === ActionImpactLevel.CRITICAL
      ) {
        throw new Error('Automation rule violates the mandatory approval policy');
      }
      await this.createApprovalRequest(rule, event);
    });
  }

  /**
   * Create approval request for automation
   */
  private async createApprovalRequest(
    rule: AutomationRule,
    event: PlatformEvent,
  ): Promise<void> {
    const existing = await this.approvalRepository.findOne({
      where: { ruleId: rule.id, eventId: event.id, tenantId: event.tenantId } as any,
    });
    if (existing) return;
    // Determine priority based on impact level
    const priority = this.getPriorityFromImpactLevel(rule.impactLevel);

    // Create approval request
    const approval = this.approvalRepository.create({
      ruleId: rule.id,
      eventId: event.id,
      tenantId: event.tenantId, // Ensure approval belongs to same tenant
      status: ApprovalStatus.PENDING,
      priority,
      impactLevel: rule.impactLevel,
      pendingActions: rule.actions.map(action => ({
        type: action.type,
        config: action.config,
        order: action.order,
        estimatedImpact: this.estimateActionImpact(action, event),
      })),
      requestedBy: event.metadata?.userId || 'system',
      requestReason: `Event triggered: ${event.eventType}`,
      requestContext: {
        eventId: event.id,
        eventType: event.eventType,
        occurredAt: event.createdAt,
        authorizedApprovers: [...(rule.authorizedApprovers ?? [])],
      },
      requiredApprovals: AutomationApproval.getRequiredApprovalCount(rule.impactLevel),
      currentApprovals: 0,
      expiresAt: AutomationApproval.getExpirationTime(priority),
    });

    await this.approvalRepository.save(approval);

    this.logger.log(
      `Approval request created for rule: ${rule.name}`,
      {
        ruleId: rule.id,
        approvalId: approval.id,
        requiredApprovals: approval.requiredApprovals,
        expiresAt: approval.expiresAt,
      },
    );

    // NOTE: Notification to approvers planned with NotificationService integration
    // await this.notificationService.notifyApprovers(approval);
  }

  /**
   * Check if auto-approval conditions are met
   */
  private shouldAutoApprove(rule: AutomationRule, event: PlatformEvent): boolean {
    // Low impact level always auto-approves
    if (rule.impactLevel === ActionImpactLevel.LOW) {
      return true;
    }

    // Check custom auto-approval conditions
    if (!rule.autoApprovalConditions) {
      return false;
    }

    // Example conditions:
    // { "userRole": "manager" } - Auto-approve if user is manager
    // { "affectedUsers": { "$lt": 10 } } - Auto-approve if < 10 users affected
    // { "eventSource": "admin" } - Auto-approve if triggered by admin

    const conditions = rule.autoApprovalConditions;
    const metadata = event.metadata || {};

    // Simple condition matching (can be enhanced)
    for (const [key, value] of Object.entries(conditions)) {
      if (metadata[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get priority from impact level
   */
  private getPriorityFromImpactLevel(impactLevel: ActionImpactLevel): ApprovalPriority {
    switch (impactLevel) {
      case ActionImpactLevel.CRITICAL:
        return ApprovalPriority.URGENT;
      case ActionImpactLevel.HIGH:
        return ApprovalPriority.HIGH;
      case ActionImpactLevel.MEDIUM:
        return ApprovalPriority.MEDIUM;
      case ActionImpactLevel.LOW:
      default:
        return ApprovalPriority.LOW;
    }
  }

  /**
   * Estimate impact of an action
   */
  private estimateActionImpact(
    action: AutomationAction,
    event: PlatformEvent,
  ): {
    affectedUsers?: number;
    affectedRecords?: number;
    externalCalls?: number;
  } {
    // This is a simplified estimation
    // In real implementation, you'd query the database
    const impact: any = {};

    if (action.type.includes('email')) {
      // Email actions
      impact.affectedUsers = event.payload.recipientCount || 0;
    }

    if (action.type.includes('webhook')) {
      // Webhook actions
      impact.externalCalls = 1;
    }

    if (action.type.includes('bulk') || action.type.includes('segment')) {
      // Bulk operations
      impact.affectedRecords = event.payload.count || 0;
    }

    return impact;
  }

  /**
   * Execute automation rule
   */
  async executeRule(rule: AutomationRule, event: PlatformEvent): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`Executing automation rule: ${rule.name}`, {
      ruleId: rule.id,
      eventId: event.id,
      actionCount: rule.actions.length,
    });

    const sortedActions = [...rule.actions].sort((a, b) => a.order - b.order);
    let executedCount = 0;
    const errors: string[] = [];

    for (const action of sortedActions) {
      try {
        await this.executeIdempotentAction(rule, action, event);
        executedCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown execution error';
        this.logger.error(`Failed to execute action: ${action.type}`, message);
        errors.push(`${action.type}: ${message}`);
      }
    }

    const timestamp = new Date();
    const result = {
      success: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      actionsExecuted: executedCount,
      timestamp,
    };
    await this.ruleRepository.update(
      { id: rule.id, tenantId: event.tenantId } as any,
      {
        executionCount: () => '"executionCount" + 1',
        lastExecutedAt: timestamp,
        lastExecutionResult: result,
      },
    );

    this.logger.log(`Automation rule execution completed: ${rule.name}`, {
      ruleId: rule.id,
      success: result.success,
      executedActions: executedCount,
      totalActions: sortedActions.length,
      duration: `${Date.now() - startTime}ms`,
    });
    if (errors.length > 0) throw new Error(result.error);
  }

  private async executeIdempotentAction(
    rule: AutomationRule,
    action: AutomationAction,
    event: PlatformEvent,
  ): Promise<void> {
    const actionLeaseToken = randomUUID();
    const claimed: { status: string; lease_token: string }[] = await this.dataSource.query(
      `INSERT INTO automation_action_executions
         (event_id, rule_id, tenant_id, action_order, lease_token)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (event_id, rule_id, action_order) DO UPDATE
         SET status = 'processing', attempts = automation_action_executions.attempts + 1,
             started_at = now(), finished_at = NULL, last_error_code = NULL,
             lease_token = $5
       WHERE automation_action_executions.status = 'failed'
          OR (automation_action_executions.status = 'processing'
              AND automation_action_executions.started_at < now() - interval '5 minutes')
       RETURNING status, lease_token`,
      [event.id, rule.id, event.tenantId, action.order, actionLeaseToken],
    );
    if (claimed.length === 0) {
      const existing: { status: string }[] = await this.dataSource.query(
        `SELECT status FROM automation_action_executions
         WHERE event_id = $1 AND rule_id = $2 AND tenant_id = $3 AND action_order = $4`,
        [event.id, rule.id, event.tenantId, action.order],
      );
      if (existing[0]?.status === 'delivered') return;
      throw new Error('Automation action is already being processed');
    }

    const heartbeat = setInterval(() => {
      void this.dataSource.query(
        `UPDATE automation_action_executions SET started_at = now()
         WHERE event_id = $1 AND rule_id = $2 AND tenant_id = $3 AND action_order = $4
           AND lease_token = $5 AND status = 'processing'
         RETURNING lease_token`,
        [event.id, rule.id, event.tenantId, action.order, actionLeaseToken],
      ).then((renewed: Array<{ lease_token: string }>) => {
        if (renewed.length === 0) {
          this.logger.warn('Automation action lease ownership was lost');
        }
      }).catch(() => this.logger.warn('Automation action heartbeat failed'));
    }, 60_000);
    heartbeat.unref();
    try {
      await this.executeAction(rule, action, event);
      const delivered: Array<{ lease_token: string }> = await this.dataSource.query(
        `UPDATE automation_action_executions SET status = 'delivered', finished_at = now()
         WHERE event_id = $1 AND rule_id = $2 AND tenant_id = $3 AND action_order = $4
           AND lease_token = $5 AND status = 'processing'
         RETURNING lease_token`,
        [event.id, rule.id, event.tenantId, action.order, actionLeaseToken],
      );
      if (delivered.length === 0) {
        throw new Error('Automation action lease ownership was lost');
      }
    } catch (error) {
      await this.dataSource.query(
        `UPDATE automation_action_executions SET status = 'failed', finished_at = now(),
            last_error_code = 'execution_failed'
         WHERE event_id = $1 AND rule_id = $2 AND tenant_id = $3 AND action_order = $4
           AND lease_token = $5 AND status = 'processing'
         RETURNING lease_token`,
        [event.id, rule.id, event.tenantId, action.order, actionLeaseToken],
      );
      throw error;
    } finally {
      clearInterval(heartbeat);
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    rule: AutomationRule,
    action: AutomationAction,
    event: PlatformEvent,
  ): Promise<void> {
    this.logger.debug(`Executing action: ${action.type}`, {
      config: action.config,
    });

    switch (action.type) {
      case 'email.create_campaign':
        // A deterministic slug lets a retry observe a campaign that was created
        // before a process crash but whose action ledger was not yet acknowledged.
        const campaignSlug = `automation-${event.id}-${rule.id}-${action.order}`;
        try {
          const existingCampaign = await this.emailCampaignService.findBySlug(campaignSlug);
          this.logger.log(`Reused automation campaign: ${existingCampaign.id}`, {
            campaignId: existingCampaign.id,
          });
          break;
        } catch (error) {
          if (!(error instanceof Error) || error.message !== 'Campaign not found by slug') throw error;
        }
        const campaignData = {
          ...action.config,
          name: action.config.name || `Auto Campaign - ${event.eventType}`,
          subject: action.config.subject || 'Automated Campaign',
          content: action.config.content || '',
          status: 'draft',
          slug: campaignSlug,
        };
        const campaign = await this.emailCampaignService.create(campaignData); // Removed tenantId
        this.logger.log(`Created email campaign: ${campaign.id}`, { campaignId: campaign.id });
        break;

      case 'email.send':
        throw new Error(
          'email.send automation is disabled until crash-safe provider idempotency is enabled',
        );

      case 'email.add_to_segment':
        throw new Error('email.add_to_segment is not implemented');

      case 'notification.send':
        throw new Error('notification.send is not implemented');

      case 'webhook.trigger':
        // Trigger a webhook manually
        if (action.config.webhookId) {
          // Using event.tenantId to find webhook securely
          const tenantId = event.tenantId;
          const webhook = await this.webhookService.findOne(action.config.webhookId, tenantId);
          if (webhook) {
            await this.webhookService.triggerWebhook(
              webhook,
              event,
              `${event.id}:${rule.id}:${action.order}`,
            );
            this.logger.log(`Triggered webhook: ${webhook.name}`);
          } else {
            throw new Error(`Webhook not found: ${action.config.webhookId}`);
          }
        } else {
          throw new Error('webhook.trigger action requires webhookId');
        }
        break;

      case 'cms.create_draft':
        throw new Error('cms.create_draft is not implemented');

      case 'cms.publish':
        throw new Error('cms.publish is not implemented');

      default:
        throw new Error(`Unsupported automation action: ${action.type}`);
    }
  }

  /**
   * Execute approved automation
   * Called when approval is granted
   */
  async executeApprovedAutomation(approvalId: string, tenantId: string): Promise<void> {
    // Run execution within tenant context
    await this.tenantService.runWithTenant({ tenantId }, async () => {
      const approval = await this.approvalRepository.findOne({
        where: { id: approvalId, tenantId } as any,
        relations: ['rule', 'event'],
      });

      if (!approval) {
        throw new Error(`Approval not found: ${approvalId}`);
      }

      if (approval.status !== ApprovalStatus.APPROVED) {
        throw new Error(`Approval is not in approved status: ${approval.status}`);
      }

      if (approval.isExecuted) {
        this.logger.warn(`Approval already executed: ${approvalId}`);
        return;
      }

      try {
        // Execute the rule (only if event exists)
        if (approval.event) {
          const approvedRuleSnapshot = {
            ...approval.rule,
            actions: approval.pendingActions.map(({ type, config, order }) => ({
              type: type as AutomationAction['type'],
              config,
              order,
            })),
          } as AutomationRule;
          await this.executeRule(approvedRuleSnapshot, approval.event);
        }

        // Mark as executed
        approval.isExecuted = true;
        approval.executedAt = new Date();
        approval.executionResult = {
          success: true,
          actionsExecuted: approval.pendingActions.length,
          timestamp: new Date(),
        };

        await this.approvalRepository.save(approval);

        this.logger.log(
          `Approved automation executed successfully: ${approvalId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to execute approved automation: ${approvalId}`,
          error.stack,
        );

        // Mark execution as failed
        approval.isExecuted = false;
        approval.executionResult = {
          success: false,
          actionsExecuted: 0,
          errors: [error.message],
          timestamp: new Date(),
        };

        await this.approvalRepository.save(approval);
        throw error;
      }
    });
  }

  /**
   * Check and process expired approvals (cron job)
   */
  async processExpiredApprovals(): Promise<void> {
    const now = new Date();

    const expiredApprovals = await this.approvalRepository.find({
      where: {
        status: ApprovalStatus.PENDING,
        isExpired: false,
      },
    });

    let expiredCount = 0;

    for (const approval of expiredApprovals) {
      if (approval.checkExpiration()) {
        await this.approvalRepository.save(approval);
        expiredCount++;

        this.logger.log(
          `Approval expired: ${approval.id} (rule: ${approval.ruleId})`,
        );
      }
    }

    if (expiredCount > 0) {
      this.logger.log(`Processed ${expiredCount} expired approvals`);
    }
  }
}
