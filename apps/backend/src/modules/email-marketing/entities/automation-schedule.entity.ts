import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { EmailAutomation } from './email-automation.entity';
import { Subscriber } from './subscriber.entity';

/**
 * Schedule Status
 */
export enum ScheduleStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Automation Schedule Entity
 * Manages scheduled execution of automation steps (for delays and time-based triggers)
 */
@Entity('automation_schedules')
export class AutomationSchedule extends BaseEntity {
  // Automation relation
  @Column({ type: 'uuid' })
  automationId: string;

  @ManyToOne(() => EmailAutomation, (automation) => automation.schedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'automationId' })
  automation: Relation<EmailAutomation>;

  // Subscriber relation
  @Column({ type: 'uuid' })
  subscriberId: string;

  @ManyToOne(() => Subscriber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriberId' })
  subscriber: Relation<Subscriber>;

  // Schedule details
  @Column({ type: 'int' })
  stepIndex: number;

  @Column({ type: 'timestamp' })
  scheduledFor: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: ScheduleStatus.PENDING,
  })
  status: ScheduleStatus;

  @Column({ type: 'timestamp', nullable: true })
  executedAt?: Date;

  @Column({ type: 'text', nullable: true })
  error?: string;

  // Timestamps
  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;

  // Helper methods
  isReady(): boolean {
    return (
      this.status === ScheduleStatus.PENDING &&
      new Date() >= this.scheduledFor
    );
  }

  markAsProcessing() {
    this.status = ScheduleStatus.PROCESSING;
  }

  markAsCompleted() {
    this.status = ScheduleStatus.COMPLETED;
    this.executedAt = new Date();
  }

  markAsFailed(error: string) {
    this.status = ScheduleStatus.FAILED;
    this.error = error;
    this.executedAt = new Date();
  }

  cancel() {
    this.status = ScheduleStatus.CANCELLED;
  }

  getDelayInMinutes(): number {
    const now = new Date();
    const diff = this.scheduledFor.getTime() - now.getTime();
    return Math.max(0, Math.round(diff / (1000 * 60)));
  }

  isOverdue(): boolean {
    return this.status === ScheduleStatus.PENDING && new Date() > this.scheduledFor;
  }
}
