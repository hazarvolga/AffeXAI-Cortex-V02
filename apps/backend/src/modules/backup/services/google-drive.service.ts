import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from 'fs';
import { BackupConfig } from '../entities/backup-config.entity';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);

  async uploadBackup(
    config: BackupConfig,
    filePath: string,
    filename: string
  ): Promise<string> {
    if (!config.googleDriveClientId || !config.googleDriveClientSecret || !config.googleDriveRefreshToken) {
      throw new Error('Google Drive configuration is incomplete');
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        config.googleDriveClientId,
        config.googleDriveClientSecret,
        'urn:ietf:wg:oauth:2.0:oob' // For desktop/server apps
      );

      oauth2Client.setCredentials({
        refresh_token: config.googleDriveRefreshToken,
      });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      // Create or get the "Affexai Backups" folder
      const folderId = await this.getOrCreateFolder(drive, 'Affexai Backups');

      // Upload file
      const fileMetadata = {
        name: filename,
        parents: [folderId],
      };

      const media = {
        mimeType: 'application/gzip',
        body: fs.createReadStream(filePath),
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      this.logger.log(`Backup uploaded to Google Drive: ${response.data.id}`);
      return response.data.webViewLink || response.data.id;

    } catch (error) {
      this.logger.error(`Google Drive upload failed: ${error.message}`);
      throw error;
    }
  }

  private async getOrCreateFolder(drive: any, folderName: string): Promise<string> {
    try {
      // Search for existing folder
      const response = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // Create folder if it doesn't exist
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      });

      return folder.data.id;
    } catch (error) {
      this.logger.error(`Failed to get/create Google Drive folder: ${error.message}`);
      throw error;
    }
  }

  async deleteBackup(config: BackupConfig, fileId: string): Promise<void> {
    if (!config.googleDriveClientId || !config.googleDriveClientSecret || !config.googleDriveRefreshToken) {
      throw new Error('Google Drive configuration is incomplete');
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        config.googleDriveClientId,
        config.googleDriveClientSecret,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      oauth2Client.setCredentials({
        refresh_token: config.googleDriveRefreshToken,
      });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      await drive.files.delete({ fileId });

      this.logger.log(`Backup deleted from Google Drive: ${fileId}`);
    } catch (error) {
      this.logger.error(`Google Drive delete failed: ${error.message}`);
      throw error;
    }
  }

  async listBackups(config: BackupConfig): Promise<any[]> {
    if (!config.googleDriveClientId || !config.googleDriveClientSecret || !config.googleDriveRefreshToken) {
      throw new Error('Google Drive configuration is incomplete');
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        config.googleDriveClientId,
        config.googleDriveClientSecret,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      oauth2Client.setCredentials({
        refresh_token: config.googleDriveRefreshToken,
      });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      // Get the "Affexai Backups" folder
      const folderId = await this.getOrCreateFolder(drive, 'Affexai Backups');

      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, size, createdTime, webViewLink)',
        orderBy: 'createdTime desc',
      });

      return response.data.files || [];
    } catch (error) {
      this.logger.error(`Google Drive list failed: ${error.message}`);
      throw error;
    }
  }

  async getAuthUrl(clientId: string, clientSecret: string): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent to get refresh token
    });

    return authUrl;
  }

  async getRefreshToken(clientId: string, clientSecret: string, code: string): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      throw new Error('No refresh token received. Please revoke app access and try again.');
    }

    return tokens.refresh_token;
  }
}
