import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  Relation,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { Segment } from './segment.entity';
import { AutomationTrigger } from './automation-trigger.entity';
import { AutomationExecution } from './automation-execution.entity';
import { AutomationSchedule } from './automation-schedule.entity';

/**
 * Automation Status
 */
export enum AutomationStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

/**
 * Trigger Types
 */
export enum TriggerType {
  EVENT = 'event', // User event (subscribe, purchase, etc.)
  BEHAVIOR = 'behavior', // User behavior (cart_abandonment, browsing, etc.)
  TIME_BASED = 'time_based', // Scheduled (birthday, anniversary, etc.)
  ATTRIBUTE = 'attribute', // User attribute change (status, tags, etc.)
}

/**
 * Workflow Step Types
 */
export interface WorkflowStep {
  id: string;
  type: 'send_email' | 'delay' | 'condition' | 'split' | 'exit';
  config: Record<string, any>;
  nextStepId?: string;
  conditionalPaths?: {
    condition: string;
    nextStepId: string;
  }[];
}

/**
 * Email Automation Entity
 * Manages automated email workflows with triggers and multi-step flows
 */
@Entity('email_automations')
export class EmailAutomation extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: AutomationStatus.DRAFT,
  })
  status: AutomationStatus;

  @Column({ type: 'varchar', length: 50 })
  triggerType: TriggerType;

  @Column({ type: 'jsonb', default: {} })
  triggerConfig: Record<string, any>;

  @Column({ type: 'jsonb', default: [] })
  workflowSteps: WorkflowStep[];

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  // Segment relation (optional - can target all subscribers)
  @Column({ type: 'uuid', nullable: true })
  segmentId?: string;

  @ManyToOne(() => Segment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'segmentId' })
  segment?: Relation<Segment>;

  // Statistics
  @Column({ type: 'int', default: 0 })
  subscriberCount: number;

  @Column({ type: 'int', default: 0 })
  executionCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @Column({ type: 'int', default: 0 })
  avgExecutionTime: number; // milliseconds

  @Column({ type: 'timestamp', nullable: true })
  lastExecutedAt?: Date;

  // Relations
  @OneToMany(() => AutomationTrigger, (trigger) => trigger.automation)
  triggers: Relation<AutomationTrigger>[];

  @OneToMany(() => AutomationExecution, (execution) => execution.automation)
  executions: Relation<AutomationExecution>[];

  @OneToMany(() => AutomationSchedule, (schedule) => schedule.automation)
  schedules: Relation<AutomationSchedule>[];

  // Timestamps
  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;

  @DeleteDateColumn()
  declare deletedAt: Date | null;

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateWorkflow() {
    if (this.workflowSteps && this.workflowSteps.length > 0) {
      // Validate step IDs are unique
      const stepIds = this.workflowSteps.map((step) => step.id);
      const uniqueIds = new Set(stepIds);
      if (stepIds.length !== uniqueIds.size) {
        throw new Error('Workflow steps must have unique IDs');
      }

      // Validate nextStepId references exist
      for (const step of this.workflowSteps) {
        if (step.nextStepId && !stepIds.includes(step.nextStepId)) {
          throw new Error(`Invalid nextStepId reference: ${step.nextStepId}`);
        }
        if (step.conditionalPaths) {
          for (const path of step.conditionalPaths) {
            if (!stepIds.includes(path.nextStepId)) {
              throw new Error(`Invalid conditional path nextStepId: ${path.nextStepId}`);
            }
          }
        }
      }
    }
  }

  // Helper methods
  isRunning(): boolean {
    return this.status === AutomationStatus.ACTIVE && this.isActive;
  }

  canBeActivated(): boolean {
    return (
      this.status === AutomationStatus.DRAFT ||
      this.status === AutomationStatus.PAUSED
    ) &&
      this.workflowSteps.length > 0;
  }

  pause() {
    if (this.status === AutomationStatus.ACTIVE) {
      this.status = AutomationStatus.PAUSED;
      this.isActive = false;
    }
  }

  activate() {
    if (this.canBeActivated()) {
      this.status = AutomationStatus.ACTIVE;
      this.isActive = true;
    }
  }

  archive() {
    this.status = AutomationStatus.ARCHIVED;
    this.isActive = false;
  }

  updateStatistics(execution: AutomationExecution) {
    this.executionCount++;
    this.lastExecutedAt = new Date();

    // Calculate success rate
    const successfulExecutions = this.executions.filter(
      (e) => e.status === 'completed'
    ).length;
    this.successRate = (successfulExecutions / this.executionCount) * 100;

    // Calculate average execution time
    const totalTime = this.executions.reduce(
      (sum, e) => sum + (e.executionTime || 0),
      0
    );
    this.avgExecutionTime = Math.round(totalTime / this.executionCount);
  }

  getFirstStep(): WorkflowStep | null {
    return this.workflowSteps.length > 0 ? this.workflowSteps[0] : null;
  }

  getStepById(stepId: string): WorkflowStep | null {
    return this.workflowSteps.find((step) => step.id === stepId) || null;
  }

  getNextStep(currentStepId: string, conditionResult?: boolean): WorkflowStep | null {
    const currentStep = this.getStepById(currentStepId);
    if (!currentStep) return null;

    // Handle conditional paths
    if (currentStep.type === 'condition' && currentStep.conditionalPaths) {
      const path = currentStep.conditionalPaths.find(
        (p) => p.condition === (conditionResult ? 'true' : 'false')
      );
      return path ? this.getStepById(path.nextStepId) : null;
    }

    // Handle regular next step
    return currentStep.nextStepId ? this.getStepById(currentStep.nextStepId) : null;
  }
}
