import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { MenuItemType } from '@affexai/shared-types';

export class CreateCmsMenuItemDto {
  @IsUUID()
  menuId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsEnum(MenuItemType)
  type: MenuItemType;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsUUID()
  pageId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  target?: '_blank' | '_self';

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  cssClass?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
