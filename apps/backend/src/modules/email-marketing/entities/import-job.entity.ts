import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';

export enum ImportJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ImportOptions {
  groupIds?: string[];
  segmentIds?: string[];
  duplicateHandling: 'skip' | 'update' | 'replace';
  validationThreshold: number; // Minimum confidence score
  batchSize: number;
  columnMapping: Record<string, string>;
}

export interface ValidationSummary {
  totalProcessed: number;
  validEmails: number;
  invalidEmails: number;
  riskyEmails: number;
  duplicates: number;
  averageConfidenceScore: number;
  processingTimeMs: number;
}

@Entity('import_jobs')
export class ImportJob extends BaseEntity {
  @Column({ type: 'varchar' })
  fileName: string;

  @Column({ type: 'varchar' })
  originalFileName: string;

  @Column({ type: 'varchar' })
  filePath: string;

  @Column({ type: 'enum', enum: ImportJobStatus, default: ImportJobStatus.PENDING })
  status: ImportJobStatus;

  @Column({ type: 'int', default: 0 })
  totalRecords: number;

  @Column({ type: 'int', default: 0 })
  processedRecords: number;

  @Column({ type: 'int', default: 0 })
  validRecords: number;

  @Column({ type: 'int', default: 0 })
  invalidRecords: number;

  @Column({ type: 'int', default: 0 })
  riskyRecords: number;

  @Column({ type: 'int', default: 0 })
  duplicateRecords: number;

  @Column({ type: 'json', nullable: true })
  options: ImportOptions;

  @Column({ type: 'json', nullable: true })
  columnMapping: Record<string, string>;

  @Column({ type: 'json', nullable: true })
  validationSummary: ValidationSummary;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  userId: string; // User who initiated the import

  @Column({ type: 'float', default: 0 })
  progressPercentage: number;
}