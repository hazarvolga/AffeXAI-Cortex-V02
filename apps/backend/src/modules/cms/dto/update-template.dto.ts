import { PartialType } from '@nestjs/swagger';
import { CreateCmsTemplateDto } from './create-template.dto';

export class UpdateCmsTemplateDto extends PartialType(CreateCmsTemplateDto) {}
