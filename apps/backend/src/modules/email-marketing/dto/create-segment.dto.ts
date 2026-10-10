import { IsString, IsOptional, MinLength } from 'class-validator';
import { CreateSegmentDto as ICreateSegmentDto } from '@affexai/shared-types';

export class CreateSegmentDto implements ICreateSegmentDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  criteria?: string;

  @IsOptional()
  openRate?: number;

  @IsOptional()
  clickRate?: number;
}