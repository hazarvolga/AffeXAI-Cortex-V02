import { PartialType } from '@nestjs/swagger';
import { CreateTicketTemplateDto } from './create-template.dto';

/**
 * DTO for updating a ticket template
 */
export class UpdateTicketTemplateDto extends PartialType(CreateTicketTemplateDto) {}
