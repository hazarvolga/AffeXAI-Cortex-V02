import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import { BackupConfig } from '../entities/backup-config.entity';

@Injectable()
export class OneDriveService {
  private readonly logger = new Logger(OneDriveService.name);
  private readonly graphApiUrl = 'https://graph.microsoft.com/v1.0';

  async uploadBackup(
    config: BackupConfig,
    filePath: string,
    filename: string
  ): Promise<string> {
    if (!config.oneDriveClientId || !config.oneDriveClientSecret || !config.oneDriveRefreshToken) {
      throw new Error('OneDrive configuration is incomplete');
    }

    try {
      const accessToken = await this.getAccessToken(
        config.oneDriveClientId,
        config.oneDriveClientSecret,
        config.oneDriveRefreshToken
      );

      // Create or get the "Affexai Backups" folder
      const folderId = await this.getOrCreateFolder(accessToken, 'Affexai Backups');

      // Read file
      const fileBuffer = await fs.promises.readFile(filePath);
      const fileSize = fileBuffer.length;

      // For files > 4MB, use upload session (resumable upload)
      if (fileSize > 4 * 1024 * 1024) {
        return await this.uploadLargeFile(accessToken, folderId, filename, filePath, fileSize);
      }

      // For small files, use simple upload
      const uploadUrl = `${this.graphApiUrl}/me/drive/items/${folderId}:/${filename}:/content`;

      const response = await axios.put(uploadUrl, fileBuffer, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/gzip',
        },
      });

      this.logger.log(`Backup uploaded to OneDrive: ${response.data.id}`);
      return response.data.webUrl;

    } catch (error) {
      this.logger.error(`OneDrive upload failed: ${error.message}`);
      throw error;
    }
  }

  private async uploadLargeFile(
    accessToken: string,
    folderId: string,
    filename: string,
    filePath: string,
    fileSize: number
  ): Promise<string> {
    // Create upload session
    const sessionUrl = `${this.graphApiUrl}/me/drive/items/${folderId}:/${filename}:/createUploadSession`;

    const sessionResponse = await axios.post(sessionUrl, {
      item: {
        '@microsoft.graph.conflictBehavior': 'rename',
      },
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const uploadUrl = sessionResponse.data.uploadUrl;

    // Upload file in chunks (10MB chunks)
    const chunkSize = 10 * 1024 * 1024;
    const fileStream = fs.createReadStream(filePath);
    let uploadedBytes = 0;

    for await (const chunk of this.readChunks(fileStream, chunkSize)) {
      const chunkEnd = Math.min(uploadedBytes + chunk.length, fileSize);

      await axios.put(uploadUrl, chunk, {
        headers: {
          'Content-Length': chunk.length.toString(),
          'Content-Range': `bytes ${uploadedBytes}-${chunkEnd - 1}/${fileSize}`,
        },
      });

      uploadedBytes = chunkEnd;
      this.logger.log(`OneDrive upload progress: ${Math.round((uploadedBytes / fileSize) * 100)}%`);
    }

    const finalResponse = await axios.get(uploadUrl);
    return finalResponse.data.webUrl;
  }

  private async *readChunks(stream: fs.ReadStream, chunkSize: number): AsyncGenerator<Buffer> {
    for await (const chunk of stream) {
      yield chunk as Buffer;
    }
  }

  private async getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
    try {
      const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Files.ReadWrite',
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data.access_token;
    } catch (error) {
      this.logger.error(`OneDrive token refresh failed: ${error.message}`);
      throw new Error('Failed to refresh OneDrive access token');
    }
  }

  private async getOrCreateFolder(accessToken: string, folderName: string): Promise<string> {
    try {
      // Search for existing folder in root
      const searchUrl = `${this.graphApiUrl}/me/drive/root/children?$filter=name eq '${folderName}' and folder ne null`;

      const searchResponse = await axios.get(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (searchResponse.data.value && searchResponse.data.value.length > 0) {
        return searchResponse.data.value[0].id;
      }

      // Create folder if it doesn't exist
      const createUrl = `${this.graphApiUrl}/me/drive/root/children`;

      const createResponse = await axios.post(createUrl, {
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename',
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return createResponse.data.id;
    } catch (error) {
      this.logger.error(`Failed to get/create OneDrive folder: ${error.message}`);
      throw error;
    }
  }

  async deleteBackup(config: BackupConfig, fileId: string): Promise<void> {
    if (!config.oneDriveClientId || !config.oneDriveClientSecret || !config.oneDriveRefreshToken) {
      throw new Error('OneDrive configuration is incomplete');
    }

    try {
      const accessToken = await this.getAccessToken(
        config.oneDriveClientId,
        config.oneDriveClientSecret,
        config.oneDriveRefreshToken
      );

      const deleteUrl = `${this.graphApiUrl}/me/drive/items/${fileId}`;

      await axios.delete(deleteUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      this.logger.log(`Backup deleted from OneDrive: ${fileId}`);
    } catch (error) {
      this.logger.error(`OneDrive delete failed: ${error.message}`);
      throw error;
    }
  }

  async listBackups(config: BackupConfig): Promise<any[]> {
    if (!config.oneDriveClientId || !config.oneDriveClientSecret || !config.oneDriveRefreshToken) {
      throw new Error('OneDrive configuration is incomplete');
    }

    try {
      const accessToken = await this.getAccessToken(
        config.oneDriveClientId,
        config.oneDriveClientSecret,
        config.oneDriveRefreshToken
      );

      const folderId = await this.getOrCreateFolder(accessToken, 'Affexai Backups');

      const listUrl = `${this.graphApiUrl}/me/drive/items/${folderId}/children?$orderby=createdDateTime desc`;

      const response = await axios.get(listUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.data.value || [];
    } catch (error) {
      this.logger.error(`OneDrive list failed: ${error.message}`);
      throw error;
    }
  }

  async getAuthUrl(clientId: string): Promise<string> {
    const redirectUri = 'http://localhost:9006/api/backup/onedrive/callback';
    const scopes = 'Files.ReadWrite offline_access';

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent(scopes)}`;
  }

  async getRefreshToken(clientId: string, clientSecret: string, code: string): Promise<string> {
    const redirectUri = 'http://localhost:9006/api/backup/onedrive/callback';

    const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.data.refresh_token) {
      throw new Error('No refresh token received');
    }

    return response.data.refresh_token;
  }
}
