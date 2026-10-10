import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import { BackupConfig } from '../entities/backup-config.entity';

@Injectable()
export class AwsS3BackupService {
  private readonly logger = new Logger(AwsS3BackupService.name);

  async uploadBackup(
    config: BackupConfig,
    filePath: string,
    filename: string
  ): Promise<string> {
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey || !config.awsS3Bucket) {
      throw new Error('AWS S3 configuration is incomplete');
    }

    try {
      const s3Client = new S3Client({
        region: config.awsRegion || 'us-east-1',
        credentials: {
          accessKeyId: config.awsAccessKeyId,
          secretAccessKey: config.awsSecretAccessKey,
        },
      });

      const fileBuffer = await fs.promises.readFile(filePath);
      const key = `backups/${filename}`;

      const command = new PutObjectCommand({
        Bucket: config.awsS3Bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: 'application/gzip',
        ServerSideEncryption: 'AES256', // Enable encryption at rest
        StorageClass: 'STANDARD_IA', // Infrequent Access for cost savings
      });

      await s3Client.send(command);

      this.logger.log(`Backup uploaded to AWS S3: s3://${config.awsS3Bucket}/${key}`);

      const s3Url = `https://${config.awsS3Bucket}.s3.${config.awsRegion || 'us-east-1'}.amazonaws.com/${key}`;
      return s3Url;

    } catch (error) {
      this.logger.error(`AWS S3 upload failed: ${error.message}`);
      throw error;
    }
  }

  async deleteBackup(config: BackupConfig, key: string): Promise<void> {
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey || !config.awsS3Bucket) {
      throw new Error('AWS S3 configuration is incomplete');
    }

    try {
      const s3Client = new S3Client({
        region: config.awsRegion || 'us-east-1',
        credentials: {
          accessKeyId: config.awsAccessKeyId,
          secretAccessKey: config.awsSecretAccessKey,
        },
      });

      const command = new DeleteObjectCommand({
        Bucket: config.awsS3Bucket,
        Key: key,
      });

      await s3Client.send(command);

      this.logger.log(`Backup deleted from AWS S3: ${key}`);

    } catch (error) {
      this.logger.error(`AWS S3 delete failed: ${error.message}`);
      throw error;
    }
  }

  async listBackups(config: BackupConfig): Promise<any[]> {
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey || !config.awsS3Bucket) {
      throw new Error('AWS S3 configuration is incomplete');
    }

    try {
      const s3Client = new S3Client({
        region: config.awsRegion || 'us-east-1',
        credentials: {
          accessKeyId: config.awsAccessKeyId,
          secretAccessKey: config.awsSecretAccessKey,
        },
      });

      const command = new ListObjectsV2Command({
        Bucket: config.awsS3Bucket,
        Prefix: 'backups/',
      });

      const response = await s3Client.send(command);

      return response.Contents || [];

    } catch (error) {
      this.logger.error(`AWS S3 list failed: ${error.message}`);
      throw error;
    }
  }

  async testConnection(config: BackupConfig): Promise<boolean> {
    try {
      const s3Client = new S3Client({
        region: config.awsRegion || 'us-east-1',
        credentials: {
          accessKeyId: config.awsAccessKeyId,
          secretAccessKey: config.awsSecretAccessKey,
        },
      });

      // Try to list objects (doesn't require write permissions)
      const command = new ListObjectsV2Command({
        Bucket: config.awsS3Bucket,
        MaxKeys: 1,
      });

      await s3Client.send(command);
      return true;

    } catch (error) {
      this.logger.error(`AWS S3 connection test failed: ${error.message}`);
      return false;
    }
  }
}
