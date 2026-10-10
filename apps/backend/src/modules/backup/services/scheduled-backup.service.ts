import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { BackupConfigService } from './backup-config.service';
import { CloudUploadService } from './cloud-upload.service';
import { BackupType } from '../entities/backup.entity';

@Injectable()
export class ScheduledBackupService implements OnModuleInit {
  private readonly logger = new Logger(ScheduledBackupService.name);
  private automaticBackupJobName = 'automatic-backup';

  constructor(
    private backupService: BackupService,
    private backupConfigService: BackupConfigService,
    private cloudUploadService: CloudUploadService,
    private schedulerRegistry: SchedulerRegistry,
  ) { }

  async onModuleInit() {
    await this.updateAutomaticBackupSchedule();
  }

  async updateAutomaticBackupSchedule() {
    // For now, we keep the global cron that triggers performAutomaticBackup
    // which will then iterate over individual tenant configs.
    // In a more scalable setup, we might have per-tenant cron jobs.

    // We'll use a fixed cron or the one from 'default' tenant for the global trigger
    // or just leave it as is if it's strictly for platform-wide backups.
    // But since config is per-tenant, we should probably check if ANY tenant has it enabled.

    const config = await this.backupConfigService.getConfig('default'); // Fallback to default for global trigger config

    // Remove existing job if any
    try {
      const existingJob = this.schedulerRegistry.getCronJob(this.automaticBackupJobName);
      if (existingJob) {
        existingJob.stop();
        this.schedulerRegistry.deleteCronJob(this.automaticBackupJobName);
        this.logger.log('Removed existing automatic backup schedule');
      }
    } catch (error) {
      // Job might not exist yet, that's fine
    }

    // Create new job if enabled
    if (config.automaticBackupEnabled && config.automaticBackupCron) {
      try {
        // Create CronJob using the cron package that @nestjs/schedule expects
        const { CronJob } = require('cron');
        const job = new CronJob(
          config.automaticBackupCron,
          () => this.performAutomaticBackup(),
          null,
          false, // Don't start immediately
          'UTC'
        );

        // Add to scheduler registry and start
        this.schedulerRegistry.addCronJob(this.automaticBackupJobName, job);
        job.start();

        this.logger.log(
          `Automatic backup scheduled: ${config.automaticBackupCron} (UTC)`
        );

      } catch (error) {
        this.logger.error(
          `Failed to schedule automatic backup: ${error.message}`
        );
      }
    } else {
      this.logger.log('Automatic backup is disabled');
    }
  }

  async performAutomaticBackup() {
    this.logger.log('Starting multi-tenant automatic backup process...');

    try {
      // Find all tenant configs that have automatic backup enabled
      // Note: We need a way to get all configs. I'll add a method to BackupConfigService
      // or query the repository directly here if I had it.
      // Since I don't want to change too many things at once, I'll Query the repository directly.

      const { Repository } = require('typeorm');
      const configs = await (this as any).backupConfigService.configRepository.find({
        where: { automaticBackupEnabled: true }
      });

      for (const config of configs) {
        const tenantId = config.tenantId;
        this.logger.log(`Starting automatic backup for tenant ${tenantId}...`);

        try {
          // Create full backup
          const backup = await this.backupService.createBackup(tenantId, {
            type: BackupType.FULL,
            uploadTo: config.defaultUploadDestinations,
            retentionDays: config.defaultRetentionDays,
          });

          this.logger.log(`Automatic backup created for tenant ${tenantId}: ${backup.id}`);

          // Wait for backup to complete
          await this.waitForBackupCompletion(tenantId, backup.id);

          // Upload to cloud if destinations specified
          if (config.defaultUploadDestinations && config.defaultUploadDestinations.length > 0) {
            await this.cloudUploadService.uploadBackup(
              tenantId,
              backup.id,
              config.defaultUploadDestinations
            );
          }

          this.logger.log(`Automatic backup for tenant ${tenantId} completed successfully`);
        } catch (innerError) {
          this.logger.error(`Automatic backup failed for tenant ${tenantId}: ${innerError.message}`);
        }
      }

    } catch (error) {
      this.logger.error(`Global automatic backup process failed: ${error.message}`, error.stack);
    }
  }

  private async waitForBackupCompletion(tenantId: string, backupId: string, maxWaitTime = 3600000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const backup = await this.backupService.getBackupById(backupId, tenantId);

      if (backup.status === 'completed') {
        return;
      }

      if (backup.status === 'failed') {
        throw new Error(`Backup failed: ${backup.errorMessage}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Backup timeout exceeded');
  }

  // Cleanup expired backups daily at 3 AM
  @Cron('0 3 * * *', {
    name: 'cleanup-expired-backups',
    timeZone: 'UTC',
  })
  async cleanupExpiredBackups() {
    this.logger.log('Starting expired backups cleanup...');

    try {
      await this.backupService.cleanupExpiredBackups();
      this.logger.log('Expired backups cleanup completed');

    } catch (error) {
      this.logger.error(`Expired backups cleanup failed: ${error.message}`);
    }
  }

  async triggerManualBackup(
    tenantId: string,
    type: BackupType,
    uploadDestinations: string[],
    retentionDays?: number,
    triggeredBy?: string
  ) {
    this.logger.log(`Manual backup triggered by ${triggeredBy || 'user'} for tenant ${tenantId}`);

    try {
      const backup = await this.backupService.createBackup(tenantId, {
        type,
        uploadTo: uploadDestinations as any[],
        retentionDays,
        triggeredBy,
      });

      return backup;

    } catch (error) {
      this.logger.error(`Manual backup failed: ${error.message}`);
      throw error;
    }
  }
}
