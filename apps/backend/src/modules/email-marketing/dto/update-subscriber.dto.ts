import { PartialType } from '@nestjs/mapped-types';
import { CreateSubscriberDto } from './create-subscriber.dto';
import { UpdateSubscriberDto as IUpdateSubscriberDto } from '@affexai/shared-types';

export class UpdateSubscriberDto extends PartialType(CreateSubscriberDto) implements Partial<IUpdateSubscriberDto> {}