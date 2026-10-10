import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

import { BaseEntity } from '../../../core/database/entities/base.entity';

@Entity('notifications')
export class Notification extends BaseEntity {

  @Column('text')
  message: string;

  @Column('varchar')
  type: string;

  @Column('boolean', { default: false })
  isRead: boolean;

  @Column('uuid', { name: 'recipient_id', nullable: true })
  userId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;



  @ManyToOne(() => User, user => user.notifications, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn([{ name: 'recipient_id', referencedColumnName: 'id' }, { name: 'tenant_id', referencedColumnName: 'tenantId' }])
  user: User;
}