import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { Subscriber } from './subscriber.entity';
import { EmailCampaign } from './email-campaign.entity';
import { BaseEntity } from '../../../core/database/entities/base.entity';

@Entity('email_open_history')
@Index(['subscriberId', 'openedAt'])
@Index(['campaignId', 'openedAt'])
export class EmailOpenHistory extends BaseEntity {


  @Column({ type: 'uuid' })
  subscriberId: string;

  @ManyToOne(() => Subscriber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriberId' })
  subscriber: Relation<Subscriber>;

  @Column({ type: 'uuid' })
  campaignId: string;

  @ManyToOne(() => EmailCampaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Relation<EmailCampaign>;

  @Column('timestamp with time zone')
  openedAt: Date;

  @Column('varchar', { length: 100, nullable: true })
  timezone: string;

  @Column('int', { nullable: true })
  hourOfDay: number; // 0-23

  @Column('int', { nullable: true })
  dayOfWeek: number; // 0-6 (0=Sunday)

  @Column('varchar', { length: 50, nullable: true })
  deviceType: string;

  @Column('varchar', { length: 100, nullable: true })
  emailClient: string;

  @Column('varchar', { length: 100, nullable: true })
  ipAddress: string;

  @Column('varchar', { length: 100, nullable: true })
  country: string;

  @Column('varchar', { length: 100, nullable: true })
  city: string;


}