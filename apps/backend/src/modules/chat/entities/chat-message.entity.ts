import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ChatSession } from './chat-session.entity';
import { ChatContextSource } from './chat-context-source.entity';

export enum ChatMessageSenderType {
  USER = 'user',
  AI = 'ai',
  SUPPORT = 'support'
}

export enum ChatMessageType {
  TEXT = 'text',
  FILE = 'file',
  URL = 'url',
  SYSTEM = 'system'
}

@Entity('chat_messages')
@Index(['sessionId', 'createdAt'])
@Index(['senderType', 'senderId'])
export class ChatMessage extends BaseEntity {
  @Column('uuid')
  sessionId: string;

  @Column({
    type: 'enum',
    enum: ChatMessageSenderType
  })
  senderType: ChatMessageSenderType;

  @Column({ type: 'uuid', nullable: true })
  senderId: string; // NULL for AI, user_id for user/support

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: ChatMessageType,
    default: ChatMessageType.TEXT
  })
  messageType: ChatMessageType;

  // FAQ Learning fields
  @Column({ type: 'boolean', nullable: true, default: null })
  isHelpful: boolean; // User feedback for FAQ learning

  @Column({ type: 'float', nullable: true, default: null })
  confidenceScore: number; // AI confidence score for FAQ learning

  @Column('jsonb', { default: {} })
  metadata: {
    aiModel?: string;
    processingTime?: number;
    contextSources?: string[];
    confidence?: number;
    supportUserId?: string;
    supportUserName?: string;
    attachments?: Array<{
      type: string;
      url: string;
      name: string;
      size: number;
    }>;
    urlData?: {
      url: string;
      title: string;
      description: string;
    };
    isEdited?: boolean;
    editedAt?: Date;
    handoffContext?: {
      fromUserId: string;
      toUserId: string;
      reason: string;
      contextSummary: string;
      urgencyLevel: string;
    };
    escalationContext?: {
      escalatedBy: string;
      reason: string;
      urgencyLevel: string;
      contextSummary: string;
      escalatedAt: Date;
    };
    handoffNote?: {
      isPrivate: boolean;
      actualContent: string;
      authorName: string;
      tags: string[];
      noteType: string;
    };
  };

  // Relations
  @ManyToOne(() => ChatSession, session => session.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: ChatSession;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @OneToMany(() => ChatContextSource, source => source.message, { cascade: true })
  contextSources: ChatContextSource[];

  // Computed properties
  get isFromUser(): boolean {
    return this.senderType === ChatMessageSenderType.USER;
  }

  get isFromAI(): boolean {
    return this.senderType === ChatMessageSenderType.AI;
  }

  get isFromSupport(): boolean {
    return this.senderType === ChatMessageSenderType.SUPPORT;
  }

  get hasContextSources(): boolean {
    return this.contextSources?.length > 0;
  }

  get hasAttachments(): boolean {
    return this.metadata?.attachments?.length > 0;
  }

  get wordCount(): number {
    return this.content.split(/\s+/).length;
  }
}