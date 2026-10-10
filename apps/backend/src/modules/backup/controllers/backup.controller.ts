import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../../core/auth/guards/platform-admin.guard';
import { BackupService } from '../services/backup.service';
import { BackupConfigService } from '../services/backup-config.service';
import { CloudUploadService } from '../services/cloud-upload.service';
import { ScheduledBackupService } from '../services/scheduled-backup.service';
import { GoogleDriveService } from '../services/google-drive.service';
import { OneDriveService } from '../services/onedrive.service';
import { CreateBackupDto, BackupConfigDto } from '../dto/create-backup.dto';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import * as fs from 'fs';

@Controller('backup')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class BackupController {
  constructor(
    private backupService: BackupService,
    private backupConfigService: BackupConfigService,
    private cloudUploadService: CloudUploadService,
    private scheduledBackupService: ScheduledBackupService,
    private googleDriveService: GoogleDriveService,
    private oneDriveService: OneDriveService,
  ) { }

  @Post()
  async createBackup(
    @Body() createBackupDto: CreateBackupDto,
    @CurrentUser() user: any
  ) {
    createBackupDto.triggeredBy = user?.id;
    return await this.backupService.createBackup(user.tenantId, createBackupDto);
  }

  @Get()
  async getAllBackups(@CurrentUser() user: any) {
    return await this.backupService.getAllBackups(user.tenantId);
  }

  @Get(':id')
  async getBackupById(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return await this.backupService.getBackupById(id, user.tenantId);
  }

  @Delete(':id')
  async deleteBackup(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    await this.backupService.deleteBackup(id, user.tenantId);
    return { message: 'Backup deleted successfully' };
  }

  @Get(':id/download')
  async downloadBackup(
    @Param('id') id: string,
    @Res() res: Response,
    @CurrentUser() user: any
  ) {
    const { filePath, filename } = await this.backupService.downloadBackup(id, user.tenantId);

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Post(':id/upload')
  async uploadBackupToCloud(
    @Param('id') id: string,
    @Body('destinations') destinations: string[],
    @CurrentUser() user: any
  ) {
    await this.cloudUploadService.uploadBackup(user.tenantId, id, destinations as any);
    return { message: 'Backup upload initiated' };
  }

  @Delete(':id/cloud/:destination')
  async deleteBackupFromCloud(
    @Param('id') id: string,
    @Param('destination') destination: string,
    @CurrentUser() user: any
  ) {
    await this.cloudUploadService.deleteBackupFromCloud(user.tenantId, id, destination as any);
    return { message: 'Backup deleted from cloud' };
  }

  @Get('cloud/:destination/list')
  async listCloudBackups(
    @Param('destination') destination: string,
    @CurrentUser() user: any
  ) {
    return await this.cloudUploadService.listCloudBackups(user.tenantId, destination as any);
  }

  @Get('cloud/:destination/test')
  async testCloudConnection(
    @Param('destination') destination: string,
    @CurrentUser() user: any
  ) {
    const isConnected = await this.cloudUploadService.testCloudConnection(user.tenantId, destination as any);
    return { connected: isConnected };
  }

  // Config endpoints
  @Get('config/settings')
  async getConfig(@CurrentUser() user: any) {
    return await this.backupConfigService.getConfig(user.tenantId);
  }

  @Put('config/settings')
  async updateConfig(
    @Body() configDto: BackupConfigDto,
    @CurrentUser() user: any
  ) {
    return await this.backupConfigService.updateConfig(user.tenantId, configDto);
  }

  @Delete('config/settings')
  async deleteConfig(@CurrentUser() user: any) {
    await this.backupConfigService.deleteConfig(user.tenantId);
    return { message: 'Configuration deleted' };
  }

  // Schedule management
  @Post('schedule/update')
  async updateSchedule() {
    await this.scheduledBackupService.updateAutomaticBackupSchedule();
    return { message: 'Backup schedule updated' };
  }

  @Post('schedule/trigger')
  async triggerManualBackup(
    @Body() createBackupDto: CreateBackupDto,
    @CurrentUser() user: any
  ) {
    return await this.scheduledBackupService.triggerManualBackup(
      user.tenantId,
      createBackupDto.type,
      createBackupDto.uploadTo || [],
      createBackupDto.retentionDays,
      user?.id
    );
  }

  @Post('cleanup/expired')
  async cleanupExpired(@CurrentUser() user: any) {
    // Note: The service method currently cleans up ALL expired backups across tenants.
    // If we want to restrict this to only the current tenant's expired backups:
    await this.backupService.cleanupExpiredBackups();
    return { message: 'Expired backups cleaned up' };
  }

  // OAuth helpers
  @Get('oauth/google-drive/url')
  async getGoogleDriveAuthUrl(
    @Query('clientId') clientId: string,
    @Query('clientSecret') clientSecret: string
  ) {
    const authUrl = await this.googleDriveService.getAuthUrl(clientId, clientSecret);
    return { authUrl };
  }

  @Post('oauth/google-drive/token')
  async getGoogleDriveRefreshToken(
    @Body('clientId') clientId: string,
    @Body('clientSecret') clientSecret: string,
    @Body('code') code: string
  ) {
    const refreshToken = await this.googleDriveService.getRefreshToken(
      clientId,
      clientSecret,
      code
    );
    return { refreshToken };
  }

  @Get('oauth/onedrive/url')
  async getOneDriveAuthUrl(@Query('clientId') clientId: string) {
    const authUrl = await this.oneDriveService.getAuthUrl(clientId);
    return { authUrl };
  }

  @Post('oauth/onedrive/token')
  async getOneDriveRefreshToken(
    @Body('clientId') clientId: string,
    @Body('clientSecret') clientSecret: string,
    @Body('code') code: string
  ) {
    const refreshToken = await this.oneDriveService.getRefreshToken(
      clientId,
      clientSecret,
      code
    );
    return { refreshToken };
  }
}
