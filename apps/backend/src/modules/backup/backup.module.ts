import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Backup } from './entities/backup.entity';
import { BackupConfig } from './entities/backup-config.entity';
import { BackupService } from './services/backup.service';
import { BackupConfigService } from './services/backup-config.service';
import { CloudUploadService } from './services/cloud-upload.service';
import { ScheduledBackupService } from './services/scheduled-backup.service';
import { GoogleDriveService } from './services/google-drive.service';
import { OneDriveService } from './services/onedrive.service';
import { DropboxService } from './services/dropbox.service';
import { FtpService } from './services/ftp.service';
import { AwsS3BackupService } from './services/aws-s3-backup.service';
import { BackupController } from './controllers/backup.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Backup, BackupConfig]),
    ScheduleModule.forRoot(),
    UsersModule,
  ],
  controllers: [BackupController],
  providers: [
    BackupService,
    BackupConfigService,
    CloudUploadService,
    ScheduledBackupService,
    GoogleDriveService,
    OneDriveService,
    DropboxService,
    FtpService,
    AwsS3BackupService,
  ],
  exports: [
    BackupService,
    BackupConfigService,
    CloudUploadService,
    ScheduledBackupService,
  ],
})
export class BackupModule {}
