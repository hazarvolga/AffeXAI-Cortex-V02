import { Injectable, Logger } from '@nestjs/common';
import * as Client from 'ssh2-sftp-client';
import * as FtpClient from 'ftp';
import * as fs from 'fs';
import { BackupConfig } from '../entities/backup-config.entity';

@Injectable()
export class FtpService {
  private readonly logger = new Logger(FtpService.name);

  async uploadBackupSftp(
    config: BackupConfig,
    filePath: string,
    filename: string
  ): Promise<string> {
    if (!config.ftpHost || !config.ftpUsername || !config.ftpPassword) {
      throw new Error('SFTP configuration is incomplete');
    }

    const sftp = new Client();

    try {
      await sftp.connect({
        host: config.ftpHost,
        port: config.ftpPort || 22,
        username: config.ftpUsername,
        password: config.ftpPassword,
      });

      // Ensure remote directory exists
      const remotePath = config.ftpPath || '/Affexai-Backups';
      const remoteFilePath = `${remotePath}/${filename}`;

      try {
        await sftp.mkdir(remotePath, true);
      } catch (error) {
        // Directory might already exist
      }

      // Upload file
      await sftp.put(filePath, remoteFilePath);

      this.logger.log(`Backup uploaded via SFTP: ${remoteFilePath}`);

      await sftp.end();

      return `sftp://${config.ftpHost}:${config.ftpPort || 22}${remoteFilePath}`;

    } catch (error) {
      this.logger.error(`SFTP upload failed: ${error.message}`);
      await sftp.end();
      throw error;
    }
  }

  async uploadBackupFtp(
    config: BackupConfig,
    filePath: string,
    filename: string
  ): Promise<string> {
    if (!config.ftpHost || !config.ftpUsername || !config.ftpPassword) {
      throw new Error('FTP configuration is incomplete');
    }

    return new Promise((resolve, reject) => {
      const ftp = new FtpClient();

      ftp.on('ready', async () => {
        try {
          // Ensure remote directory exists
          const remotePath = config.ftpPath || '/Affexai-Backups';
          const remoteFilePath = `${remotePath}/${filename}`;

          // Create directory
          ftp.mkdir(remotePath, true, (mkdirErr) => {
            if (mkdirErr && mkdirErr.code !== 550) {
              // 550 = directory already exists
              ftp.end();
              return reject(mkdirErr);
            }

            // Upload file
            ftp.put(filePath, remoteFilePath, (putErr) => {
              if (putErr) {
                ftp.end();
                return reject(putErr);
              }

              this.logger.log(`Backup uploaded via FTP: ${remoteFilePath}`);
              ftp.end();
              resolve(`ftp://${config.ftpHost}:${config.ftpPort || 21}${remoteFilePath}`);
            });
          });

        } catch (error) {
          ftp.end();
          reject(error);
        }
      });

      ftp.on('error', (error) => {
        this.logger.error(`FTP connection failed: ${error.message}`);
        reject(error);
      });

      ftp.connect({
        host: config.ftpHost,
        port: config.ftpPort || 21,
        user: config.ftpUsername,
        password: config.ftpPassword,
      });
    });
  }

  async deleteBackupSftp(config: BackupConfig, remotePath: string): Promise<void> {
    if (!config.ftpHost || !config.ftpUsername || !config.ftpPassword) {
      throw new Error('SFTP configuration is incomplete');
    }

    const sftp = new Client();

    try {
      await sftp.connect({
        host: config.ftpHost,
        port: config.ftpPort || 22,
        username: config.ftpUsername,
        password: config.ftpPassword,
      });

      await sftp.delete(remotePath);

      this.logger.log(`Backup deleted via SFTP: ${remotePath}`);

      await sftp.end();

    } catch (error) {
      this.logger.error(`SFTP delete failed: ${error.message}`);
      await sftp.end();
      throw error;
    }
  }

  async deleteBackupFtp(config: BackupConfig, remotePath: string): Promise<void> {
    if (!config.ftpHost || !config.ftpUsername || !config.ftpPassword) {
      throw new Error('FTP configuration is incomplete');
    }

    return new Promise((resolve, reject) => {
      const ftp = new FtpClient();

      ftp.on('ready', () => {
        ftp.delete(remotePath, (err) => {
          if (err) {
            ftp.end();
            return reject(err);
          }

          this.logger.log(`Backup deleted via FTP: ${remotePath}`);
          ftp.end();
          resolve();
        });
      });

      ftp.on('error', (error) => {
        this.logger.error(`FTP connection failed: ${error.message}`);
        reject(error);
      });

      ftp.connect({
        host: config.ftpHost,
        port: config.ftpPort || 21,
        user: config.ftpUsername,
        password: config.ftpPassword,
      });
    });
  }

  async listBackupsSftp(config: BackupConfig): Promise<any[]> {
    if (!config.ftpHost || !config.ftpUsername || !config.ftpPassword) {
      throw new Error('SFTP configuration is incomplete');
    }

    const sftp = new Client();

    try {
      await sftp.connect({
        host: config.ftpHost,
        port: config.ftpPort || 22,
        username: config.ftpUsername,
        password: config.ftpPassword,
      });

      const remotePath = config.ftpPath || '/Affexai-Backups';

      const files = await sftp.list(remotePath);

      await sftp.end();

      return files.filter(file => file.type === '-'); // Only files, not directories

    } catch (error) {
      if (error.code === 2) {
        // Directory doesn't exist
        await sftp.end();
        return [];
      }
      this.logger.error(`SFTP list failed: ${error.message}`);
      await sftp.end();
      throw error;
    }
  }

  async listBackupsFtp(config: BackupConfig): Promise<any[]> {
    if (!config.ftpHost || !config.ftpUsername || !config.ftpPassword) {
      throw new Error('FTP configuration is incomplete');
    }

    return new Promise((resolve, reject) => {
      const ftp = new FtpClient();

      ftp.on('ready', () => {
        const remotePath = config.ftpPath || '/Affexai-Backups';

        ftp.list(remotePath, (err, files) => {
          if (err) {
            if (err.code === 550) {
              // Directory doesn't exist
              ftp.end();
              return resolve([]);
            }
            ftp.end();
            return reject(err);
          }

          ftp.end();
          resolve(files.filter(file => file.type === '-')); // Only files
        });
      });

      ftp.on('error', (error) => {
        this.logger.error(`FTP connection failed: ${error.message}`);
        reject(error);
      });

      ftp.connect({
        host: config.ftpHost,
        port: config.ftpPort || 21,
        user: config.ftpUsername,
        password: config.ftpPassword,
      });
    });
  }

  async testConnection(config: BackupConfig, useSftp: boolean): Promise<boolean> {
    try {
      if (useSftp) {
        const sftp = new Client();
        await sftp.connect({
          host: config.ftpHost,
          port: config.ftpPort || 22,
          username: config.ftpUsername,
          password: config.ftpPassword,
        });
        await sftp.end();
        return true;
      } else {
        return new Promise((resolve, reject) => {
          const ftp = new FtpClient();

          ftp.on('ready', () => {
            ftp.end();
            resolve(true);
          });

          ftp.on('error', (error) => {
            reject(error);
          });

          ftp.connect({
            host: config.ftpHost,
            port: config.ftpPort || 21,
            user: config.ftpUsername,
            password: config.ftpPassword,
          });
        });
      }
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return false;
    }
  }
}
