import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { ChatSession } from './chat-session.entity';
import { ChatMessage } from './chat-message.entity';

export enum DocumentProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@Entity('chat_documents')
@Index(['sessionId'])
@Index(['processingStatus'])
export class ChatDocument extends BaseEntity {
  @Column('uuid')
  sessionId: string;

  @Column('uuid', { nullable: true })
  messageId: string;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 10 })
  fileType: string;

  @Column('int')
  fileSize: number;

  @Column({ type: 'varchar', length: 500 })
  storagePath: string;

  @Column('text', { nullable: true })
  extractedContent: string;

  @Column({
    type: 'enum',
    enum: DocumentProcessingStatus,
    default: DocumentProcessingStatus.PENDING
  })
  processingStatus: DocumentProcessingStatus;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  // Relations
  @ManyToOne(() => ChatSession, session => session.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: ChatSession;

  @ManyToOne(() => ChatMessage, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: ChatMessage;

  // Computed properties
  get isProcessed(): boolean {
    return this.processingStatus === DocumentProcessingStatus.COMPLETED;
  }

  get hasFailed(): boolean {
    return this.processingStatus === DocumentProcessingStatus.FAILED;
  }

  get isProcessing(): boolean {
    return this.processingStatus === DocumentProcessingStatus.PROCESSING;
  }

  get fileSizeInMB(): number {
    return Math.round((this.fileSize / (1024 * 1024)) * 100) / 100;
  }

  get hasContent(): boolean {
    return !!this.extractedContent && this.extractedContent.length > 0;
  }
}