import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { TicketCategory } from './ticket-category.entity';
import { TicketPriority } from '../enums/ticket-priority.enum';

/**
 * Ticket Template Entity
 * Pre-defined ticket templates for common issues
 */
@Entity('ticket_templates')
export class TicketTemplate extends BaseEntity {
  // id inherited from BaseEntity

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @ManyToOne(() => TicketCategory, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: TicketCategory;

  @Column({ type: 'jsonb', nullable: true })
  defaultTags: string[];

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  // createdAt, updatedAt, tenantId inherited from BaseEntity
}
