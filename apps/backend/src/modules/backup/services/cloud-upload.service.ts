import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Backup, BackupStorageProvider, BackupStatus } from '../entities/backup.entity';
import { BackupConfigService } from './backup-config.service';
import { GoogleDriveService } from './google-drive.service';
import { OneDriveService } from './onedrive.service';
import { DropboxService } from './dropbox.service';
import { FtpService } from './ftp.service';
import { AwsS3BackupService } from './aws-s3-backup.service';

@Injectable()
export class CloudUploadService {
  private readonly logger = new Logger(CloudUploadService.name);

  constructor(
    @InjectRepository(Backup)
    private backupRepository: Repository<Backup>,
    private backupConfigService: BackupConfigService,
    private googleDriveService: GoogleDriveService,
    private oneDriveService: OneDriveService,
    private dropboxService: DropboxService,
    private ftpService: FtpService,
    private awsS3Service: AwsS3BackupService,
  ) { }

  async uploadBackup(
    tenantId: string,
    backupId: string,
    destinations: BackupStorageProvider[]
  ): Promise<void> {
    const backup = await this.backupRepository.findOne({
      where: { id: backupId, tenantId }
    });
    if (!backup || !backup.filePath) {
      throw new Error('Backup not found or file path missing');
    }

    const config = await this.backupConfigService.getConfig(tenantId);
    const filename = backup.filePath.split('/').pop();

    backup.status = BackupStatus.UPLOADING;
    await this.backupRepository.save(backup);

    const uploadedTo: BackupStorageProvider[] = [];
    const remoteUrls: Record<string, string> = {};

    for (const destination of destinations) {
      try {
        let url: string;

        switch (destination) {
          case BackupStorageProvider.GOOGLE_DRIVE:
            url = await this.googleDriveService.uploadBackup(
              config,
              backup.filePath,
              filename
            );
            break;

          case BackupStorageProvider.ONEDRIVE:
            url = await this.oneDriveService.uploadBackup(
              config,
              backup.filePath,
              filename
            );
            break;

          case BackupStorageProvider.DROPBOX:
            url = await this.dropboxService.uploadBackup(
              config,
              backup.filePath,
              filename
            );
            break;

          case BackupStorageProvider.FTP:
            url = await this.ftpService.uploadBackupFtp(
              config,
              backup.filePath,
              filename
            );
            break;

          case BackupStorageProvider.SFTP:
            url = await this.ftpService.uploadBackupSftp(
              config,
              backup.filePath,
              filename
            );
            break;

          case BackupStorageProvider.AWS_S3:
            url = await this.awsS3Service.uploadBackup(
              config,
              backup.filePath,
              filename
            );
            break;

          default:
            this.logger.warn(`Unknown backup destination: ${destination}`);
            continue;
        }

        uploadedTo.push(destination);
        remoteUrls[destination] = url;

        this.logger.log(`Backup uploaded to ${destination}: ${url}`);

      } catch (error) {
        this.logger.error(`Failed to upload to ${destination}: ${error.message}`);
        // Continue with other destinations even if one fails
      }
    }

    backup.uploadedTo = uploadedTo;
    backup.remoteUrls = remoteUrls;
    backup.status = uploadedTo.length > 0 ? BackupStatus.UPLOADED : BackupStatus.COMPLETED;
    await this.backupRepository.save(backup);

    this.logger.log(
      `Backup ${backupId} uploaded to ${uploadedTo.length}/${destinations.length} destinations`
    );
  }

  async deleteBackupFromCloud(
    tenantId: string,
    backupId: string,
    destination: BackupStorageProvider
  ): Promise<void> {
    const backup = await this.backupRepository.findOne({
      where: { id: backupId, tenantId }
    });
    if (!backup) {
      throw new Error('Backup not found');
    }

    const config = await this.backupConfigService.getConfig(tenantId);
    const remoteUrl = backup.remoteUrls?.[destination];

    if (!remoteUrl) {
      throw new Error(`Backup not found on ${destination}`);
    }

    try {
      switch (destination) {
        case BackupStorageProvider.GOOGLE_DRIVE:
          const driveFileId = remoteUrl.split('/').pop();
          await this.googleDriveService.deleteBackup(config, driveFileId);
          break;

        case BackupStorageProvider.ONEDRIVE:
          const oneDriveFileId = remoteUrl.split('/').pop();
          await this.oneDriveService.deleteBackup(config, oneDriveFileId);
          break;

        case BackupStorageProvider.DROPBOX:
          await this.dropboxService.deleteBackup(config, remoteUrl);
          break;

        case BackupStorageProvider.FTP:
          const ftpPath = remoteUrl.replace(/^ftp:\/\/[^/]+/, '');
          await this.ftpService.deleteBackupFtp(config, ftpPath);
          break;

        case BackupStorageProvider.SFTP:
          const sftpPath = remoteUrl.replace(/^sftp:\/\/[^/]+/, '');
          await this.ftpService.deleteBackupSftp(config, sftpPath);
          break;

        case BackupStorageProvider.AWS_S3:
          const s3Key = remoteUrl.split('/').slice(3).join('/');
          await this.awsS3Service.deleteBackup(config, s3Key);
          break;
      }

      // Update backup record
      backup.uploadedTo = backup.uploadedTo.filter(d => d !== destination);
      delete backup.remoteUrls[destination];
      await this.backupRepository.save(backup);

      this.logger.log(`Backup deleted from ${destination}`);

    } catch (error) {
      this.logger.error(`Failed to delete backup from ${destination}: ${error.message}`);
      throw error;
    }
  }

  async listCloudBackups(tenantId: string, destination: BackupStorageProvider): Promise<any[]> {
    const config = await this.backupConfigService.getConfig(tenantId);

    try {
      switch (destination) {
        case BackupStorageProvider.GOOGLE_DRIVE:
          return await this.googleDriveService.listBackups(config);

        case BackupStorageProvider.ONEDRIVE:
          return await this.oneDriveService.listBackups(config);

        case BackupStorageProvider.DROPBOX:
          return await this.dropboxService.listBackups(config);

        case BackupStorageProvider.FTP:
          return await this.ftpService.listBackupsFtp(config);

        case BackupStorageProvider.SFTP:
          return await this.ftpService.listBackupsSftp(config);

        case BackupStorageProvider.AWS_S3:
          return await this.awsS3Service.listBackups(config);

        default:
          return [];
      }
    } catch (error) {
      this.logger.error(`Failed to list backups from ${destination}: ${error.message}`);
      return [];
    }
  }

  async testCloudConnection(tenantId: string, destination: BackupStorageProvider): Promise<boolean> {
    const config = await this.backupConfigService.getConfig(tenantId);

    try {
      switch (destination) {
        case BackupStorageProvider.FTP:
          return await this.ftpService.testConnection(config, false);

        case BackupStorageProvider.SFTP:
          return await this.ftpService.testConnection(config, true);

        case BackupStorageProvider.AWS_S3:
          return await this.awsS3Service.testConnection(config);

        default:
          // For OAuth-based services, just check if credentials exist
          return await this.backupConfigService.testCloudConnection(tenantId, destination);
      }
    } catch (error) {
      this.logger.error(`Cloud connection test failed for ${destination}: ${error.message}`);
      return false;
    }
  }
}
