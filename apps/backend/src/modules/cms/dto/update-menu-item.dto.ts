import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCmsMenuItemDto } from './create-menu-item.dto';

export class UpdateCmsMenuItemDto extends PartialType(
  OmitType(CreateCmsMenuItemDto, ['menuId'] as const),
) {}
