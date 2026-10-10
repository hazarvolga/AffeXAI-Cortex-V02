import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { EmailCampaign } from './email-campaign.entity';
import { BaseEntity } from '../../../core/database/entities/base.entity';

@Entity('email_logs')
export class EmailLog extends BaseEntity {
  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @Column({ name: 'recipient_email', type: 'varchar' })
  recipientEmail: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'opened_at', type: 'timestamp', nullable: true })
  openedAt: Date | null;

  @Column({ name: 'clicked_at', type: 'timestamp', nullable: true })
  clickedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
  @ManyToOne(() => EmailCampaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Relation<EmailCampaign>;
}