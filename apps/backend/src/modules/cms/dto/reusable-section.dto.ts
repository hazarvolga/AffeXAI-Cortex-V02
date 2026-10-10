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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for section component (used in CreateReusableSectionDto)
 */
export class SectionComponentDto {
  @IsUUID()
  @IsOptional()
  reusableComponentId?: string; // Reference to existing reusable component

  @IsString()
  @IsOptional()
  componentType?: string; // Inline component type (if not using reusable)

  @IsString()
  @IsOptional()
  blockType?: string; // Prebuilt block type

  @IsObject()
  @IsOptional()
  props?: Record<string, any>; // Component properties (if inline)

  @IsUUID()
  @IsOptional()
  parentId?: string; // Parent component ID (for nesting)

  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number; // Order within parent

  @IsObject()
  @IsOptional()
  layoutProps?: Record<string, any>; // Layout properties (width, padding, etc.)
}

/**
 * DTO for creating a reusable section
 */
export class CreateReusableSectionDto {
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
    'header',
    'footer',
    'hero',
    'features',
    'testimonials',
    'pricing',
    'cta',
    'content',
    'gallery',
    'stats',
    'team',
    'faq',
    'blog',
    'custom',
  ])
  sectionType: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsObject()
  @IsOptional()
  designSystem?: Record<string, any>; // Design tokens

  @IsObject()
  @IsOptional()
  layoutOptions?: Record<string, any>; // Layout configuration

  @IsObject()
  @IsOptional()
  constraints?: Record<string, any>; // Usage constraints

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsObject()
  @IsOptional()
  previewConfig?: Record<string, any>; // Preview settings

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionComponentDto)
  @IsOptional()
  components?: SectionComponentDto[]; // Section components
}

/**
 * DTO for updating a reusable section
 */
export class UpdateReusableSectionDto {
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
  sectionType?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsObject()
  @IsOptional()
  designSystem?: Record<string, any>;

  @IsObject()
  @IsOptional()
  layoutOptions?: Record<string, any>;

  @IsObject()
  @IsOptional()
  constraints?: Record<string, any>;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsObject()
  @IsOptional()
  previewConfig?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionComponentDto)
  @IsOptional()
  components?: SectionComponentDto[];
}

/**
 * DTO for filtering/searching reusable sections
 */
export class ReusableSectionFilterDto {
  @IsString()
  @IsOptional()
  search?: string; // Search in name, description, tags

  @IsString()
  @IsOptional()
  sectionType?: string; // Filter by type

  @IsUUID()
  @IsOptional()
  categoryId?: string; // Filter by category

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]; // Filter by tags

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
  mySections?: boolean; // Show only user's sections

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
 * DTO for adding a single component to a section
 */
export class AddSectionComponentDto extends SectionComponentDto {
  // Inherits all properties from SectionComponentDto
}

/**
 * DTO for updating a single component in a section
 */
export class UpdateSectionComponentDto extends SectionComponentDto {
  // Inherits all properties from SectionComponentDto
}

/**
 * DTO for reordering components
 */
export class ReorderSectionComponentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderedComponentDto)
  orderedIds: OrderedComponentDto[];
}

export class OrderedComponentDto {
  @IsUUID()
  id: string;

  @IsInt()
  @Min(0)
  orderIndex: number;
}

/**
 * DTO for adding/updating section components (bulk)
 */
export class UpdateSectionComponentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionComponentDto)
  components: SectionComponentDto[];
}

/**
 * DTO for duplicating a reusable section
 */
export class DuplicateReusableSectionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsBoolean()
  @IsOptional()
  createNewVersion?: boolean; // If true, link to original as parent
}

/**
 * Response DTO for paginated results
 */
export class PaginatedReusableSectionsDto {
  data: any[]; // ReusableSection entities
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
