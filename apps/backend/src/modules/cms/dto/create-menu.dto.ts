import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { MenuLocation } from '@affexai/shared-types';

export class CreateCmsMenuDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsEnum(MenuLocation)
  location: MenuLocation;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
