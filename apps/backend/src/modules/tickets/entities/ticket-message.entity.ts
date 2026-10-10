import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Ticket } from './ticket.entity';

/**
 * TicketMessage Entity
 * Represents a message/comment in a ticket conversation
 */
@Entity('ticket_messages')
export class TicketMessage extends BaseEntity {
  // id inherited from BaseEntity

  @Column({ type: 'uuid' })
  ticketId: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @Column({ type: 'uuid', nullable: true })
  authorId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  htmlContent: string;

  @Column({ type: 'boolean', default: false })
  isInternal: boolean;

  @Column({ type: 'simple-array', nullable: true })
  attachmentIds: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailMessageId: string; // For email threading

  @Column({ type: 'varchar', length: 50, nullable: true })
  contentType: 'plain' | 'html';

  // Message editing tracking
  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @Column({ type: 'timestamp', nullable: true })
  editedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  editedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'editedById' })
  editedBy: User;

  @Column({ type: 'text', nullable: true })
  originalContent: string;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  deletedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deletedById' })
  deletedBy: User;

  // createdAt, updatedAt, tenantId inherited from BaseEntity
}
