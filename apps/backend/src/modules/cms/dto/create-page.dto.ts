import { IsString, IsOptional, IsEnum, IsUUID, IsObject } from 'class-validator';
import { PageStatus } from '@affexai/shared-types';

export class CreatePageDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;

  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @IsOptional()
  @IsObject()
  layoutOptions?: Record<string, any>;
}