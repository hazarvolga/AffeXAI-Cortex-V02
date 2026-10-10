import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, IsArray } from 'class-validator';
import { MediaType, StorageType, MediaModule, MediaCategory } from '@affexai/shared-types';

export class CreateMediaDto {
  @IsString()
  filename: string;

  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  @IsInt()
  @Min(0)
  size: number;

  @IsString()
  url: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsEnum(MediaType)
  @IsOptional()
  type?: MediaType;

  @IsEnum(StorageType)
  @IsOptional()
  storageType?: StorageType;

  @IsEnum(MediaModule)
  @IsOptional()
  module?: MediaModule;

  @IsEnum(MediaCategory)
  @IsOptional()
  category?: MediaCategory;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  altText?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}