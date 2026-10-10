import { IsEmail, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMarketingEmailDto {
  @IsEmail()
  @MaxLength(254)
  to: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(998)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1_000_000)
  body: string;
}

export class SendCampaignEmailDto extends SendMarketingEmailDto {
  @IsUUID()
  campaignId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  recipientId: string;
}
