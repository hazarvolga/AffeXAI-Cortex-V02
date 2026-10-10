import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('events')
export class Event extends BaseEntity {
  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  slug: string;

  @Column('text')
  description: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'varchar' })
  location: string;

  @Column('int')
  capacity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  certificateConfig: {
    enabled: boolean;
    templateId: string | null;
    logoMediaId: string | null;
    description: string | null;
    validityDays: number | null; // null = süresiz
    autoGenerate: boolean; // true = otomatik, false = manuel
  } | null;

  @Column({ type: 'boolean', default: false })
  grantsCertificate: boolean;

  @Column({ type: 'varchar', nullable: true })
  certificateTitle: string | null;

  @Column({ type: 'varchar', default: 'avant-garde' })
  templateId: string;

  @Column({ type: 'jsonb', nullable: true })
  registrationMetadata: Record<string, any> | null;

  @Column({ type: 'varchar', default: 'draft' })
  status: string;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  createdBy: User | null;

  @OneToMany('EventRegistration', 'event')
  registrations: any[];
}