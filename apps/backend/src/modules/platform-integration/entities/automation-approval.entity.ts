import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { AutomationRule } from './automation-rule.entity';
import { PlatformEvent } from './platform-event.entity';

/**
 * Approval Status for Automation Actions
 * Tracks the lifecycle of an automation that requires approval
 */
export enum ApprovalStatus {
  PENDING = 'pending',           // Waiting for approval
  APPROVED = 'approved',         // Approved and executed
  REJECTED = 'rejected',         // Rejected by approver
  AUTO_APPROVED = 'auto_approved', // Auto-approved by system rules
  EXPIRED = 'expired',           // Approval timeout expired
}

/**
 * Approval Priority
 * Determines urgency of approval request
 */
export enum ApprovalPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Action Type Categories
 * Groups actions by their impact level
 */
export enum ActionImpactLevel {
  LOW = 'low',           // Safe to auto-approve (e.g., internal notifications)
  MEDIUM = 'medium',     // Requires single approval
  HIGH = 'high',         // Requires multiple approvals
  CRITICAL = 'critical', // Requires senior approval + 2FA
}

/**
 * Automation Approval Entity
 * 
 * Manages approval workflow for automation actions.
 * Prevents accidental/unwanted content publication.
 * 
 * Use Cases:
 * - Email campaign sending (prevent wrong content to wrong audience)
 * - Event publishing (prevent draft events going live)
 * - CMS page publishing (prevent unreviewed content)
 * - Certificate sending (prevent wrong certificates to wrong users)
 * - Webhook triggers to external systems
 * 
 * Features:
 * - Multi-level approval (single, double, senior)
 * - Auto-approval rules based on conditions
 * - Approval expiration (timeout)
 * - Approval history and audit trail
 * - Notification to approvers
 */
@Entity('automation_approvals')
@Index('idx_approval_status', ['status', 'createdAt'])
@Index('idx_approval_rule', ['ruleId', 'status'])
@Index('idx_approval_event', ['eventId'])
@Index('idx_approval_requester', ['requestedBy'])
@Index('idx_approval_expires', ['expiresAt'])
@Index('idx_approval_deleted', ['deletedAt'])
export class AutomationApproval extends BaseEntity {
  // Relationship: Which automation rule triggered this
  @Column({ type: 'uuid', name: 'rule_id' })
  ruleId: string;

  @ManyToOne(() => AutomationRule, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'rule_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  rule: AutomationRule;

  // Relationship: Which event triggered this
  @Column({ type: 'uuid', name: 'event_id', nullable: true })
  eventId?: string;

  @ManyToOne(() => PlatformEvent, { onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'event_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  event?: PlatformEvent;

  // Approval Details
  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  status: ApprovalStatus;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'medium',
  })
  priority: ApprovalPriority;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'medium',
    name: 'impact_level',
  })
  impactLevel: ActionImpactLevel;

  // What action will be executed if approved
  @Column({ type: 'jsonb', name: 'pending_actions' })
  pendingActions: Array<{
    type: string;           // AutomationActionType
    config: any;
    order: number;
    estimatedImpact?: {
      affectedUsers?: number;
      affectedRecords?: number;
      externalCalls?: number;
    };
  }>;

  // Request Information
  @Column({ type: 'varchar', length: 100, name: 'requested_by' })
  requestedBy: string; // User ID or 'system'

  @Column({ type: 'text', nullable: true, name: 'request_reason' })
  requestReason?: string; // Why this automation was triggered

  @Column({ type: 'jsonb', nullable: true, name: 'request_context' })
  requestContext?: Record<string, any>; // Event payload, metadata

  // Approval Information
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'approved_by' })
  approvedBy?: string; // User ID who approved/rejected

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt?: Date;

  @Column({ type: 'text', nullable: true, name: 'approval_comment' })
  approvalComment?: string; // Approver's comment/reason

  // Multi-Approval Support
  @Column({ type: 'jsonb', nullable: true, name: 'approval_chain' })
  approvalChain?: Array<{
    userId: string;
    userName: string;
    action: 'approved' | 'rejected';
    comment?: string;
    timestamp: Date;
    ipAddress?: string;
  }>;

  @Column({ type: 'int', default: 1, name: 'required_approvals' })
  requiredApprovals: number; // How many approvals needed

  @Column({ type: 'int', default: 0, name: 'current_approvals' })
  currentApprovals: number; // How many approvals received

  // Expiration
  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @Column({ type: 'boolean', default: false, name: 'is_expired' })
  isExpired: boolean;

  // Execution Result (after approval)
  @Column({ type: 'boolean', default: false, name: 'is_executed' })
  isExecuted: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'executed_at' })
  executedAt?: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'execution_result' })
  executionResult?: {
    success: boolean;
    actionsExecuted: number;
    errors?: string[];
    timestamp: Date;
  };

  // Notification Status
  @Column({ type: 'boolean', default: false, name: 'approvers_notified' })
  approversNotified: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'notified_users' })
  notifiedUsers?: string[]; // User IDs who were notified

  /**
   * Check if approval can be granted
   */
  canApprove(): boolean {
    return (
      this.status === ApprovalStatus.PENDING &&
      !this.isExpired &&
      !this.isExecuted
    );
  }

  /**
   * Check if approval has expired
   */
  checkExpiration(): boolean {
    if (!this.expiresAt) return false;

    const now = new Date();
    const expired = now > this.expiresAt;

    if (expired && !this.isExpired) {
      this.isExpired = true;
      this.status = ApprovalStatus.EXPIRED;
    }

    return expired;
  }

  /**
   * Add approval to chain
   */
  addApproval(
    userId: string,
    userName: string,
    action: 'approved' | 'rejected',
    comment?: string,
    ipAddress?: string
  ): void {
    this.approvalChain = [...(this.approvalChain ?? []), {
      userId,
      userName,
      action,
      comment,
      timestamp: new Date(),
      ipAddress,
    }];

    if (action === 'approved') {
      this.currentApprovals += 1;

      // Check if we have enough approvals
      if (this.currentApprovals >= this.requiredApprovals) {
        this.status = ApprovalStatus.APPROVED;
        this.approvedBy = userId;
        this.approvedAt = new Date();
        if (comment) this.approvalComment = comment;
      }
    } else if (action === 'rejected') {
      this.status = ApprovalStatus.REJECTED;
      this.approvedBy = userId;
      this.approvedAt = new Date();
      if (comment) this.approvalComment = comment;
    }
  }

  /**
   * Calculate remaining time until expiration
   */
  getRemainingTime(): number | null {
    if (!this.expiresAt) return null;

    const now = new Date();
    const remaining = this.expiresAt.getTime() - now.getTime();

    return remaining > 0 ? remaining : 0;
  }

  /**
   * Get approval summary
   */
  getSummary(): {
    status: string;
    progress: string;
    isUrgent: boolean;
    timeRemaining: string | null;
  } {
    const timeRemaining = this.getRemainingTime();
    let timeRemainingStr: string | null = null;

    if (timeRemaining !== null) {
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      timeRemainingStr = `${hours}h ${minutes}m`;
    }

    return {
      status: this.status,
      progress: `${this.currentApprovals}/${this.requiredApprovals}`,
      isUrgent: this.priority === ApprovalPriority.URGENT || this.priority === ApprovalPriority.HIGH,
      timeRemaining: timeRemainingStr,
    };
  }

  /**
   * Determine if action requires approval based on impact level
   */
  static requiresApproval(impactLevel: ActionImpactLevel): boolean {
    return impactLevel !== ActionImpactLevel.LOW;
  }

  /**
   * Get required approval count based on impact level
   */
  static getRequiredApprovalCount(impactLevel: ActionImpactLevel): number {
    switch (impactLevel) {
      case ActionImpactLevel.LOW:
        return 0; // Auto-approve
      case ActionImpactLevel.MEDIUM:
        return 1; // Single approval
      case ActionImpactLevel.HIGH:
        return 2; // Double approval
      case ActionImpactLevel.CRITICAL:
        return 3; // Triple approval (senior + 2 others)
      default:
        return 1;
    }
  }

  /**
   * Calculate expiration time based on priority
   */
  static getExpirationTime(priority: ApprovalPriority): Date {
    const now = new Date();

    switch (priority) {
      case ApprovalPriority.URGENT:
        // 1 hour
        return new Date(now.getTime() + 60 * 60 * 1000);
      case ApprovalPriority.HIGH:
        // 4 hours
        return new Date(now.getTime() + 4 * 60 * 60 * 1000);
      case ApprovalPriority.MEDIUM:
        // 24 hours
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case ApprovalPriority.LOW:
        // 72 hours
        return new Date(now.getTime() + 72 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}
