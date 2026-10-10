import { IsEnum, IsOptional, IsArray, IsNumber, IsDateString } from 'class-validator';
import { BackupType, BackupStorageProvider } from '../entities/backup.entity';

export class CreateBackupDto {
  @IsEnum(BackupType)
  type: BackupType;

  @IsOptional()
  @IsArray()
  @IsEnum(BackupStorageProvider, { each: true })
  uploadTo?: BackupStorageProvider[];

  @IsOptional()
  @IsNumber()
  retentionDays?: number; // Auto-delete after N days

  @IsOptional()
  triggeredBy?: string; // User ID
}

export class ScheduleBackupDto {
  @IsEnum(BackupType)
  type: BackupType;

  @IsArray()
  @IsEnum(BackupStorageProvider, { each: true })
  uploadTo: BackupStorageProvider[];

  @IsOptional()
  @IsNumber()
  retentionDays?: number;

  // Cron expression (e.g., '0 2 * * *' for daily at 2 AM)
  @IsOptional()
  cronExpression?: string;
}

export class BackupConfigDto {
  // Google Drive OAuth
  @IsOptional()
  googleDriveClientId?: string;

  @IsOptional()
  googleDriveClientSecret?: string;

  @IsOptional()
  googleDriveRefreshToken?: string;

  // OneDrive/Microsoft Graph
  @IsOptional()
  oneDriveClientId?: string;

  @IsOptional()
  oneDriveClientSecret?: string;

  @IsOptional()
  oneDriveRefreshToken?: string;

  // Dropbox
  @IsOptional()
  dropboxAccessToken?: string;

  // FTP/SFTP
  @IsOptional()
  ftpHost?: string;

  @IsOptional()
  ftpPort?: number;

  @IsOptional()
  ftpUsername?: string;

  @IsOptional()
  ftpPassword?: string;

  @IsOptional()
  ftpPath?: string;

  // AWS S3
  @IsOptional()
  awsAccessKeyId?: string;

  @IsOptional()
  awsSecretAccessKey?: string;

  @IsOptional()
  awsS3Bucket?: string;

  @IsOptional()
  awsRegion?: string;

  // Default settings
  @IsOptional()
  @IsNumber()
  defaultRetentionDays?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(BackupStorageProvider, { each: true })
  defaultUploadDestinations?: BackupStorageProvider[];

  @IsOptional()
  automaticBackupEnabled?: boolean;

  @IsOptional()
  automaticBackupCron?: string; // e.g., '0 2 * * *'
}
