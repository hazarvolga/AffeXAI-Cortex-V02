import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Relation,
} from 'typeorm';
import { EmailCampaign } from './email-campaign.entity';
import { BaseEntity } from '../../../core/database/entities/base.entity';

export enum VariantStatus {
  DRAFT = 'draft',
  TESTING = 'testing',
  WINNER = 'winner',
  LOSER = 'loser',
}

/**
 * Email Campaign Variant Entity
 * Represents different versions of an email campaign for A/B testing
 */
@Entity('email_campaign_variants')
export class EmailCampaignVariant extends BaseEntity {
  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @ManyToOne(() => EmailCampaign, (campaign) => campaign.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Relation<EmailCampaign>;

  @Column({ type: 'varchar', length: 1, comment: 'A, B, C, D, or E' })
  variantLabel: string;

  // Content fields
  @Column({ type: 'varchar', nullable: true, length: 255 })
  subject: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  fromName: string;

  @Column({ type: 'int', nullable: true, comment: 'Minutes offset from base send time' })
  sendTimeOffset: number;

  // Configuration
  @Column('decimal', {
    precision: 5,
    scale: 2,
    comment: 'Percentage of recipients (0-100)',
  })
  splitPercentage: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: VariantStatus.TESTING,
    comment: 'testing, winner, loser, draft',
  })
  status: VariantStatus;

  // Performance metrics
  @Column({ type: 'int', default: 0 })
  sentCount: number;

  @Column({ type: 'int', default: 0 })
  openedCount: number;

  @Column({ type: 'int', default: 0 })
  clickedCount: number;

  @Column({ type: 'int', default: 0 })
  conversionCount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  revenue: number;

  @Column({ type: 'int', default: 0 })
  bounceCount: number;

  @Column({ type: 'int', default: 0 })
  unsubscribeCount: number;

  // Calculated rates (stored for performance)
  @Column('decimal', {
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Calculated: (openedCount / sentCount) * 100',
  })
  openRate: number;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Calculated: (clickedCount / openedCount) * 100',
  })
  clickRate: number;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Calculated: (conversionCount / clickedCount) * 100',
  })
  conversionRate: number;

  // Metadata
  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  // id, createdAt, updatedAt, tenantId inherited from BaseEntity

  // Lifecycle hooks to calculate rates
  @BeforeInsert()
  @BeforeUpdate()
  calculateRates() {
    // Open rate: opens / sent
    if (this.sentCount > 0) {
      this.openRate = Number(((this.openedCount / this.sentCount) * 100).toFixed(2));
    } else {
      this.openRate = 0;
    }

    // Click rate: clicks / opens
    if (this.openedCount > 0) {
      this.clickRate = Number(((this.clickedCount / this.openedCount) * 100).toFixed(2));
    } else {
      this.clickRate = 0;
    }

    // Conversion rate: conversions / clicks
    if (this.clickedCount > 0) {
      this.conversionRate = Number(((this.conversionCount / this.clickedCount) * 100).toFixed(2));
    } else {
      this.conversionRate = 0;
    }
  }

  /**
   * Get the rate for a specific metric
   */
  getRate(metric: 'open' | 'click' | 'conversion'): number {
    switch (metric) {
      case 'open':
        return this.openRate || 0;
      case 'click':
        return this.clickRate || 0;
      case 'conversion':
        return this.conversionRate || 0;
      default:
        return 0;
    }
  }

  /**
   * Increment a metric count
   */
  incrementMetric(metric: 'sent' | 'opened' | 'clicked' | 'conversion' | 'bounce' | 'unsubscribe') {
    switch (metric) {
      case 'sent':
        this.sentCount++;
        break;
      case 'opened':
        this.openedCount++;
        break;
      case 'clicked':
        this.clickedCount++;
        break;
      case 'conversion':
        this.conversionCount++;
        break;
      case 'bounce':
        this.bounceCount++;
        break;
      case 'unsubscribe':
        this.unsubscribeCount++;
        break;
    }
    this.calculateRates();
  }

  /**
   * Check if variant is the winner
   */
  isWinner(): boolean {
    return this.status === VariantStatus.WINNER;
  }

  /**
   * Check if variant has minimum sample size
   */
  hasMinimumSample(minSize: number): boolean {
    return this.sentCount >= minSize;
  }
}
