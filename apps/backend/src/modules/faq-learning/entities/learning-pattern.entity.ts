import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';

export enum PatternType {
  QUESTION = 'question',
  ANSWER = 'answer',
  CONTEXT = 'context'
}

export interface PatternSource {
  type: 'chat' | 'ticket';
  id: string;
  relevance: number;
}

@Entity('learning_patterns')
@Index(['patternType'])
@Index(['frequency'])
@Index(['confidence'])
@Index(['category'])
@Index(['createdAt'])
@Unique(['patternHash'])
@Unique(['patternHash'])
export class LearningPattern extends BaseEntity {

  @Column({ type: 'uuid', nullable: true })
  @Index()
  tenantId: string;
  @Column({
    type: 'enum',
    enum: PatternType
  })
  patternType: PatternType;

  @Column('text')
  pattern: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  patternHash: string; // For deduplication

  @Column('int', { default: 1 })
  frequency: number;

  @Column('int', {
    default: 50,
    transformer: {
      to: (value: number) => Math.max(1, Math.min(100, value)),
      from: (value: number) => value
    }
  })
  confidence: number; // 1-100

  @Column('text', { array: true, default: [] })
  keywords: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column('jsonb', { default: [] })
  sources: PatternSource[];

  @Column('jsonb', { nullable: true })
  metadata: {
    averageRelevance?: number;
    lastSeenAt?: Date;
    relatedPatterns?: string[];
    contextualInfo?: any;
  };

  // Computed properties
  get type(): PatternType {
    return this.patternType;
  }

  get patternText(): string {
    return this.pattern;
  }

  get isHighFrequency(): boolean {
    return this.frequency >= 5;
  }

  get isHighConfidence(): boolean {
    return this.confidence >= 80;
  }

  get averageSourceRelevance(): number {
    if (this.sources.length === 0) return 0;
    const total = this.sources.reduce((sum, source) => sum + source.relevance, 0);
    return total / this.sources.length;
  }

  get uniqueSourceCount(): number {
    const uniqueSources = new Set(this.sources.map(s => s.id));
    return uniqueSources.size;
  }

  // Helper methods
  addSource(source: PatternSource): void {
    const existingIndex = this.sources.findIndex(s => s.id === source.id && s.type === source.type);
    if (existingIndex >= 0) {
      // Update existing source with higher relevance
      if (source.relevance > this.sources[existingIndex].relevance) {
        this.sources[existingIndex] = source;
      }
    } else {
      this.sources.push(source);
    }
  }

  incrementFrequency(): void {
    this.frequency += 1;
  }
}