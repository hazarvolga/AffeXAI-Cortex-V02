import { PartialType } from '@nestjs/mapped-types';
import { CreateCampaignDto } from './create-campaign.dto';
import { UpdateCampaignDto as IUpdateCampaignDto } from '@affexai/shared-types';

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) implements Partial<IUpdateCampaignDto> {}