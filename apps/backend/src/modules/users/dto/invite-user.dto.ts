import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { IsStrictEmail } from '../../../common/validators/email.validator';

export class InviteUserDto {
  @IsStrictEmail()
  email: string;

  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsUUID()
  primaryRoleId: string;

  @IsOptional()
  @IsUUID('4', { each: true })
  additionalRoleIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}
