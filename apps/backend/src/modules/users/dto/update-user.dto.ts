import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** Public profile fields. Authentication credentials are handled by dedicated endpoints. */
export class UpdateUserDto extends PartialType(PickType(CreateUserDto, [
  'email', 'firstName', 'lastName', 'phone', 'avatar', 'address', 'city',
  'country', 'bio', 'primaryRoleId', 'additionalRoleIds', 'roleId', 'metadata',
] as const)) {
  @IsOptional() @IsString() @MaxLength(100)
  customerNumber?: string;

  @IsOptional() @IsString() @MaxLength(200)
  schoolName?: string;

  @IsOptional() @IsString() @MaxLength(100)
  studentId?: string;

  @IsOptional() @IsBoolean()
  isSubscribedToNewsletter?: boolean;
}
