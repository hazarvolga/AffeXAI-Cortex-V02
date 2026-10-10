import { Entity, Column, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from './chat-message.entity';
import { ChatDocument } from './chat-document.entity';
import { ChatSupportAssignment } from './chat-support-assignment.entity';

export enum ChatSessionType {
  SUPPORT = 'support',
  GENERAL = 'general'
}

export enum ChatSessionStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  TRANSFERRED = 'transferred'
}

@Entity('chat_sessions')
@Index(['userId'])
@Index(['status'])
@Index(['sessionType'])
@Index(['createdAt'])
export class ChatSession extends BaseEntity {
  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: ChatSessionType,
    default: ChatSessionType.SUPPORT
  })
  sessionType: ChatSessionType;

  @Column({
    type: 'enum',
    enum: ChatSessionStatus,
    default: ChatSessionStatus.ACTIVE
  })
  status: ChatSessionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column('jsonb', { default: {} })
  metadata: {
    aiProvider?: string;
    modelUsed?: string;
    contextSources?: number;
    messageCount?: number;
    supportAssigned?: boolean;
    customerSatisfaction?: number;
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    tags?: string[];
    escalatedFrom?: string;
    escalationReason?: string;
    escalationNotes?: string;
    escalationPriority?: string;
    escalationCategory?: string;
    escalatedAt?: Date;
    escalatedBy?: string;
    originalSessionType?: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => ChatMessage, message => message.session, { cascade: true })
  messages: ChatMessage[];

  @OneToMany(() => ChatDocument, document => document.session, { cascade: true })
  documents: ChatDocument[];

  @OneToMany(() => ChatSupportAssignment, assignment => assignment.session, { cascade: true })
  supportAssignments: ChatSupportAssignment[];

  // Computed properties
  get messageCount(): number {
    return this.messages?.length || 0;
  }

  get isActive(): boolean {
    return this.status === ChatSessionStatus.ACTIVE;
  }

  get isClosed(): boolean {
    return this.status === ChatSessionStatus.CLOSED;
  }

  get hasSupport(): boolean {
    return this.metadata?.supportAssigned || false;
  }

  get currentAssignment(): ChatSupportAssignment | undefined {
    return this.supportAssignments?.find(assignment => assignment.status === 'active');
  }
}