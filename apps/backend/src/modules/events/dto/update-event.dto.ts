import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsDateString } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsDateString()
  startDate?: Date;

  @IsDateString()
  endDate?: Date;
}