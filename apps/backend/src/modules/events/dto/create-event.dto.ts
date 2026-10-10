import { IsString, IsNotEmpty, IsDate, IsNumber, IsOptional, IsEnum, IsObject, IsDateString, ValidateNested, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CertificateConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @IsOptional()
  templateId?: string | null;

  @IsString()
  @IsOptional()
  logoMediaId?: string | null;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsNumber()
  @IsOptional()
  validityDays?: number | null;

  @IsBoolean()
  @IsOptional()
  autoGenerate?: boolean;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsNumber()
  capacity: number;

  @IsNumber()
  price: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ValidateNested()
  @Type(() => CertificateConfigDto)
  @IsOptional()
  certificateConfig?: CertificateConfigDto | null;

  @IsBoolean()
  @IsOptional()
  grantsCertificate?: boolean;

  @IsString()
  @IsOptional()
  certificateTitle?: string | null;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsObject()
  @IsOptional()
  registrationMetadata?: Record<string, any> | null;

  @IsString()
  @IsOptional()
  status?: string;
}