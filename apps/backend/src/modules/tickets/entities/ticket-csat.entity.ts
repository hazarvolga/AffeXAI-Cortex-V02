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
 * TicketCSAT Entity
 * Customer Satisfaction survey responses for resolved tickets
 */
@Entity('ticket_csat')
export class TicketCSAT extends BaseEntity {
  // id, createdAt, tenantId inherited from BaseEntity

  @Column({ type: 'uuid' })
  ticketId: string;

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  // Rating (1-5 stars)
  @Column({ type: 'integer' })
  rating: number;

  // Optional text feedback
  @Column({ type: 'text', nullable: true })
  feedback: string;

  // Survey metadata
  @Column({ type: 'varchar', length: 500, nullable: true })
  surveyToken: string; // Unique token for public access

  @Column({ type: 'timestamp', nullable: true })
  surveyRequestedAt: Date; // When survey was sent

  @Column({ type: 'timestamp', nullable: true })
  surveyCompletedAt: Date; // When customer responded

  @Column({ type: 'varchar', length: 100, nullable: true })
  ipAddress: string; // For spam prevention

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string; // Browser info

  @Column({ type: 'jsonb', nullable: true })
  responses: Record<string, string | number | boolean | null>; // Additional question responses

  // inherited from BaseEntity

}
