import { IsString, IsOptional, MinLength } from 'class-validator';
import { CreateGroupDto as ICreateGroupDto } from '@affexai/shared-types';

export class CreateGroupDto implements ICreateGroupDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}