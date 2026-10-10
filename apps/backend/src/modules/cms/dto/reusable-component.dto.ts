import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  IsUUID,
  IsInt,
  IsIn,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a reusable component
 */
export class CreateReusableComponentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsIn([
    'text',
    'button',
    'image',
    'card',
    'form',
    'input',
    'container',
    'grid',
    'block',
    'custom',
  ])
  componentType: string;

  @IsString()
  @IsOptional()
  blockType?: string; // e.g., 'hero-1', 'feature-grid'

  @IsString()
  @IsOptional()
  blockCategory?: string; // e.g., 'hero', 'features'

  @IsObject()
  props: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsObject()
  @IsOptional()
  designTokens?: Record<string, any>;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}

/**
 * DTO for updating a reusable component
 */
export class UpdateReusableComponentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  componentType?: string;

  @IsString()
  @IsOptional()
  blockType?: string;

  @IsString()
  @IsOptional()
  blockCategory?: string;

  @IsObject()
  @IsOptional()
  props?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsObject()
  @IsOptional()
  designTokens?: Record<string, any>;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}

/**
 * DTO for filtering/searching reusable components
 */
export class ReusableComponentFilterDto {
  @IsString()
  @IsOptional()
  search?: string; // Search in name, description, tags

  @IsString()
  @IsOptional()
  componentType?: string; // Filter by type

  @IsString()
  @IsOptional()
  blockCategory?: string; // Filter by category

  @IsUUID()
  @IsOptional()
  categoryId?: string; // Filter by category

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]; // Filter by tags (OR operation)

  @IsUUID()
  @IsOptional()
  authorId?: string; // Filter by author

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPublic?: boolean; // Filter by visibility

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isFeatured?: boolean; // Filter by featured

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  myComponents?: boolean; // Show only user's components

  @IsString()
  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt', 'usageCount', 'featured'])
  sortBy?: string; // Sort field

  @IsString()
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC'; // Sort direction

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number; // Results per page

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number; // Page number
}

/**
 * DTO for duplicating a reusable component
 */
export class DuplicateReusableComponentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsBoolean()
  @IsOptional()
  createNewVersion?: boolean; // If true, link to original as parent
}

/**
 * DTO for bulk import
 */
export class ImportReusableComponentsDto {
  @IsArray()
  components: CreateReusableComponentDto[];

  @IsBoolean()
  @IsOptional()
  overwriteExisting?: boolean; // Overwrite if slug exists
}

/**
 * Response DTO for paginated results
 */
export class PaginatedReusableComponentsDto {
  data: any[]; // ReusableComponent entities
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
