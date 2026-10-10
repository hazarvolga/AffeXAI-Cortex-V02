import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsUUID, MinLength, MaxLength, IsIn, Min, IsArray, ArrayMinSize, ArrayMaxSize, ArrayUnique } from 'class-validator';

export class CreateCategoryDto {
  @IsOptional()
  @IsUUID()
  ticketCategoryId?: string | null;

  @ApiProperty({ description: 'Category name', example: 'Getting Started' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Category description', example: 'Basic information and setup guides' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Category color',
    example: 'blue',
    enum: ['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo', 'gray']
  })
  @IsOptional()
  @IsString()
  @IsIn(['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo', 'gray'])
  color?: string;

  @ApiPropertyOptional({
    description: 'Category icon',
    example: 'folder',
    enum: ['folder', 'book', 'file', 'tag', 'star', 'heart', 'info', 'help']
  })
  @IsOptional()
  @IsString()
  @IsIn(['folder', 'book', 'file', 'tag', 'star', 'heart', 'info', 'help'])
  icon?: string;

  @ApiPropertyOptional({ description: 'Parent category ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsUUID()
  ticketCategoryId?: string | null;

  @ApiPropertyOptional({ description: 'Category name', example: 'Getting Started' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Category description', example: 'Basic information and setup guides' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Category color',
    example: 'blue',
    enum: ['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo', 'gray']
  })
  @IsOptional()
  @IsString()
  @IsIn(['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo', 'gray'])
  color?: string;

  @ApiPropertyOptional({
    description: 'Category icon',
    example: 'folder',
    enum: ['folder', 'book', 'file', 'tag', 'star', 'heart', 'info', 'help']
  })
  @IsOptional()
  @IsString()
  @IsIn(['folder', 'book', 'file', 'tag', 'star', 'heart', 'info', 'help'])
  icon?: string;

  @ApiPropertyOptional({ description: 'Parent category ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Category active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReorderTicketCategoriesDto {
  @ApiProperty({ description: 'Array of category IDs in new order', example: ['uuid1', 'uuid2', 'uuid3'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID(4, { each: true })
  categoryIds: string[];
}

export class MoveCategoryDto {
  @ApiPropertyOptional({ description: 'New parent category ID (null for root level)', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  newParentId?: string;
}

export class BulkUpdateStatusDto {
  @ApiProperty({ description: 'Array of category IDs to update', example: ['uuid1', 'uuid2'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID(4, { each: true })
  categoryIds: string[];

  @ApiProperty({ description: 'New active status', example: true })
  @IsBoolean()
  isActive: boolean;
}

export class BulkDeleteDto {
  @ApiProperty({ description: 'Array of category IDs to delete', example: ['uuid1', 'uuid2'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID(4, { each: true })
  categoryIds: string[];
}