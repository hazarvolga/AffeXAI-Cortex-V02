import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';

@Entity('crm_customers')
export class CrmCustomer extends BaseEntity {

  @Column({ type: 'varchar', length: 255 })
  @Index()
  companyName: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  customerNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactPerson: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  // --- NEURAL METRICS (BCC INTELLIGENCE) ---
  @Column({ type: 'float', default: 0 })
  resonanceScore: number;

  @Column({ type: 'float', default: 0 })
  sentimentScore: number;

  @Column({ type: 'float', default: 0 })
  frictionRank: number;

  @Column({ type: 'timestamp', nullable: true })
  lastInteractionAt: Date;
}
