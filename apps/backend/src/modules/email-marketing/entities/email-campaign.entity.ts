import { Entity, Column, OneToMany, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { EmailLog } from './email-log.entity';
import { EmailCampaignVariant } from './email-campaign-variant.entity';
import { CampaignStatus } from '@affexai/shared-types';

@Entity('email_campaigns')
export class EmailCampaign extends BaseEntity {

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  slug: string;

  @Column({ type: 'varchar' })
  subject: string;

  @Column('text')
  content: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: CampaignStatus | string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'int', default: 0 })
  totalRecipients: number;

  @Column({ type: 'int', default: 0 })
  sentCount: number;

  @Column({ type: 'int', default: 0 })
  openedCount: number;

  @Column({ type: 'int', default: 0 })
  clickedCount: number;

  @Column({ type: 'int', default: 0 })
  bounceCount: number;

  @Column({ type: 'int', default: 0 })
  deliveredCount: number;

  @Column({ type: 'int', default: 0 })
  complainedCount: number;

  // A/B Testing fields
  @Column({ type: 'boolean', default: false })
  isAbTest: boolean;

  @Column({ type: 'varchar', nullable: true, length: 50, comment: 'subject, content, send_time, from_name, combined' })
  testType: string;

  @Column({ type: 'varchar', nullable: true, length: 50, comment: 'open_rate, click_rate, conversion_rate, revenue' })
  winnerCriteria: string;

  @Column({ type: 'boolean', default: true })
  autoSelectWinner: boolean;

  @Column({ type: 'timestamp', nullable: true })
  winnerSelectionDate: Date;

  @Column({ type: 'uuid', nullable: true })
  selectedWinnerId: string;

  @ManyToOne(() => EmailCampaignVariant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'selectedWinnerId' })
  selectedWinner: Relation<EmailCampaignVariant>;

  @Column({ type: 'int', nullable: true, comment: 'Duration in hours' })
  testDuration: number;

  @Column('decimal', { precision: 5, scale: 2, default: 95.0, comment: '95%, 99%, etc.' })
  confidenceLevel: number;

  @Column({ type: 'int', default: 100, comment: 'Minimum sends per variant' })
  minSampleSize: number;

  @Column({ type: 'varchar', nullable: true, length: 20, default: 'draft', comment: 'draft, testing, completed, winner_sent' })
  testStatus: string;

  @OneToMany(() => EmailCampaignVariant, (variant) => variant.campaign)
  variants: Relation<EmailCampaignVariant>[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => EmailLog, log => log.campaign)
  logs: Relation<EmailLog>[];

  /**
   * Check if campaign is an A/B test
   */
  isAbTestCampaign(): boolean {
    return this.isAbTest === true;
  }

  /**
   * Check if A/B test has a winner
   */
  hasWinner(): boolean {
    return this.selectedWinnerId !== null && this.selectedWinnerId !== undefined;
  }

  /**
   * Check if A/B test is completed
   */
  isTestCompleted(): boolean {
    return this.testStatus === 'completed';
  }

  /**
   * Get the winning variant
   */
  getWinner(): EmailCampaignVariant | null {
    if (!this.hasWinner() || !this.variants) {
      return null;
    }
    return this.variants.find(v => v.id === this.selectedWinnerId) || null;
  }
}