import { IsOptional, IsString, IsBoolean, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class CustomerDataDto {
  @ApiPropertyOptional({ description: 'Customer number' })
  @IsOptional()
  @IsString()
  customerNumber?: string;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Tax number' })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiPropertyOptional({ description: 'Company phone' })
  @IsOptional()
  @IsString()
  companyPhone?: string;

  @ApiPropertyOptional({ description: 'Company address' })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiPropertyOptional({ description: 'Company city' })
  @IsOptional()
  @IsString()
  companyCity?: string;
}

class StudentDataDto {
  @ApiPropertyOptional({ description: 'School name' })
  @IsOptional()
  @IsString()
  schoolName?: string;

  @ApiPropertyOptional({ description: 'Student ID' })
  @IsOptional()
  @IsString()
  studentId?: string;
}

class NewsletterPreferencesDto {
  @ApiPropertyOptional({ description: 'Email newsletter subscription' })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional({ description: 'Product updates subscription' })
  @IsOptional()
  @IsBoolean()
  productUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Event updates subscription' })
  @IsOptional()
  @IsBoolean()
  eventUpdates?: boolean;
}

export class CompleteProfileDto {
  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Customer data', type: CustomerDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerDataDto)
  customerData?: CustomerDataDto;

  @ApiPropertyOptional({ description: 'Student data', type: StudentDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StudentDataDto)
  studentData?: StudentDataDto;

  @ApiPropertyOptional({ description: 'Newsletter preferences', type: NewsletterPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewsletterPreferencesDto)
  newsletterPreferences?: NewsletterPreferencesDto;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
