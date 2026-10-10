import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export interface LearningConfigValue {
  // Confidence thresholds
  minConfidenceForReview?: number;
  minConfidenceForAutoPublish?: number;

  // Pattern recognition
  minPatternFrequency?: number;
  similarityThreshold?: number;

  // Data processing
  batchSize?: number;
  processingInterval?: number;

  // Quality filters
  minQuestionLength?: number;
  maxQuestionLength?: number;
  minAnswerLength?: number;

  // Source preferences
  chatSessionMinDuration?: number;
  ticketMinResolutionTime?: number;
  requiredSatisfactionScore?: number;

  // Categories
  excludedCategories?: string[];
  autoCategorizationEnabled?: boolean;

  // AI Model settings
  aiProvider?: 'openai' | 'anthropic' | 'google' | 'openrouter';
  modelName?: string;
  temperature?: number;
  maxTokens?: number;

  // Provider-specific settings
  providerSettings?: {
    openai?: {
      models: string[];
      defaultModel: string;
      apiKey?: string;
    };
    anthropic?: {
      models: string[];
      defaultModel: string;
      apiKey?: string;
    };
    google?: {
      models: string[];
      defaultModel: string;
      apiKey?: string;
    };
    openrouter?: {
      models: string[];
      defaultModel: string;
      apiKey?: string;
    };
  };

  // Advanced settings
  enableRealTimeProcessing?: boolean;
  enableAutoPublishing?: boolean;
  maxDailyProcessingLimit?: number;
  retentionPeriodDays?: number;

  // Any other configuration value
  [key: string]: any;
}

@Entity('faq_learning_config')
@Index(['configKey'])
@Index(['updatedAt'])
export class FaqLearningConfig extends BaseEntity {

  @Column({ type: 'uuid', nullable: true })
  @Index()
  tenantId: string;
  @Column({ type: 'varchar', length: 100, unique: true })
  configKey: string;

  @Column('jsonb')
  configValue: LearningConfigValue;

  @Column('text', { nullable: true })
  description: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('text', { nullable: true })
  category: string; // Group related configs

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater: User;

  @Column('uuid', { nullable: true })
  updatedBy: string;

  // Helper methods for common config operations
  static getDefaultConfig(): Partial<LearningConfigValue> {
    return {
      minConfidenceForReview: 60,
      minConfidenceForAutoPublish: 85,
      minPatternFrequency: 3,
      similarityThreshold: 0.8,
      batchSize: 100,
      processingInterval: 3600,
      minQuestionLength: 10,
      maxQuestionLength: 500,
      minAnswerLength: 20,
      chatSessionMinDuration: 300,
      ticketMinResolutionTime: 1800,
      requiredSatisfactionScore: 4,
      excludedCategories: [],
      autoCategorizationEnabled: true,
      aiProvider: 'openai',
      modelName: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      enableRealTimeProcessing: false,
      enableAutoPublishing: false,
      maxDailyProcessingLimit: 1000,
      retentionPeriodDays: 365
    };
  }

  // Type-safe getters for common config values
  get minConfidenceForReview(): number {
    return this.configValue.minConfidenceForReview ?? 60;
  }

  get minConfidenceForAutoPublish(): number {
    return this.configValue.minConfidenceForAutoPublish ?? 85;
  }

  get aiProvider(): string {
    return this.configValue.aiProvider ?? 'openai';
  }

  get batchSize(): number {
    return this.configValue.batchSize ?? 100;
  }

  get isAutoPublishingEnabled(): boolean {
    return this.configValue.enableAutoPublishing ?? false;
  }
}