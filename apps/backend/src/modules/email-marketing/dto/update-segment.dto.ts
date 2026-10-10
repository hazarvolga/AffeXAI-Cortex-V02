import { PartialType } from '@nestjs/mapped-types';
import { CreateSegmentDto } from './create-segment.dto';
import { UpdateSegmentDto as IUpdateSegmentDto } from '@affexai/shared-types';

export class UpdateSegmentDto extends PartialType(CreateSegmentDto) implements Partial<IUpdateSegmentDto> {}