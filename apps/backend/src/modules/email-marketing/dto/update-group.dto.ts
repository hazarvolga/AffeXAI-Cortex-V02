import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupDto } from './create-group.dto';
import { UpdateGroupDto as IUpdateGroupDto } from '@affexai/shared-types';

export class UpdateGroupDto extends PartialType(CreateGroupDto) implements Partial<IUpdateGroupDto> {}