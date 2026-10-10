import {
  IsString,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

// Top Bar Link DTO
export class TopBarLinkDto {
  @IsString()
  text: string;

  @IsString()
  href: string;

  @IsNumber()
  order: number;

  @IsString()
  @IsOptional()
  icon?: string;
}

// CTA Button DTO
export class CtaButtonDto {
  @IsBoolean()
  show: boolean;

  @IsString()
  text: string;

  @IsString()
  href: string;
}

// Auth Links DTO
export class AuthLinksDto {
  @IsBoolean()
  showLogin: boolean;

  @IsBoolean()
  showSignup: boolean;

  @IsString()
  loginText: string;

  @IsString()
  signupText: string;

  @IsString()
  @IsOptional()
  loginUrl?: string;

  @IsString()
  @IsOptional()
  signupUrl?: string;
}

// Layout DTO
export class LayoutDto {
  @IsBoolean()
  sticky: boolean;

  @IsBoolean()
  transparent: boolean;

  @IsBoolean()
  shadow: boolean;
}

// CTA Buttons Container DTO
export class CtaButtonsDto {
  @ValidateNested()
  @Type(() => CtaButtonDto)
  @IsOptional()
  contact?: CtaButtonDto;

  @ValidateNested()
  @Type(() => CtaButtonDto)
  @IsOptional()
  demo?: CtaButtonDto;
}

// Header Config DTO
export class HeaderConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopBarLinkDto)
  @IsOptional()
  topBarLinks?: TopBarLinkDto[];

  @ValidateNested()
  @Type(() => CtaButtonsDto)
  @IsOptional()
  ctaButtons?: CtaButtonsDto;

  @ValidateNested()
  @Type(() => AuthLinksDto)
  @IsOptional()
  authLinks?: AuthLinksDto;

  @ValidateNested()
  @Type(() => LayoutDto)
  @IsOptional()
  layout?: LayoutDto;
}

// Custom Link DTO
export class CustomLinkDto {
  @IsString()
  name: string;

  @IsString()
  href: string;

  @IsNumber()
  order: number;
}

// Footer Section DTO
export class FooterSectionDto {
  @IsString()
  title: string;

  @IsUUID()
  @IsOptional()
  menuId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomLinkDto)
  @IsOptional()
  customLinks?: CustomLinkDto[];
}

// Footer Config DTO
export class FooterConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterSectionDto)
  @IsOptional()
  sections?: FooterSectionDto[];

  @IsBoolean()
  @IsOptional()
  showLanguageSelector?: boolean;

  @IsString()
  @IsOptional()
  languageText?: string;

  @IsString()
  @IsOptional()
  copyrightText?: string;
}

// Create Theme Settings DTO
export class CreateThemeSettingsDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => HeaderConfigDto)
  @IsOptional()
  headerConfig?: HeaderConfigDto;

  @IsUUID()
  @IsOptional()
  headerMenuId?: string;

  @ValidateNested()
  @Type(() => FooterConfigDto)
  @IsOptional()
  footerConfig?: FooterConfigDto;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// Update Theme Settings DTO
export class UpdateThemeSettingsDto {
  @IsString()
  @IsOptional()
  name?: string;

  @ValidateNested()
  @Type(() => HeaderConfigDto)
  @IsOptional()
  headerConfig?: HeaderConfigDto;

  @IsUUID()
  @IsOptional()
  headerMenuId?: string;

  @ValidateNested()
  @Type(() => FooterConfigDto)
  @IsOptional()
  footerConfig?: FooterConfigDto;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
