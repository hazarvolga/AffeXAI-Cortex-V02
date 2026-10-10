import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum FaqEntryStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published'
}

export enum FaqEntrySource {
  CHAT = 'chat',
  TICKET = 'ticket',
  USER_SUGGESTION = 'user_suggestion',
  KNOWLEDGE_BASE = 'knowledge_base',
  KNOWLEDGE_SOURCE = 'knowledge_source'
}

@Entity('learned_faq_entries')
@Index(['status'])
@Index(['source'])
@Index(['category'])
@Index(['createdAt'])
export class LearnedFaqEntry extends BaseEntity {


  @Column('text')
  question: string;

  @Column('text')
  answer: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column('int', {
    transformer: {
      to: (value: number) => Math.max(1, Math.min(100, value)),
      from: (value: number) => value
    }
  })
  @Index()
  confidence: number; // 1-100

  @Column({
    type: 'enum',
    enum: FaqEntryStatus,
    default: FaqEntryStatus.DRAFT
  })
  status: FaqEntryStatus;

  @Column({
    type: 'enum',
    enum: FaqEntrySource
  })
  source: FaqEntrySource;

  @Column('uuid')
  @Index()
  sourceId: string;

  @Column('text', { array: true, default: [] })
  keywords: string[];

  @Column('jsonb', { nullable: true })
  metadata: {
    originalConversation?: string;
    resolutionTime?: number;
    userSatisfaction?: number;
    similarityScore?: number;
    occurrenceCount?: number;
    aiProvider?: string;
    modelUsed?: string;
    processingTime?: number;
    reviewReason?: string;
    reviewAction?: string;
    reviewedAt?: Date;
  };

  @Column('int', { default: 0 })
  @Index()
  usageCount: number;

  @Column('int', { default: 0 })
  @Index()
  viewCount: number;

  @Column('int', { default: 0 })
  helpfulCount: number;

  @Column('int', { default: 0 })
  notHelpfulCount: number;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;

  @Column('uuid', { nullable: true })
  reviewedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column('uuid', { nullable: true })
  createdBy: string;

  // Computed properties
  get positiveFeedbackCount(): number {
    return this.helpfulCount;
  }

  get feedbackCount(): number {
    return this.helpfulCount + this.notHelpfulCount;
  }

  get helpfulnessRatio(): number {
    const total = this.helpfulCount + this.notHelpfulCount;
    return total > 0 ? this.helpfulCount / total : 0;
  }

  get isHighConfidence(): boolean {
    return this.confidence >= 85;
  }

  get needsReview(): boolean {
    return this.status === FaqEntryStatus.PENDING_REVIEW;
  }
}