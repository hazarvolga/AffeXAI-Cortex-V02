import { Injectable, Logger } from '@nestjs/common';
import { Dropbox } from 'dropbox';
import * as fs from 'fs';
import { BackupConfig } from '../entities/backup-config.entity';

@Injectable()
export class DropboxService {
  private readonly logger = new Logger(DropboxService.name);

  async uploadBackup(
    config: BackupConfig,
    filePath: string,
    filename: string
  ): Promise<string> {
    if (!config.dropboxAccessToken) {
      throw new Error('Dropbox configuration is incomplete');
    }

    try {
      const dbx = new Dropbox({ accessToken: config.dropboxAccessToken });

      const fileBuffer = await fs.promises.readFile(filePath);
      const fileSize = fileBuffer.length;

      // Ensure folder exists
      const folderPath = '/Affexai Backups';
      await this.ensureFolderExists(dbx, folderPath);

      const uploadPath = `${folderPath}/${filename}`;

      // For files < 150MB, use regular upload
      if (fileSize < 150 * 1024 * 1024) {
        const response = await dbx.filesUpload({
          path: uploadPath,
          contents: fileBuffer,
          mode: { '.tag': 'add' },
          autorename: true,
        });

        this.logger.log(`Backup uploaded to Dropbox: ${response.result.id}`);

        // Get shared link
        const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
          path: uploadPath,
          settings: {
            requested_visibility: { '.tag': 'public' },
          },
        });

        return linkResponse.result.url;
      } else {
        // For large files, use upload session
        return await this.uploadLargeFile(dbx, uploadPath, filePath, fileSize);
      }

    } catch (error) {
      this.logger.error(`Dropbox upload failed: ${error.message}`);
      throw error;
    }
  }

  private async uploadLargeFile(
    dbx: Dropbox,
    uploadPath: string,
    filePath: string,
    fileSize: number
  ): Promise<string> {
    const chunkSize = 8 * 1024 * 1024; // 8MB chunks
    const fileStream = fs.createReadStream(filePath);

    // Start upload session
    const sessionStart = await dbx.filesUploadSessionStart({
      contents: await this.readChunk(fileStream, chunkSize),
      close: false,
    });

    const sessionId = sessionStart.result.session_id;
    let offset = chunkSize;

    // Upload remaining chunks
    while (offset < fileSize) {
      const chunk = await this.readChunk(fileStream, chunkSize);
      const isLastChunk = offset + chunk.length >= fileSize;

      if (isLastChunk) {
        // Finish upload
        const response = await dbx.filesUploadSessionFinish({
          cursor: {
            session_id: sessionId,
            offset: offset,
          },
          commit: {
            path: uploadPath,
            mode: { '.tag': 'add' },
            autorename: true,
          },
          contents: chunk,
        });

        this.logger.log(`Large backup uploaded to Dropbox: ${response.result.id}`);

        // Get shared link
        const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
          path: uploadPath,
          settings: {
            requested_visibility: { '.tag': 'public' },
          },
        });

        return linkResponse.result.url;
      } else {
        // Append chunk
        await dbx.filesUploadSessionAppendV2({
          cursor: {
            session_id: sessionId,
            offset: offset,
          },
          contents: chunk,
          close: false,
        });

        offset += chunk.length;
        this.logger.log(`Dropbox upload progress: ${Math.round((offset / fileSize) * 100)}%`);
      }
    }

    throw new Error('Upload session ended unexpectedly');
  }

  private async readChunk(stream: fs.ReadStream, size: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let bytesRead = 0;

      const onData = (chunk: Buffer) => {
        chunks.push(chunk);
        bytesRead += chunk.length;

        if (bytesRead >= size) {
          stream.pause();
          stream.removeListener('data', onData);
          stream.removeListener('end', onEnd);
          stream.removeListener('error', onError);
          resolve(Buffer.concat(chunks, size));
        }
      };

      const onEnd = () => {
        stream.removeListener('data', onData);
        stream.removeListener('error', onError);
        resolve(Buffer.concat(chunks));
      };

      const onError = (error: Error) => {
        stream.removeListener('data', onData);
        stream.removeListener('end', onEnd);
        reject(error);
      };

      stream.on('data', onData);
      stream.on('end', onEnd);
      stream.on('error', onError);
    });
  }

  private async ensureFolderExists(dbx: Dropbox, folderPath: string): Promise<void> {
    try {
      await dbx.filesGetMetadata({ path: folderPath });
    } catch (error) {
      if (error.status === 409) {
        // Folder doesn't exist, create it
        await dbx.filesCreateFolderV2({ path: folderPath });
      } else {
        throw error;
      }
    }
  }

  async deleteBackup(config: BackupConfig, filePath: string): Promise<void> {
    if (!config.dropboxAccessToken) {
      throw new Error('Dropbox configuration is incomplete');
    }

    try {
      const dbx = new Dropbox({ accessToken: config.dropboxAccessToken });

      await dbx.filesDeleteV2({ path: filePath });

      this.logger.log(`Backup deleted from Dropbox: ${filePath}`);
    } catch (error) {
      this.logger.error(`Dropbox delete failed: ${error.message}`);
      throw error;
    }
  }

  async listBackups(config: BackupConfig): Promise<any[]> {
    if (!config.dropboxAccessToken) {
      throw new Error('Dropbox configuration is incomplete');
    }

    try {
      const dbx = new Dropbox({ accessToken: config.dropboxAccessToken });

      const response = await dbx.filesListFolder({
        path: '/Affexai Backups',
      });

      return response.result.entries.filter(entry => entry['.tag'] === 'file');
    } catch (error) {
      if (error.status === 409) {
        // Folder doesn't exist
        return [];
      }
      this.logger.error(`Dropbox list failed: ${error.message}`);
      throw error;
    }
  }

  async getAuthUrl(): Promise<string> {
    // Dropbox uses App Key + App Secret for OAuth2
    // For simplicity, we'll use Access Token directly (long-lived tokens)
    return 'https://www.dropbox.com/oauth2/authorize?client_id=YOUR_APP_KEY&response_type=token&redirect_uri=http://localhost:9006/api/backup/dropbox/callback';
  }
}
