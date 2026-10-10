import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsSecretUpdateInput, maskCredential } from './secret-update.dto';

export enum StorageProvider {
  LOCAL = 'local',
  AWS_S3 = 'aws_s3',
  CLOUDFLARE_R2 = 'cloudflare_r2',
  DIGITAL_OCEAN_SPACES = 'digital_ocean_spaces',
  MINIO = 'minio',
}

const HTTPS_URL_OPTIONS = { protocols: ['https'], require_protocol: true };
const BUCKET_PATTERN = /^[a-z0-9](?:[a-z0-9.-]{1,61}[a-z0-9])?$/;

class BucketDto {
  @IsString()
  @Matches(BUCKET_PATTERN)
  bucket: string;
}

export class AwsS3SettingsDto extends BucketDto {
  @IsString() @IsNotEmpty() accessKeyId: string;
  @IsSecretUpdateInput() secretAccessKey: string;
  @IsString() @IsNotEmpty() region: string;
  @IsOptional() @IsUrl(HTTPS_URL_OPTIONS) endpoint?: string;
  @IsOptional() @IsUrl(HTTPS_URL_OPTIONS) publicUrl?: string;
}

export class CloudflareR2SettingsDto extends BucketDto {
  @IsString() @Matches(/^[a-f0-9]{32}$/i) accountId: string;
  @IsString() @IsNotEmpty() accessKeyId: string;
  @IsSecretUpdateInput() secretAccessKey: string;
  @IsOptional() @IsUrl(HTTPS_URL_OPTIONS) publicUrl?: string;
}

export class DigitalOceanSpacesSettingsDto extends BucketDto {
  @IsString() @IsNotEmpty() accessKeyId: string;
  @IsSecretUpdateInput() secretAccessKey: string;
  @IsString() @IsNotEmpty() region: string;
  @IsUrl(HTTPS_URL_OPTIONS) endpoint: string;
  @IsOptional() @IsUrl(HTTPS_URL_OPTIONS) cdnUrl?: string;
}

export class MinioSettingsDto extends BucketDto {
  @IsUrl(HTTPS_URL_OPTIONS) endPoint: string;
  @IsInt() @Min(1) @Max(65535) port: number;
  @IsBoolean() useSSL: boolean;
  @IsString() @IsNotEmpty() accessKey: string;
  @IsSecretUpdateInput() secretKey: string;
  @IsOptional() @IsUrl(HTTPS_URL_OPTIONS) publicUrl?: string;
}

export class StorageSettingsDto {
  @IsEnum(StorageProvider)
  provider: StorageProvider;

  @IsOptional() @ValidateNested() @Type(() => AwsS3SettingsDto)
  awsS3?: AwsS3SettingsDto;

  @IsOptional() @ValidateNested() @Type(() => CloudflareR2SettingsDto)
  cloudflareR2?: CloudflareR2SettingsDto;

  @IsOptional() @ValidateNested() @Type(() => DigitalOceanSpacesSettingsDto)
  digitalOceanSpaces?: DigitalOceanSpacesSettingsDto;

  @IsOptional() @ValidateNested() @Type(() => MinioSettingsDto)
  minio?: MinioSettingsDto;

  @IsBoolean()
  @IsOptional()
  useLocalFallback: boolean;
}

export class StorageSettingsMaskedDto {
  provider: StorageProvider;
  awsS3?: AwsS3SettingsDto;
  cloudflareR2?: CloudflareR2SettingsDto;
  digitalOceanSpaces?: DigitalOceanSpacesSettingsDto;
  minio?: MinioSettingsDto;
  useLocalFallback: boolean;

  static mask(settings: StorageSettingsDto): StorageSettingsMaskedDto {
    const masked: StorageSettingsMaskedDto = {
      provider: settings.provider,
      useLocalFallback: settings.useLocalFallback,
    };
    if (settings.provider === StorageProvider.AWS_S3 && settings.awsS3) {
      const { secretAccessKey: _secret, ...safe } = settings.awsS3;
      masked.awsS3 = { ...safe, accessKeyId: maskCredential(settings.awsS3.accessKeyId) ?? '', secretAccessKey: settings.awsS3.secretAccessKey ? '***' : '' };
    }
    if (settings.provider === StorageProvider.CLOUDFLARE_R2 && settings.cloudflareR2) {
      const { secretAccessKey: _secret, ...safe } = settings.cloudflareR2;
      masked.cloudflareR2 = { ...safe, accessKeyId: maskCredential(settings.cloudflareR2.accessKeyId) ?? '', secretAccessKey: settings.cloudflareR2.secretAccessKey ? '***' : '' };
    }
    if (settings.provider === StorageProvider.DIGITAL_OCEAN_SPACES && settings.digitalOceanSpaces) {
      const { secretAccessKey: _secret, ...safe } = settings.digitalOceanSpaces;
      masked.digitalOceanSpaces = { ...safe, accessKeyId: maskCredential(settings.digitalOceanSpaces.accessKeyId) ?? '', secretAccessKey: settings.digitalOceanSpaces.secretAccessKey ? '***' : '' };
    }
    if (settings.provider === StorageProvider.MINIO && settings.minio) {
      const { secretKey: _secret, ...safe } = settings.minio;
      masked.minio = { ...safe, accessKey: maskCredential(settings.minio.accessKey) ?? '', secretKey: settings.minio.secretKey ? '***' : '' };
    }
    return masked;
  }
}
