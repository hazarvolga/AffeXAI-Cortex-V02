import { Entity, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { SubscriberStatus } from '@affexai/shared-types';

@Entity('subscribers')
@Unique('UQ_subscribers_tenant_email', ['tenantId', 'email'])
export class Subscriber extends BaseEntity {
  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'enum', enum: SubscriberStatus, default: SubscriberStatus.PENDING })
  status: SubscriberStatus | string;

  @Column({ type: 'json', nullable: true })
  groups: string[]; // Array of group IDs

  @Column({ type: 'json', nullable: true })
  segments: string[]; // Array of tenant-owned segment IDs

  @Column({ type: 'varchar', nullable: true })
  firstName: string;

  @Column({ type: 'varchar', nullable: true })
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  company: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  customerStatus: string;

  @Column({ type: 'varchar', nullable: true })
  subscriptionType: string;

  @Column({ type: 'varchar', nullable: true })
  mailerCheckResult: string;

  @Column({ type: 'varchar', nullable: true })
  location: string;

  @Column({ type: 'int', default: 0 })
  sent: number;

  @Column({ type: 'int', default: 0 })
  opens: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, any>; // Dynamic custom fields

  // Opt-in/Opt-out fields
  @Column({ type: 'boolean', default: false })
  isDoubleOptIn: boolean; // Has confirmed subscription via email

  @Column({ type: 'varchar', nullable: true })
  optInToken: string; // Token for email confirmation

  @Column({ type: 'timestamp', nullable: true })
  optInDate: Date; // When user confirmed subscription

  @Column({ type: 'timestamp', nullable: true })
  optOutDate: Date; // When user unsubscribed

  @Column({ type: 'varchar', nullable: true })
  optOutReason: string; // Why user unsubscribed

  @Column({ type: 'varchar', nullable: true })
  optInIp: string; // IP address when opted in

  @Column({ type: 'varchar', nullable: true })
  optOutIp: string; // IP address when opted out

  @Column({ type: 'boolean', default: true })
  emailNotifications: boolean; // Wants to receive emails

  @Column({ type: 'boolean', default: true })
  marketingEmails: boolean; // Wants marketing emails

  @Column({ type: 'boolean', default: true })
  transactionalEmails: boolean; // Wants transactional emails (always true)

  @Column({ type: 'varchar', nullable: true })
  unsubscribeToken: string; // Unique token for one-click unsubscribe

  @CreateDateColumn()
  subscribedAt: Date;

  @UpdateDateColumn()
  lastUpdated: Date;
}