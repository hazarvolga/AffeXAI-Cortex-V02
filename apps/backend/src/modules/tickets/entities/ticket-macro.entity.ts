import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Ticket Macro Entity
 * Predefined bulk actions for ticket management
 */
@Entity('ticket_macros')
export class TicketMacro extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'jsonb' })
  actions: MacroAction[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean; // Available to all agents

  @Column({ type: 'integer', default: 0 })
  usageCount: number;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];
}

export interface MacroAction {
  type: 'update_status' | 'assign' | 'add_tag' | 'remove_tag' | 'set_priority' | 'add_note' | 'send_email';
  value: any;
}
