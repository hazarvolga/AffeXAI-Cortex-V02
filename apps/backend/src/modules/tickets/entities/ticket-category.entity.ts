import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';

/**
 * TicketCategory Entity
 * Represents a hierarchical category for organizing tickets
 */
@Entity('ticket_categories')
export class TicketCategory extends BaseEntity {
  // id inherited from BaseEntity

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @ManyToOne(() => TicketCategory, (category) => category.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent: TicketCategory;

  @OneToMany(() => TicketCategory, (category) => category.parent)
  children: TicketCategory[];

  @Column({ type: 'integer', default: 0 })
  ticketCount: number;

  @Column({ type: 'varchar', length: 50, default: 'folder' })
  icon: string;

  @Column({ type: 'varchar', length: 50, default: 'gray' })
  color: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // createdAt, updatedAt, tenantId inherited from BaseEntity
}
