import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeUpdate,
  Relation,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { EmailAutomation, WorkflowStep } from './email-automation.entity';
import { AutomationTrigger } from './automation-trigger.entity';
import { Subscriber } from './subscriber.entity';

/**
 * Execution Status
 */
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Step Result
 */
export interface StepResult {
  stepId: string;
  stepType: string;
  status: 'completed' | 'failed' | 'skipped';
  startedAt: Date;
  completedAt: Date;
  executionTime: number; // milliseconds
  data?: Record<string, any>;
  error?: string;
}

/**
 * Automation Execution Entity
 * Tracks the execution of an automation workflow for a specific subscriber
 */
@Entity('automation_executions')
export class AutomationExecution extends BaseEntity {
  // Automation relation
  @Column({ type: 'uuid' })
  automationId: string;

  @ManyToOne(() => EmailAutomation, (automation) => automation.executions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'automationId' })
  automation: Relation<EmailAutomation>;

  // Trigger relation (optional)
  @Column({ type: 'uuid', nullable: true })
  triggerId?: string;

  @ManyToOne(() => AutomationTrigger, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'triggerId' })
  trigger?: Relation<AutomationTrigger>;

  // Subscriber relation
  @Column({ type: 'uuid' })
  subscriberId: string;

  @ManyToOne(() => Subscriber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriberId' })
  subscriber: Relation<Subscriber>;

  // Execution state
  @Column({
    type: 'varchar',
    length: 20,
    default: ExecutionStatus.PENDING,
  })
  status: ExecutionStatus;

  @Column({ type: 'int', default: 0 })
  currentStepIndex: number;

  @Column({ type: 'jsonb', default: [] })
  stepResults: StepResult[];

  @Column({ type: 'text', nullable: true })
  error?: string;

  // Timing
  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int', nullable: true })
  executionTime?: number; // milliseconds

  // Timestamps
  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;

  // Lifecycle hooks
  @BeforeUpdate()
  calculateExecutionTime() {
    if (this.startedAt && this.completedAt) {
      this.executionTime = this.completedAt.getTime() - this.startedAt.getTime();
    }
  }

  // Helper methods
  start() {
    this.status = ExecutionStatus.RUNNING;
    this.startedAt = new Date();
  }

  complete() {
    this.status = ExecutionStatus.COMPLETED;
    this.completedAt = new Date();
  }

  fail(error: string) {
    this.status = ExecutionStatus.FAILED;
    this.error = error;
    this.completedAt = new Date();
  }

  cancel() {
    this.status = ExecutionStatus.CANCELLED;
    this.completedAt = new Date();
  }

  addStepResult(result: StepResult) {
    this.stepResults = [...this.stepResults, result];
    this.currentStepIndex++;
  }

  getLastStepResult(): StepResult | null {
    return this.stepResults.length > 0
      ? this.stepResults[this.stepResults.length - 1]
      : null;
  }

  getStepResult(stepId: string): StepResult | null {
    return this.stepResults.find((r) => r.stepId === stepId) || null;
  }

  hasCompletedStep(stepId: string): boolean {
    const result = this.getStepResult(stepId);
    return result !== null && result.status === 'completed';
  }

  getTotalExecutionTime(): number {
    if (this.executionTime) return this.executionTime;
    if (!this.startedAt) return 0;
    const endTime = this.completedAt || new Date();
    return endTime.getTime() - this.startedAt.getTime();
  }

  getSuccessfulSteps(): number {
    return this.stepResults.filter((r) => r.status === 'completed').length;
  }

  getFailedSteps(): number {
    return this.stepResults.filter((r) => r.status === 'failed').length;
  }

  getProgress(): number {
    if (!this.automation || !this.automation.workflowSteps) return 0;
    const totalSteps = this.automation.workflowSteps.length;
    if (totalSteps === 0) return 100;
    return Math.round((this.stepResults.length / totalSteps) * 100);
  }
}
