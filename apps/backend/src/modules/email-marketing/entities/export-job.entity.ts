import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { SubscriberStatus } from '@affexai/shared-types';

export enum ExportJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ExportFilters {
  tenantId: string; // Added for multi-tenancy
  status?: SubscriberStatus[];
  groupIds?: string[];
  segmentIds?: string[];
  dateRange?: { start?: Date; end?: Date };
  validationStatus?: string[];
}

export interface ExportOptions {
  fields: string[];
  format: 'csv' | 'xlsx';
  includeMetadata: boolean;
  batchSize: number;
}

@Entity('export_jobs')
export class ExportJob extends BaseEntity {
  @Column({ type: 'varchar' })
  fileName: string;

  @Column({ type: 'varchar' })
  filePath: string;

  @Column({ type: 'enum', enum: ExportJobStatus, default: ExportJobStatus.PENDING })
  status: ExportJobStatus;

  @Column({ type: 'int', default: 0 })
  totalRecords: number;

  @Column({ type: 'int', default: 0 })
  processedRecords: number;

  @Column({ type: 'json' })
  filters: ExportFilters;

  @Column({ type: 'json' })
  options: ExportOptions;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'uuid', nullable: true })
  userId: string; // User who initiated the export

  @Column({ type: 'float', default: 0 })
  progressPercentage: number;

  @Column({ type: 'bigint', nullable: true })
  fileSizeBytes: number;
}