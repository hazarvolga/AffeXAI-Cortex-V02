import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { TicketMessage } from './ticket-message.entity';
import { TicketCategory } from './ticket-category.entity';

/**
 * Ticket Entity
 * Represents a support ticket in the system
 */
@Entity('tickets')
export class Ticket extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  displayNumber: string; // Human-readable ticket number (e.g., SUP-00001)

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @ManyToOne(() => TicketCategory, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: TicketCategory;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'new',
  })
  status: TicketStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'medium',
  })
  priority: TicketPriority;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyName: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Tags and Custom Fields
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  firstResponseAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  // SLA Tracking Fields
  @Column({ type: 'timestamp', nullable: true })
  slaFirstResponseDueAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  slaResolutionDueAt: Date;

  @Column({ type: 'boolean', default: false })
  isSLABreached: boolean;

  @Column({ type: 'int', default: 0 })
  responseTimeHours: number;

  @Column({ type: 'int', default: 0 })
  resolutionTimeHours: number;

  // Escalation Tracking Fields
  @Column({ type: 'int', default: 0 })
  escalationLevel: number;

  @Column({ type: 'timestamp', nullable: true })
  lastEscalatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  escalationHistory: Array<{
    level: number;
    escalatedAt: Date;
    escalatedBy: string; // user ID or 'system'
    reason: string;
    ruleId?: string;
    assignedToId?: string;
  }>;

  // Merged Tickets Tracking
  @Column({ type: 'simple-array', nullable: true })
  mergedTicketIds: string[];

  @OneToMany(() => TicketMessage, (message) => message.ticket)
  messages: TicketMessage[];
}
