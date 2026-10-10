import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsStrictEmail } from '../../../common/validators/email.validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsStrictEmail({ message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password (min 6 characters)', example: 'SecurePass123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+90 555 123 4567' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Istanbul' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'Turkey' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ description: 'Bio/Description' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ description: 'Role ID (UUID) - Legacy field for backward compatibility', example: 'a1b2c3d4-e5f6-4789-abcd-000000000003' })
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({ description: 'Primary Role ID (UUID) - NEW: Multi-role system', example: 'a1b2c3d4-e5f6-4789-abcd-000000000003' })
  @IsUUID()
  @IsOptional()
  primaryRoleId?: string;

  @ApiPropertyOptional({
    description: 'Additional Role IDs (UUIDs) - NEW: Multi-role system',
    example: ['a1b2c3d4-e5f6-4789-abcd-000000000004', 'a1b2c3d4-e5f6-4789-abcd-000000000005'],
    type: [String]
  })
  @IsUUID('4', { each: true })
  @IsOptional()
  additionalRoleIds?: string[];

  @ApiPropertyOptional({ description: 'Is user active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON object for account types, preferences, etc.)',
    example: { isCustomer: true, isStudent: false, isSubscriber: true }
  })
  @IsOptional()
  metadata?: Record<string, any>;

  // Legacy field - kept for backward compatibility
  @ApiPropertyOptional({ description: 'Legacy role field (deprecated, use primaryRoleId)', deprecated: true })
  @IsString()
  @IsOptional()
  role?: string;
}