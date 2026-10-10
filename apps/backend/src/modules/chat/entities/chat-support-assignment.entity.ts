import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { ChatSession } from './chat-session.entity';
import { User } from '../../users/entities/user.entity';

export enum AssignmentType {
  MANUAL = 'manual',
  AUTO = 'auto',
  ESCALATED = 'escalated'
}

export enum AssignmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TRANSFERRED = 'transferred'
}

@Entity('chat_support_assignments')
@Index(['sessionId'])
@Index(['supportUserId'])
@Index(['status'])
export class ChatSupportAssignment extends BaseEntity {
  @Column('uuid')
  sessionId: string;

  @Column('uuid')
  supportUserId: string;

  @Column({ type: 'uuid', nullable: true })
  assignedBy: string;

  @Column({
    type: 'enum',
    enum: AssignmentType,
    default: AssignmentType.MANUAL
  })
  assignmentType: AssignmentType;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE
  })
  status: AssignmentStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column('text', { nullable: true })
  notes: string;

  // Relations
  @ManyToOne(() => ChatSession, session => session.supportAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: ChatSession;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'supportUserId' })
  supportUser: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedBy' })
  assignedByUser: User;

  // Computed properties
  get isActive(): boolean {
    return this.status === AssignmentStatus.ACTIVE;
  }

  get isCompleted(): boolean {
    return this.status === AssignmentStatus.COMPLETED;
  }

  get duration(): number | null {
    if (!this.completedAt) return null;
    return Math.floor((this.completedAt.getTime() - this.assignedAt.getTime()) / 1000);
  }

  get durationInMinutes(): number | null {
    const durationSeconds = this.duration;
    return durationSeconds ? Math.floor(durationSeconds / 60) : null;
  }

  get wasEscalated(): boolean {
    return this.assignmentType === AssignmentType.ESCALATED;
  }
}