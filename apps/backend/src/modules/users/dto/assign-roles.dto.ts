import { IsUUID, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for assigning multiple roles to a user
 */
export class AssignRolesDto {
  @ApiProperty({
    description: 'Primary role ID',
    example: 'a1b2c3d4-e5f6-4789-abcd-000000000001',
  })
  @IsUUID()
  primaryRoleId: string;

  @ApiProperty({
    description: 'Additional role IDs (optional)',
    example: ['a1b2c3d4-e5f6-4789-abcd-000000000002'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  additionalRoleIds?: string[];

  @ApiProperty({
    description: 'Replace all existing roles (default: true)',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  replaceExisting?: boolean;
}
