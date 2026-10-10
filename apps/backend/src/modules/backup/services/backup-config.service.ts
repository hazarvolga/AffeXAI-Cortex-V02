import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BackupConfig } from '../entities/backup-config.entity';
import { BackupConfigDto } from '../dto/create-backup.dto';
import * as crypto from 'crypto';

@Injectable()
export class BackupConfigService {
  private readonly logger = new Logger(BackupConfigService.name);
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(BackupConfig)
    private configRepository: Repository<BackupConfig>,
  ) {
    // Use environment variable or generate a key
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

    if (!process.env.BACKUP_ENCRYPTION_KEY) {
      this.logger.warn('No BACKUP_ENCRYPTION_KEY found, using generated key. Set BACKUP_ENCRYPTION_KEY in .env for persistent encryption.');
    }
  }

  async getConfig(tenantId: string): Promise<BackupConfig> {
    let config = await this.configRepository.findOne({
      where: { tenantId }
    });

    if (!config) {
      // Create default config
      config = this.configRepository.create({
        tenantId,
        defaultRetentionDays: 30,
        defaultUploadDestinations: [],
        automaticBackupEnabled: false,
        automaticBackupCron: '0 2 * * *', // Daily at 2 AM
      });
      await this.configRepository.save(config);
    }

    // Decrypt sensitive fields
    config = this.decryptConfig(config);

    return config;
  }

  async updateConfig(tenantId: string, configDto: BackupConfigDto): Promise<BackupConfig> {
    let config = await this.configRepository.findOne({
      where: { tenantId }
    });

    if (!config) {
      config = this.configRepository.create({ tenantId });
    }

    // Update fields
    Object.keys(configDto).forEach(key => {
      if (configDto[key] !== undefined) {
        config[key] = configDto[key];
      }
    });

    // Encrypt sensitive fields before saving
    config = this.encryptConfig(config);

    await this.configRepository.save(config);

    // Return decrypted config
    return this.decryptConfig(config);
  }

  async testCloudConnection(tenantId: string, provider: string): Promise<boolean> {
    const config = await this.getConfig(tenantId);

    try {
      switch (provider) {
        case 'google_drive':
          return !!(config.googleDriveClientId && config.googleDriveClientSecret && config.googleDriveRefreshToken);
        case 'onedrive':
          return !!(config.oneDriveClientId && config.oneDriveClientSecret && config.oneDriveRefreshToken);
        case 'dropbox':
          return !!config.dropboxAccessToken;
        case 'ftp':
        case 'sftp':
          return !!(config.ftpHost && config.ftpUsername && config.ftpPassword);
        case 'aws_s3':
          return !!(config.awsAccessKeyId && config.awsSecretAccessKey && config.awsS3Bucket);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Cloud connection test failed for ${provider}: ${error.message}`);
      return false;
    }
  }

  private encryptConfig(config: BackupConfig): BackupConfig {
    const encryptedConfig = { ...config };

    // Encrypt sensitive fields
    const sensitiveFields = [
      'googleDriveClientSecret',
      'googleDriveRefreshToken',
      'oneDriveClientSecret',
      'oneDriveRefreshToken',
      'dropboxAccessToken',
      'ftpPassword',
      'awsSecretAccessKey',
    ];

    sensitiveFields.forEach(field => {
      if (encryptedConfig[field]) {
        encryptedConfig[field] = this.encrypt(encryptedConfig[field]);
      }
    });

    return encryptedConfig;
  }

  private decryptConfig(config: BackupConfig): BackupConfig {
    const decryptedConfig = { ...config };

    // Decrypt sensitive fields
    const sensitiveFields = [
      'googleDriveClientSecret',
      'googleDriveRefreshToken',
      'oneDriveClientSecret',
      'oneDriveRefreshToken',
      'dropboxAccessToken',
      'ftpPassword',
      'awsSecretAccessKey',
    ];

    sensitiveFields.forEach(field => {
      if (decryptedConfig[field]) {
        try {
          decryptedConfig[field] = this.decrypt(decryptedConfig[field]);
        } catch (error) {
          this.logger.warn(`Failed to decrypt ${field}: ${error.message}`);
          decryptedConfig[field] = null;
        }
      }
    });

    return decryptedConfig;
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex').slice(0, 32),
      iv
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(text: string): string {
    const [ivHex, encryptedText] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex').slice(0, 32),
      iv
    );

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async deleteConfig(tenantId: string): Promise<void> {
    const config = await this.configRepository.findOne({
      where: { tenantId }
    });
    if (config) {
      await this.configRepository.remove(config);
    }
  }
}
