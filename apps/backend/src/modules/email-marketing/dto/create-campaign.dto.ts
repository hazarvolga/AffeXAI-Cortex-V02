import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { CreateCampaignDto as ICreateCampaignDto } from '@affexai/shared-types';

export class CreateCampaignDto implements ICreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: Date;

  @IsString()
  @IsOptional()
  status?: string;
}