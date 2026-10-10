import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BulkExportService } from './bulk-export.service';

@Injectable()
export class ExportCleanupService {
  private readonly logger = new Logger(ExportCleanupService.name);

  constructor(private readonly bulkExportService: BulkExportService) {}

  /**
   * Clean up expired export files daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleExpiredExportsCleanup(): Promise<void> {
    this.logger.log('Starting scheduled cleanup of expired export files');
    
    try {
      await this.bulkExportService.cleanupExpiredExports();
      this.logger.log('Completed scheduled cleanup of expired export files');
    } catch (error) {
      this.logger.error(
        `Failed to cleanup expired export files: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Manual cleanup trigger (can be called via API or admin interface)
   */
  async triggerManualCleanup(): Promise<{ message: string; success: boolean }> {
    try {
      this.logger.log('Starting manual cleanup of expired export files');
      await this.bulkExportService.cleanupExpiredExports();
      
      return {
        message: 'Export files cleanup completed successfully',
        success: true,
      };
    } catch (error) {
      this.logger.error(
        `Manual cleanup failed: ${error.message}`,
        error.stack,
      );
      
      return {
        message: `Cleanup failed: ${error.message}`,
        success: false,
      };
    }
  }
}