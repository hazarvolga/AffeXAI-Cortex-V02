import { Entity, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { Subscriber } from './subscriber.entity';
import { ConsentType, ConsentStatus, ConsentMethod, LegalBasis } from '../services/gdpr-compliance.service';

@Entity('consent_records')
export class ConsentRecord extends BaseEntity {
  @ManyToOne(() => Subscriber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriber_id' })
  subscriber: Relation<Subscriber>;

  @Column({ name: 'subscriber_id', type: 'uuid' })
  subscriberId: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'enum', enum: ConsentType })
  consentType: ConsentType;

  @Column({ type: 'enum', enum: ConsentStatus })
  consentStatus: ConsentStatus;

  @Column({ type: 'timestamp' })
  consentDate: Date;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'enum', enum: ConsentMethod })
  consentMethod: ConsentMethod;

  @Column({ type: 'enum', enum: LegalBasis })
  legalBasis: LegalBasis;

  @Column({ type: 'json' })
  dataProcessingPurposes: string[];

  @Column({ type: 'int', nullable: true })
  retentionPeriod: number; // in months

  @Column({ type: 'timestamp', nullable: true })
  withdrawalDate: Date;

  @Column({ type: 'varchar', nullable: true })
  withdrawalReason: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}