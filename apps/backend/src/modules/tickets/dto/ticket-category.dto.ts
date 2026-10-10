import { IsString, IsOptional, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

/**
 * DTO for creating a new ticket category
 */
export class CreateTicketCategoryDto {
    @ApiProperty({
        description: 'Category name',
        example: 'Technical Support',
        minLength: 2,
        maxLength: 255,
    })
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({
        description: 'Category description',
        example: 'Technical issues and troubleshooting',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({
        description: 'Parent category ID (for subcategories)',
        example: 'a1b2c3d4-e5f6-4789-abcd-ef1234567890',
    })
    @IsOptional()
    @IsUUID()
    parentId?: string;

    @ApiPropertyOptional({
        description: 'Icon name',
        example: 'settings',
        default: 'folder',
    })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    icon?: string;

    @ApiPropertyOptional({
        description: 'Color code',
        example: 'blue',
        default: 'gray',
    })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    color?: string;
}

/**
 * DTO for updating an existing ticket category
 */
export class UpdateTicketCategoryDto extends PartialType(CreateTicketCategoryDto) { }
