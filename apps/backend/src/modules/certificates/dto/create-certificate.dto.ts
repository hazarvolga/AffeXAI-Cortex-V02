import { IsString, IsDateString, IsOptional, IsUUID, IsEmail, IsEnum } from 'class-validator';
import { CertificateStatus } from '../entities/certificate.entity';

export class CreateCertificateDto {
  // Recipient Information
  @IsString()
  recipientName: string;

  @IsEmail()
  recipientEmail: string;

  @IsString()
  trainingTitle: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Template & Media
  @IsString()
  @IsOptional()
  templateId?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  logoMediaId?: string; // Media ID for certificate product/subject logo

  @IsString()
  @IsOptional()
  signatureUrl?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string; // Custom image for certificate

  // Dates
  @IsDateString()
  @IsOptional()
  issuedAt?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  // Status
  @IsEnum(CertificateStatus)
  @IsOptional()
  status?: CertificateStatus;

  // Relations
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsOptional()
  eventId?: string;

  // Backward compatibility
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}