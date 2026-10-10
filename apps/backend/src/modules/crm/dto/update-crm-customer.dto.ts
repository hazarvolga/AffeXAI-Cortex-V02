import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCrmCustomerDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(255)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  companyName?: string;

  @IsOptional() @IsEmail() @MaxLength(255)
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  email?: string;

  @IsOptional() @IsString() @MaxLength(100)
  customerNumber?: string;

  @IsOptional() @IsString() @MaxLength(100)
  contactPerson?: string;

  @IsOptional() @IsString() @MaxLength(50)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  address?: string;

  @IsOptional() @IsString() @MaxLength(100)
  city?: string;

  @IsOptional() @IsString() @MaxLength(100)
  country?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsString() @MaxLength(5000)
  notes?: string;

  @IsOptional() @IsObject()
  metadata?: Record<string, unknown>;
}
