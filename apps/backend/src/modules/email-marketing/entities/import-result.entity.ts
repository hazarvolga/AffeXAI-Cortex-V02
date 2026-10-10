import { Entity, Column, ManyToOne, JoinColumn, Index, Relation } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { ImportJob } from './import-job.entity';

export enum ImportResultStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  RISKY = 'risky',
  DUPLICATE = 'duplicate',
}

export interface ValidationDetails {
  syntaxValid: boolean;
  domainExists: boolean;
  mxRecordExists: boolean;
  isDisposable: boolean;
  isRoleAccount: boolean;
  hasTypos: boolean;
  ipReputation: 'good' | 'poor' | 'unknown';
  confidenceScore: number;
  validationProvider: string;
  validatedAt: Date;
}

@Entity('import_results')
@Index(['importJobId', 'email'])
@Index(['importJobId', 'status'])
export class ImportResult extends BaseEntity {
  @ManyToOne(() => ImportJob, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'importJobId' })
  importJob: Relation<ImportJob>;

  @Column({ type: 'uuid' })
  importJobId: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'enum', enum: ImportResultStatus })
  status: ImportResultStatus;

  @Column({ type: 'int', default: 0 })
  confidenceScore: number;

  @Column({ type: 'json', nullable: true })
  validationDetails: ValidationDetails;

  @Column({ type: 'json', nullable: true })
  issues: string[];

  @Column({ type: 'json', nullable: true })
  suggestions: string[];

  @Column({ type: 'boolean', default: false })
  imported: boolean;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'json', nullable: true })
  originalData: Record<string, any>; // Original CSV row data

  @Column({ type: 'int', nullable: true })
  rowNumber: number; // Row number in original CSV

  @Column({ type: 'uuid', nullable: true })
  subscriberId: string; // ID of created/updated subscriber if imported
}