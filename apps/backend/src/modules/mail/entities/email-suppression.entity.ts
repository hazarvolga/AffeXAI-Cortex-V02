import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { EmailWebhookEventType, BounceReason } from '../interfaces/webhook-event.interface';

/**
 * Email suppression list
 * Bounce, complaint, unsubscribe olan email'leri saklar
 * Bu listede olan emaillere email gönderilmez
 * 
 * Note: Index'ler migration'da oluşturulur (1760427888000-CreateEmailSuppressionTable.ts)
 */
import { BaseEntity } from '../../../core/database/entities/base.entity';

/**
 * Email suppression list
 * Bounce, complaint, unsubscribe olan email'leri saklar
 * Bu listede olan emaillere email gönderilmez
 * 
 * Note: Index'ler migration'da oluşturulur (1760427888000-CreateEmailSuppressionTable.ts)
 */
@Entity('email_suppressions')
@Index(['tenantId', 'email']) // Unique email per tenant? Or global suppression? Usually per tenant.
export class EmailSuppression extends BaseEntity {
  // id, createdAt, updatedAt, tenantId inherited from BaseEntity

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({
    type: 'enum',
    enum: EmailWebhookEventType,
  })
  eventType: EmailWebhookEventType;

  @Column({
    type: 'enum',
    enum: BounceReason,
    nullable: true,
  })
  bounceReason?: BounceReason;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  suppressedAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;
}
