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
import { EmailAutomation, TriggerType } from './email-automation.entity';
import { Subscriber } from './subscriber.entity';

/**
 * Trigger Status
 */
export enum TriggerStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  FIRED = 'fired',
  SKIPPED = 'skipped',
  FAILED = 'failed',
}

/**
 * Automation Trigger Entity
 * Records when automation triggers fire for specific subscribers
 */
@Entity('automation_triggers')
export class AutomationTrigger extends BaseEntity {
  // Automation relation
  @Column({ type: 'uuid' })
  automationId: string;

  @ManyToOne(() => EmailAutomation, (automation) => automation.triggers, {
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

  // Trigger details
  @Column({ type: 'varchar', length: 50 })
  triggerType: TriggerType;

  @Column({ type: 'jsonb', default: {} })
  triggerData: Record<string, any>;

  @Column({
    type: 'varchar',
    length: 20,
    default: TriggerStatus.PENDING,
  })
  status: TriggerStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor?: Date;

  @Column({ type: 'timestamp', nullable: true })
  firedAt?: Date;

  // Timestamps
  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;

  // Helper methods
  fire() {
    this.status = TriggerStatus.FIRED;
    this.firedAt = new Date();
  }

  skip(reason?: string) {
    this.status = TriggerStatus.SKIPPED;
    if (reason) {
      this.triggerData = { ...this.triggerData, skipReason: reason };
    }
  }

  fail(error: string) {
    this.status = TriggerStatus.FAILED;
    this.triggerData = { ...this.triggerData, error };
  }

  schedule(date: Date) {
    this.status = TriggerStatus.SCHEDULED;
    this.scheduledFor = date;
  }

  isReady(): boolean {
    if (this.status !== TriggerStatus.SCHEDULED) return false;
    if (!this.scheduledFor) return false;
    return new Date() >= this.scheduledFor;
  }
}
