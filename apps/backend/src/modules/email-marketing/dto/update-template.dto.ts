import { PartialType } from '@nestjs/mapped-types';
import { CreateEmailTemplateDto } from './create-template.dto';
import { UpdateTemplateDto as IUpdateTemplateDto } from '@affexai/shared-types';

export class UpdateEmailTemplateDto extends PartialType(CreateEmailTemplateDto) implements Partial<IUpdateTemplateDto> {}