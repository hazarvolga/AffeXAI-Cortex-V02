import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class GenerateCertificateDto {
  @IsUUID()
  certificateId: string;

  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;

  @IsBoolean()
  @IsOptional()
  regenerate?: boolean; // Force regenerate even if PDF exists
}
