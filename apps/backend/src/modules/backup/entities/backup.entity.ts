import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';

export enum BackupType {
  FULL = 'full',           // Database + Files + Code
  DATABASE = 'database',   // Only PostgreSQL
  FILES = 'files',         // Only MinIO/S3 files
  CODE = 'code',           // Only application code
}

export enum BackupStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
}

export enum BackupStorageProvider {
  LOCAL = 'local',
  GOOGLE_DRIVE = 'google_drive',
  ONEDRIVE = 'onedrive',
  DROPBOX = 'dropbox',
  FTP = 'ftp',
  SFTP = 'sftp',
  AWS_S3 = 'aws_s3',
}

@Entity('backups')
@Index(['status', 'createdAt'])
@Index(['type', 'status'])
export class Backup extends BaseEntity {

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'enum', enum: BackupType })
  type: BackupType;

  @Column({ type: 'enum', enum: BackupStatus, default: BackupStatus.PENDING })
  @Index()
  status: BackupStatus;

  @Column({ type: 'varchar', nullable: true })
  filePath: string | null; // Local file path

  @Column({ type: 'bigint', nullable: true })
  fileSize: number | null; // bytes

  @Column({ type: 'varchar', nullable: true })
  checksum: string | null; // MD5 or SHA256

  @Column({ type: 'boolean', default: false })
  isAutomatic: boolean; // Auto-scheduled or manual

  @Column({ type: 'varchar', nullable: true })
  triggeredBy: string | null; // User ID or 'system'

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    databaseSize?: number;
    filesCount?: number;
    filesSize?: number;
    codeSize?: number;
    duration?: number; // milliseconds
    compressionRatio?: number;
  } | null;

  // Remote storage info
  @Column({ type: 'varchar', array: true, default: '{}' })
  uploadedTo: BackupStorageProvider[]; // ['google_drive', 'onedrive']

  @Column({ type: 'jsonb', nullable: true })
  remoteUrls: {
    google_drive?: string;
    onedrive?: string;
    dropbox?: string;
    ftp?: string;
    aws_s3?: string;
  } | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null; // Auto-delete date
}
