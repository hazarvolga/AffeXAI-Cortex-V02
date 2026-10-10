import {
  Entity,
  Column,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { BackupStorageProvider } from './backup.entity';

@Entity('backup_config')
export class BackupConfig extends BaseEntity {
  // Google Drive OAuth (encrypted)
  @Column({ type: 'text', nullable: true })
  googleDriveClientId: string | null;

  @Column({ type: 'text', nullable: true })
  googleDriveClientSecret: string | null;

  @Column({ type: 'text', nullable: true })
  googleDriveRefreshToken: string | null;

  // OneDrive/Microsoft Graph (encrypted)
  @Column({ type: 'text', nullable: true })
  oneDriveClientId: string | null;

  @Column({ type: 'text', nullable: true })
  oneDriveClientSecret: string | null;

  @Column({ type: 'text', nullable: true })
  oneDriveRefreshToken: string | null;

  // Dropbox (encrypted)
  @Column({ type: 'text', nullable: true })
  dropboxAccessToken: string | null;

  // FTP/SFTP (encrypted)
  @Column({ type: 'varchar', nullable: true })
  ftpHost: string | null;

  @Column({ type: 'integer', nullable: true })
  ftpPort: number | null;

  @Column({ type: 'text', nullable: true })
  ftpUsername: string | null;

  @Column({ type: 'text', nullable: true })
  ftpPassword: string | null;

  @Column({ type: 'varchar', nullable: true })
  ftpPath: string | null;

  // AWS S3 (encrypted)
  @Column({ type: 'text', nullable: true })
  awsAccessKeyId: string | null;

  @Column({ type: 'text', nullable: true })
  awsSecretAccessKey: string | null;

  @Column({ type: 'varchar', nullable: true })
  awsS3Bucket: string | null;

  @Column({ type: 'varchar', nullable: true })
  awsRegion: string | null;

  // Default settings
  @Column({ type: 'integer', default: 30 })
  defaultRetentionDays: number;

  @Column({ type: 'varchar', array: true, default: '{}' })
  defaultUploadDestinations: BackupStorageProvider[];

  @Column({ type: 'boolean', default: false })
  automaticBackupEnabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  automaticBackupCron: string | null; // e.g., '0 2 * * *' for daily at 2 AM
}
