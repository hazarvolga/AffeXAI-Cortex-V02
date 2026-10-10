import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { KnowledgeSourceType } from './enums/knowledge-source-type.enum';
import { KnowledgeSourceStatus } from './enums/knowledge-source-status.enum';

@Entity('company_knowledge_sources')
@Index(['status', 'createdAt'])
@Index(['sourceType'])
@Index(['uploadedById'])
export class CompanyKnowledgeSource extends BaseEntity {
  // ═══════════════════════════════════════════════════════════
  // BASIC INFORMATION
  // ═══════════════════════════════════════════════════════════

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: KnowledgeSourceType,
  })
  sourceType: KnowledgeSourceType;

  @Column({
    type: 'enum',
    enum: KnowledgeSourceStatus,
    default: KnowledgeSourceStatus.PENDING,
  })
  status: KnowledgeSourceStatus;

  // ═══════════════════════════════════════════════════════════
  // DOCUMENT FIELDS (for sourceType='document')
  // ═══════════════════════════════════════════════════════════

  @Column({ type: 'varchar', length: 1000, nullable: true })
  filePath: string; // S3 or local file path

  @Column({ type: 'varchar', length: 100, nullable: true })
  fileName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fileType: string; // 'pdf', 'docx', 'xlsx', 'pptx', 'txt', 'md'

  @Column('bigint', { nullable: true })
  fileSize: number; // in bytes

  // ═══════════════════════════════════════════════════════════
  // URL FIELDS (for sourceType='url')
  // ═══════════════════════════════════════════════════════════

  @Column({ type: 'varchar', length: 2000, nullable: true })
  url: string;

  @Column({ type: 'timestamp', nullable: true })
  lastScrapedAt: Date;

  @Column('int', { default: 0 })
  scrapeFailCount: number;

  // ═══════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════

  @Column('text')
  extractedContent: string; // Processed text content

  @Column('text', { nullable: true })
  summary: string; // AI-generated summary (optional)

  @Column('simple-array', { nullable: true })
  tags: string[]; // ['installation', 'api', 'troubleshooting']

  @Column('simple-array', { nullable: true })
  keywords: string[]; // Auto-extracted keywords

  // Vector embedding for semantic search (future enhancement)
  // Requires PostgreSQL pgvector extension
  // @Column('vector', { nullable: true })
  // embedding: number[];

  // ═══════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════

  @Column('jsonb', { default: {} })
  metadata: {
    pageCount?: number;
    wordCount?: number;
    language?: string;
    author?: string;
    createdDate?: Date;
    extractedImages?: number;
    linkCount?: number;
  };

  // ═══════════════════════════════════════════════════════════
  // USAGE TRACKING
  // ═══════════════════════════════════════════════════════════

  @Column('int', { default: 0 })
  usageCount: number; // How many times used in AI responses

  @Column('int', { default: 0 })
  helpfulCount: number; // Customer feedback (helpful button)

  @Column('float', { default: 0.0 })
  averageRelevanceScore: number; // 0.0 - 1.0

  // ═══════════════════════════════════════════════════════════
  // FEATURE FLAGS
  // ═══════════════════════════════════════════════════════════

  @Column('boolean', { default: true })
  enableForFaqLearning: boolean; // Use in FAQ learning?

  @Column('boolean', { default: true })
  enableForChat: boolean; // Use in chat context?

  // ═══════════════════════════════════════════════════════════
  // RELATIONS
  // ═══════════════════════════════════════════════════════════

  @Column('uuid')
  uploadedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  // ═══════════════════════════════════════════════════════════
  // ARCHIVING (Soft Delete Alternative)
  // ═══════════════════════════════════════════════════════════

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date;

  @Column('uuid', { nullable: true })
  archivedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'archivedById' })
  archivedBy: User;

  // ═══════════════════════════════════════════════════════════
  // COMPUTED PROPERTIES
  // ═══════════════════════════════════════════════════════════

  get isActive(): boolean {
    return this.status === KnowledgeSourceStatus.ACTIVE && !this.archivedAt;
  }

  get isProcessing(): boolean {
    return this.status === KnowledgeSourceStatus.PROCESSING;
  }

  get hasFailed(): boolean {
    return this.status === KnowledgeSourceStatus.FAILED;
  }

  get isArchived(): boolean {
    return !!this.archivedAt;
  }

  get effectivenessScore(): number {
    // Effectiveness = usageCount × averageRelevanceScore
    return this.usageCount * this.averageRelevanceScore;
  }

  get displayType(): string {
    switch (this.sourceType) {
      case KnowledgeSourceType.DOCUMENT:
        return `Document (${this.fileType?.toUpperCase() || 'Unknown'})`;
      case KnowledgeSourceType.URL:
        return 'Web URL';
      case KnowledgeSourceType.TEXT:
        return 'Text Entry';
      default:
        return 'Unknown';
    }
  }
}
