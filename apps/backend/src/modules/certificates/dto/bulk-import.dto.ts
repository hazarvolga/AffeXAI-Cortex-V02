import { IsString, IsEmail, IsDateString, IsOptional } from 'class-validator';

export class BulkImportCertificateDto {
  @IsEmail()
  userEmail: string;

  @IsString()
  certificateName: string;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  filePath?: string;
}