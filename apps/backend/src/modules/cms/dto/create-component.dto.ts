import { IsString, IsEnum, IsUUID, IsOptional, IsInt, IsObject, MaxLength } from 'class-validator';
import { ComponentType } from '@affexai/shared-types';

export class CreateComponentDto {
  @IsUUID()
  pageId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsEnum(ComponentType)
  type: ComponentType;

  // ✅ NEW: Prebuild block metadata
  @IsOptional()
  @IsString()
  @MaxLength(100)
  blockType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  blockCategory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  blockId?: string;

  @IsOptional()
  @IsUUID()
  reusableComponentId?: string;

  @IsObject()
  props: any;

  @IsOptional()
  @IsInt()
  orderIndex?: number;
}