import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { lookup } from 'node:dns/promises';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { isIP } from 'node:net';
import { posix } from 'node:path';
import { SettingsService } from '../settings/settings.service';
import { StorageProvider } from '../settings/dto/storage-settings.dto';
import { isPublicAddress } from '../../core/network/public-url-fetcher';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
  ) { }

  /**
   * Get configured S3 client based on settings
   * Falls back to environment variables if no valid settings found
   */
  private async getClient(tenantId?: string): Promise<{ client: S3Client; bucketName: string; settings: Awaited<ReturnType<SettingsService['getStorageSettings']>> }> {
    try {
      if (!tenantId) {
        throw new Error('Verified tenant scope is required for storage configuration');
      }
      // 1. Try to get settings from database
      const { settings } = await this.settingsService.getStorageSettingsSnapshot(tenantId);

      // 2. Check if we should use DB settings based on provider
      if (settings.provider !== StorageProvider.LOCAL) {
        let clientConfig: any = null;
        let bucket = '';

        if (settings.provider === StorageProvider.AWS_S3 && settings.awsS3?.accessKeyId && settings.awsS3?.secretAccessKey) {
          bucket = settings.awsS3.bucket;
          clientConfig = {
            region: settings.awsS3.region,
            credentials: {
              accessKeyId: settings.awsS3.accessKeyId,
              secretAccessKey: settings.awsS3.secretAccessKey,
            },
            endpoint: settings.awsS3.endpoint || undefined,
            forcePathStyle: false,
          };
        } else if (settings.provider === StorageProvider.CLOUDFLARE_R2 && settings.cloudflareR2?.accountId && settings.cloudflareR2?.accessKeyId) {
          bucket = settings.cloudflareR2.bucket;
          clientConfig = {
            region: 'auto',
            endpoint: `https://${settings.cloudflareR2.accountId}.r2.cloudflarestorage.com`,
            credentials: {
              accessKeyId: settings.cloudflareR2.accessKeyId,
              secretAccessKey: settings.cloudflareR2.secretAccessKey,
            },
            forcePathStyle: false, // R2 handles this
          };
        } else if (settings.provider === StorageProvider.DIGITAL_OCEAN_SPACES && settings.digitalOceanSpaces?.accessKeyId) {
          bucket = settings.digitalOceanSpaces.bucket;
          clientConfig = {
            endpoint: settings.digitalOceanSpaces.endpoint, // e.g., https://nyc3.digitaloceanspaces.com
            region: settings.digitalOceanSpaces.region || 'nyc3',
            credentials: {
              accessKeyId: settings.digitalOceanSpaces.accessKeyId,
              secretAccessKey: settings.digitalOceanSpaces.secretAccessKey,
            },
            forcePathStyle: false,
          };
        } else if (settings.provider === StorageProvider.MINIO && settings.minio?.accessKey) {
          bucket = settings.minio.bucket;
          const endpointUrl = new URL(settings.minio.endPoint);
          if (!endpointUrl.port && settings.minio.port) endpointUrl.port = String(settings.minio.port);

          clientConfig = {
            endpoint: endpointUrl.href,
            region: 'us-east-1', // MinIO doesn't strictly require this but good to have
            credentials: {
              accessKeyId: settings.minio.accessKey,
              secretAccessKey: settings.minio.secretKey,
            },
            forcePathStyle: true, // Required for MinIO
          };
        }

        if (clientConfig && bucket) {
          // this.logger.debug(`Using ${settings.provider} storage provider`); // Too noisy
          return {
            client: await this.createTenantClient(clientConfig),
            bucketName: bucket,
            settings,
          };
        } else if (!settings.useLocalFallback) {
          throw new Error(`Storage provider ${settings.provider} is selected but invalid configuration found.`);
        }
      }

      // 3. Fallback to Environment Variables (Legacy/Local/Dev)
      const bucketName = this.configService.get<string>('S3_BUCKET_NAME');
      const endpoint = this.configService.get<string>('S3_ENDPOINT');
      const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY');
      const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');

      if (!bucketName || !endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error('S3 configuration is incomplete (Env fallback failed).');
      }

      return {
        client: new S3Client({
          endpoint,
          region: this.configService.get<string>('S3_REGION', 'us-east-1'),
          credentials: { accessKeyId, secretAccessKey },
          forcePathStyle: true,
        }),
        bucketName,
        settings,
      };

    } catch (error) {
      this.logger.error(`Failed to initialize storage client: ${error.message}`);
      throw error;
    }
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    tenantId: string,
    options?: {
      path?: string;
      acl?: 'public-read' | 'private';
      metadata?: Record<string, string>;
    }
  ): Promise<string> {
    try {
      const { client, bucketName, settings } = await this.getClient(tenantId);

      // Determine folder path (default to 'uploads' if not provided)
      const folderPath = options?.path ? options.path.replace(/^\/+|\/+$/g, '') : 'uploads';

      // Enforce tenant isolation in S3 key
      const key = this.normalizeTenantKey(`${tenantId}/${folderPath}/${Date.now()}-${fileName}`, tenantId);

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: options?.acl || 'public-read', // Default to public-read
        Metadata: options?.metadata,
      });

      await client.send(command);

      // Construct URL based on settings
      let fileUrl = '';

      if (settings.provider === StorageProvider.AWS_S3 && settings.awsS3?.publicUrl) {
        fileUrl = `${settings.awsS3.publicUrl}/${key}`;
      } else if (settings.provider === StorageProvider.CLOUDFLARE_R2 && settings.cloudflareR2?.publicUrl) {
        fileUrl = `${settings.cloudflareR2.publicUrl}/${key}`;
      } else if (settings.provider === StorageProvider.DIGITAL_OCEAN_SPACES && settings.digitalOceanSpaces?.cdnUrl) {
        fileUrl = `${settings.digitalOceanSpaces.cdnUrl}/${key}`;
      } else if (settings.provider === StorageProvider.MINIO && settings.minio?.publicUrl) {
        fileUrl = `${settings.minio.publicUrl}/${bucketName}/${key}`;
      } else {
        // Default generic URL construction
        const endpoint = await client.config.endpoint();
        const hostname = endpoint.hostname;
        const protocol = endpoint.protocol;

        // If localhost or internal docker, might need env var for public URL
        const publicEndpoint = this.configService.get<string>('S3_PUBLIC_ENDPOINT') || `${protocol}//${hostname}`;
        fileUrl = `${publicEndpoint}/${bucketName}/${key}`;
      }

      this.logger.log(`File uploaded to ${key}: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(key: string, tenantId: string): Promise<void> {
    try {
      key = this.normalizeTenantKey(key, tenantId);
      const { client, bucketName } = await this.getClient(tenantId);
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await client.send(command);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  async getSignedUrl(key: string, tenantId: string, expiresIn: number = 3600): Promise<string> {
    try {
      key = this.normalizeTenantKey(key, tenantId);
      const { client, bucketName } = await this.getClient(tenantId);
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`);
      throw error;
    }
  }

  // Simplified check - assumes true if getClient succeeds or handles error gracefully
  async isS3Configured(tenantId?: string): Promise<boolean> {
    try {
      await this.getClient(tenantId);
      return true;
    } catch {
      return false;
    }
  }

  async getFileBuffer(key: string, tenantId?: string): Promise<Buffer> {
    try {
      key = this.normalizeTenantKey(key, tenantId);
      const { client, bucketName } = await this.getClient(tenantId);
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await client.send(command);

      if (!response.Body) {
        throw new Error('Empty response body');
      }

      // @ts-ignore
      const byteArray = await response.Body.transformToByteArray();
      return Buffer.from(byteArray);
    } catch (error) {
      this.logger.error(`Failed to download file buffer: ${error.message}`);
      throw error;
    }
  }

  async downloadFile(key: string, tenantId: string, destinationPath: string): Promise<void> {
    const fs = require('fs/promises');
    try {
      const buffer = await this.getFileBuffer(key, tenantId);
      await fs.writeFile(destinationPath, buffer);
    } catch (error) {
      this.logger.error(`Failed to save file to ${destinationPath}: ${error.message}`);
      throw error;
    }
  }

  private normalizeTenantKey(key: string, tenantId?: string): string {
    if (!tenantId || !/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
      throw new Error('Verified tenant scope is required for storage object keys');
    }
    if (typeof key !== 'string' || key.includes('\0')) throw new Error('Invalid storage object key');
    let decoded: string;
    try {
      decoded = decodeURIComponent(key).replace(/\\/g, '/');
    } catch {
      throw new Error('Invalid storage object key encoding');
    }
    const normalized = posix.normalize(`/${decoded}`).replace(/^\/+/, '');
    if (!normalized.startsWith(`${tenantId}/`)) {
      throw new Error('Storage object key is outside the verified tenant prefix');
    }
    return normalized;
  }

  private async createTenantClient(clientConfig: Record<string, any>): Promise<S3Client> {
    if (!clientConfig.endpoint) return new S3Client(clientConfig);
    const endpoint = new URL(clientConfig.endpoint);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
      throw new Error('Invalid tenant storage endpoint');
    }
    const hostname = endpoint.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
    const addresses = isIP(hostname)
      ? [{ address: hostname, family: isIP(hostname) }]
      : await lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address, family }) => !isPublicAddress(address) || isIP(address) !== family)) {
      throw new Error('Tenant storage endpoint resolves to a private or reserved address');
    }
    const selected = addresses[0];
    const pinnedLookup = (_hostname: string, options: any, callback: (...args: any[]) => void) => {
      callback(null, options?.all ? [selected] : selected.address, selected.family);
    };
    const client = new S3Client({ ...clientConfig, endpoint: endpoint.href, followRegionRedirects: false });
    const handler = client.config.requestHandler as any;
    if (!handler?.updateHttpClientConfig) throw new Error('Storage transport cannot enforce pinned DNS');
    handler.updateHttpClientConfig('httpAgent', new HttpAgent({ lookup: pinnedLookup as any }));
    handler.updateHttpClientConfig('httpsAgent', new HttpsAgent({ lookup: pinnedLookup as any }));
    return client;
  }
}
