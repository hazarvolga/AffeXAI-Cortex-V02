import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean, IsObject, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCrmCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  companyName: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  customerNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactPerson?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  notes?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
