import { IsString, IsEnum, IsOptional, IsUrl, IsEmail, IsObject } from 'class-validator';
import { SettingCategory } from '../entities/setting.entity';

export class CreateSettingDto {
  @IsEnum(SettingCategory)
  category: SettingCategory;

  @IsString()
  key: string;

  @IsString()
  @IsOptional()
  value: string;
}