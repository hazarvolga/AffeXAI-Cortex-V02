import { PartialType } from '@nestjs/mapped-types';
import { CreateCmsCategoryDto } from './create-category.dto';

export class UpdateCmsCategoryDto extends PartialType(CreateCmsCategoryDto) {}
