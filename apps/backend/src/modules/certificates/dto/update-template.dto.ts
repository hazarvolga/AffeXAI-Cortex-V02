import { PartialType } from '@nestjs/mapped-types';
import { CreateCertificateTemplateDto } from './create-template.dto';

export class UpdateCertificateTemplateDto extends PartialType(CreateCertificateTemplateDto) {}
