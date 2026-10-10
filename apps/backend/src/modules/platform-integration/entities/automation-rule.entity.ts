import {
  Entity,
  Column,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { PlatformEventType } from './platform-event.entity';
import { ActionImpactLevel } from './automation-approval.entity';

/**
 * Automation Action Types
 */
export enum AutomationActionType {
  // Email Marketing Actions
  CREATE_CAMPAIGN = 'email.create_campaign',
  SEND_EMAIL = 'email.send',
  ADD_TO_SEGMENT = 'email.add_to_segment',
  REMOVE_FROM_SEGMENT = 'email.remove_from_segment',

  // Notification Actions
  SEND_NOTIFICATION = 'notification.send',
  SEND_SMS = 'notification.sms',

  // Webhook Actions
  TRIGGER_WEBHOOK = 'webhook.trigger',

  // CMS Actions
  CREATE_PAGE_DRAFT = 'cms.create_draft',
  PUBLISH_PAGE = 'cms.publish',
  ARCHIVE_PAGE = 'cms.archive',

  // Future: Social Media (v2.0)
  // POST_TO_SOCIAL = 'social.post',
  // SCHEDULE_POST = 'social.schedule',

  // Future: Support (v2.0)
  // ASSIGN_TICKET = 'support.assign',
  // NOTIFY_AGENT = 'support.notify_agent',
}

/**
 * Automation Action Interface
 */
export interface AutomationAction {
  type: AutomationActionType;
  config: Record<string, any>;
  order: number; // Execution order
}

/**
 * Automation Rule Entity
 * 
 * Defines rules for automatic actions when platform events occur
 * 
 * Example:
 * - When event.created → Create email campaign
 * - When certificate.issued → Send congratulations email
 * - When page.published → Add to email newsletter segment
 */
@Entity('automation_rules')
@Index(['tenantId', 'triggerEventType'])
@Index('idx_automation_rules_active', ['isActive'])
@Index('idx_automation_rules_deleted', ['deletedAt'])
export class AutomationRule extends BaseEntity {
  /**
   * Rule name
   */
  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  /**
   * Rule description
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  /**
   * Is rule active?
   */
  @Column({
    type: 'boolean',
    default: true,
  })
  @Index()
  isActive: boolean;

  /**
   * Event type that triggers this rule
   */
  @Column({
    type: 'varchar',
    length: 100,
  })
  @Index()
  triggerEventType: PlatformEventType;

  /**
   * Conditions that must be met for rule to trigger
   * 
   * Examples:
   * - { "status": "published" } - Only if event status is published
   * - { "category": "blog" } - Only if page category is blog
   * - { "attendeeCount": { "$gt": 50 } } - Only if attendee count > 50
   */
  @Column({
    type: 'jsonb',
    default: {},
  })
  triggerConditions: Record<string, any>;

  /**
   * Actions to execute when rule triggers
   * 
   * Example:
   * [
   *   {
   *     type: 'email.create_campaign',
   *     config: { templateId: 'xxx', segmentId: 'yyy' },
   *     order: 1
   *   },
   *   {
   *     type: 'notification.send',
   *     config: { recipients: ['admin'], message: 'New campaign created' },
   *     order: 2
   *   }
   * ]
   */
  @Column({
    type: 'jsonb',
  })
  actions: AutomationAction[];

  /**
   * Priority (higher = executed first)
   */
  @Column({
    type: 'int',
    default: 0,
  })
  priority: number;

  /**
   * APPROVAL SETTINGS
   * Controls if and how this automation requires approval
   */

  /**
   * Does this rule require approval before execution?
   */
  @Column({
    type: 'boolean',
    default: false,
    name: 'requires_approval',
  })
  requiresApproval: boolean;

  /**
   * Impact level of this automation's actions
   * Determines approval requirements
   */
  @Column({
    type: 'varchar',
    length: 50,
    default: 'medium',
    name: 'impact_level',
  })
  impactLevel: ActionImpactLevel;

  /**
   * Auto-approval conditions
   * If these conditions are met, approval can be skipped
   * 
   * Examples:
   * - { "eventSource": "admin" } - Auto-approve if triggered by admin
   * - { "userRole": "manager" } - Auto-approve if user is manager
   * - { "affectedUsers": { "$lt": 10 } } - Auto-approve if < 10 users affected
   */
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'auto_approval_conditions',
  })
  autoApprovalConditions?: Record<string, any>;

  /**
   * List of user IDs who can approve this automation
   * Empty array = any admin can approve
   */
  @Column({
    type: 'jsonb',
    default: [],
    name: 'authorized_approvers',
  })
  authorizedApprovers: string[];

  /**
   * Total number of times this rule has been executed
   */
  @Column({
    type: 'int',
    default: 0,
  })
  executionCount: number;

  /**
   * Last time this rule was executed
   */
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  lastExecutedAt?: Date;

  /**
   * Last execution result
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  lastExecutionResult?: {
    success: boolean;
    error?: string;
    actionsExecuted: number;
    timestamp: Date;
  };



  /**
   * Check if rule should trigger for given event
   */
  shouldTrigger(event: any): boolean {
    // Check if event type matches
    if (event.eventType !== this.triggerEventType) {
      return false;
    }

    // Check if rule is active
    if (!this.isActive) {
      return false;
    }

    // Check conditions
    return this.matchesConditions(event.payload);
  }

  /**
   * Check if event payload matches trigger conditions
   */
  private matchesConditions(payload: Record<string, any>): boolean {
    // If no conditions, always match
    if (!this.triggerConditions || Object.keys(this.triggerConditions).length === 0) {
      return true;
    }

    // Check each condition
    for (const [key, value] of Object.entries(this.triggerConditions)) {
      const payloadValue = payload[key];

      // Handle operators like $gt, $lt, etc.
      if (typeof value === 'object' && value !== null) {
        for (const [operator, operandValue] of Object.entries(value)) {
          switch (operator) {
            case '$gt':
              if (!(payloadValue > (operandValue as number))) return false;
              break;
            case '$gte':
              if (!(payloadValue >= (operandValue as number))) return false;
              break;
            case '$lt':
              if (!(payloadValue < (operandValue as number))) return false;
              break;
            case '$lte':
              if (!(payloadValue <= (operandValue as number))) return false;
              break;
            case '$ne':
              if (payloadValue === operandValue) return false;
              break;
            case '$in':
              if (!Array.isArray(operandValue) || !operandValue.includes(payloadValue)) {
                return false;
              }
              break;
            default:
              // Unknown operator
              return false;
          }
        }
      } else {
        // Simple equality check
        if (payloadValue !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Record execution
   */
  recordExecution(success: boolean, error?: string, actionsExecuted?: number): void {
    this.executionCount++;
    this.lastExecutedAt = new Date();
    this.lastExecutionResult = {
      success,
      error,
      actionsExecuted: actionsExecuted || 0,
      timestamp: new Date(),
    };
  }
}
