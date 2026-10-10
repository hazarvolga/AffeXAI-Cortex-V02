import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';

export enum UrlProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@Entity('chat_url_cache')
@Index(['urlHash', 'tenantId'], { unique: true })
@Index(['expiresAt'])
export class ChatUrlCache extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  urlHash: string;

  @Column('text')
  originalUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string;

  @Column('text', { nullable: true })
  content: string;

  @Column('jsonb', { default: {} })
  metadata: {
    description?: string;
    author?: string;
    publishedDate?: Date;
    imageUrl?: string;
    siteName?: string;
    contentType?: string;
    wordCount?: number;
    extractionMethod?: string;
    robotsAllowed?: boolean;
    statusCode?: number;
    processingError?: string;
  };

  @Column({
    type: 'enum',
    enum: UrlProcessingStatus,
    default: UrlProcessingStatus.COMPLETED
  })
  processingStatus: UrlProcessingStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  // Computed properties
  get isExpired(): boolean {
    return this.expiresAt && this.expiresAt < new Date();
  }

  get isProcessed(): boolean {
    return this.processingStatus === UrlProcessingStatus.COMPLETED;
  }

  get hasFailed(): boolean {
    return this.processingStatus === UrlProcessingStatus.FAILED;
  }

  get hasContent(): boolean {
    return !!this.content && this.content.length > 0;
  }

  get domain(): string {
    try {
      return new URL(this.originalUrl).hostname;
    } catch {
      return 'unknown';
    }
  }

  get contentPreview(): string {
    if (!this.content) return '';
    return this.content.length > 200 ? this.content.substring(0, 200) + '...' : this.content;
  }
}