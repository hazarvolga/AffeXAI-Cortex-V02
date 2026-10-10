import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsSecretUpdateInput, maskCredential } from './secret-update.dto';

export enum EmailProvider {
  RESEND = 'resend',
  SENDGRID = 'sendgrid',
  POSTMARK = 'postmark',
  MAILGUN = 'mailgun',
  SES = 'ses',
  SMTP = 'smtp',
}

export class TransactionalEmailDto {
  @IsString()
  domain: string;

  @IsString()
  fromName: string;

  @IsEmail()
  fromEmail: string;

  @IsEmail()
  @IsOptional()
  replyToEmail?: string;
}

export class MarketingEmailDto {
  @IsString()
  domain: string;

  @IsString()
  fromName: string;

  @IsEmail()
  fromEmail: string;

  @IsEmail()
  @IsOptional()
  replyToEmail?: string;
}

export class TrackingSettingsDto {
  @IsBoolean()
  @IsOptional()
  clickTracking?: boolean;

  @IsBoolean()
  @IsOptional()
  openTracking?: boolean;
}

export class RateLimitDto {
  @IsNumber()
  @Min(1)
  @Max(10000)
  transactional: number;

  @IsNumber()
  @Min(1)
  @Max(10000)
  marketing: number;
}

export class ResendConfigDto {
  @IsSecretUpdateInput()
  apiKey: string; // Update endpoints also accept explicit secret operations
}

export class SendGridConfigDto {
  @IsSecretUpdateInput()
  apiKey: string;
}

export class PostmarkConfigDto {
  @IsSecretUpdateInput()
  apiKey: string;
}

export class MailgunConfigDto {
  @IsSecretUpdateInput()
  apiKey: string;

  @IsString()
  domain: string;
}

export class SESConfigDto {
  @IsSecretUpdateInput()
  accessKey: string;

  @IsSecretUpdateInput()
  secretKey: string;

  @IsString()
  region: string;
}

export class SMTPConfigDto {
  @IsString()
  host: string;

  @IsNumber()
  port: number;

  @IsString()
  user: string;

  @IsSecretUpdateInput()
  password: string;

  @IsBoolean()
  secure: boolean;
}

export class EmailSettingsDto {
  @IsEnum(EmailProvider)
  provider: EmailProvider;

  @ValidateNested()
  @Type(() => TransactionalEmailDto)
  transactional: TransactionalEmailDto;

  @ValidateNested()
  @Type(() => MarketingEmailDto)
  marketing: MarketingEmailDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrackingSettingsDto)
  tracking?: TrackingSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RateLimitDto)
  rateLimit?: RateLimitDto;

  // Provider-specific configs (only one will be used based on provider selection)
  @IsOptional()
  @ValidateNested()
  @Type(() => ResendConfigDto)
  resend?: ResendConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SendGridConfigDto)
  sendgrid?: SendGridConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PostmarkConfigDto)
  postmark?: PostmarkConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MailgunConfigDto)
  mailgun?: MailgunConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SESConfigDto)
  ses?: SESConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SMTPConfigDto)
  smtp?: SMTPConfigDto;
}

/**
 * Masked version for client (API keys hidden)
 */
export class EmailSettingsMaskedDto {
  provider: EmailProvider;
  transactional: TransactionalEmailDto;
  marketing: MarketingEmailDto;
  tracking: TrackingSettingsDto;
  rateLimit: RateLimitDto;
  
  resend?: { apiKey: string }; // Will show "***" instead of real key
  sendgrid?: { apiKey: string };
  postmark?: { apiKey: string };
  mailgun?: { apiKey: string; domain: string };
  ses?: { accessKey: string; secretKey: string; region: string };
  smtp?: { host: string; port: number; user: string; password: string; secure: boolean };

  /**
   * Mask sensitive fields
   */
  static mask(settings: EmailSettingsDto): EmailSettingsMaskedDto {
    const masked = JSON.parse(JSON.stringify(settings)) as EmailSettingsMaskedDto;

    if (masked.resend?.apiKey) {
      masked.resend.apiKey = maskCredential(masked.resend.apiKey) ?? '***';
    }
    if (masked.sendgrid?.apiKey) {
      masked.sendgrid.apiKey = maskCredential(masked.sendgrid.apiKey) ?? '***';
    }
    if (masked.postmark?.apiKey) {
      masked.postmark.apiKey = maskCredential(masked.postmark.apiKey) ?? '***';
    }
    if (masked.mailgun?.apiKey) {
      masked.mailgun.apiKey = maskCredential(masked.mailgun.apiKey) ?? '***';
    }
    if (masked.ses?.accessKey) {
      masked.ses.accessKey = maskCredential(masked.ses.accessKey) ?? '***';
    }
    if (masked.ses?.secretKey) {
      masked.ses.secretKey = '***';
    }
    if (masked.smtp?.password) {
      masked.smtp.password = '***';
    }

    return masked;
  }
}
