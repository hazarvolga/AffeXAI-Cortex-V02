import { PartialType } from '@nestjs/mapped-types';
import { CreateCmsMenuDto } from './create-menu.dto';

export class UpdateCmsMenuDto extends PartialType(CreateCmsMenuDto) {}
