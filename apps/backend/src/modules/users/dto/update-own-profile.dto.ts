import { Type } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

const NAME_MAX = 100;
const SHORT_MAX = 50;
const TEXT_MAX = 500;
const BIO_MAX = 2000;

class OwnNotificationPreferencesDto {
  @IsOptional() @IsBoolean() email?: boolean;
  @IsOptional() @IsBoolean() sms?: boolean;
  @IsOptional() @IsBoolean() push?: boolean;
}

class OwnNewsletterPreferencesDto {
  @IsOptional() @IsBoolean() email?: boolean;
  @IsOptional() @IsBoolean() productUpdates?: boolean;
  @IsOptional() @IsBoolean() eventUpdates?: boolean;
}

class OwnCustomerDataDto {
  @IsOptional() @IsString() @MaxLength(SHORT_MAX) customerNumber?: string;
  @IsOptional() @IsString() @MaxLength(NAME_MAX) companyName?: string;
  @IsOptional() @IsString() @MaxLength(SHORT_MAX) taxNumber?: string;
  @IsOptional() @IsString() @MaxLength(SHORT_MAX) companyPhone?: string;
  @IsOptional() @IsString() @MaxLength(TEXT_MAX) companyAddress?: string;
  @IsOptional() @IsString() @MaxLength(NAME_MAX) companyCity?: string;
}

class OwnStudentDataDto {
  @IsOptional() @IsString() @MaxLength(NAME_MAX) schoolName?: string;
  @IsOptional() @IsString() @MaxLength(SHORT_MAX) studentId?: string;
}

/** The metadata keys a user may change about themselves; everything else stays server-owned. */
export class OwnProfileMetadataDto {
  @IsOptional() @IsString() @MaxLength(SHORT_MAX) customerNumber?: string;
  @IsOptional() @IsString() @MaxLength(NAME_MAX) schoolName?: string;
  @IsOptional() @IsString() @MaxLength(SHORT_MAX) studentId?: string;
  @IsOptional() @IsBoolean() isSubscribedToNewsletter?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => OwnNotificationPreferencesDto)
  notificationPreferences?: OwnNotificationPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OwnNewsletterPreferencesDto)
  newsletterPreferences?: OwnNewsletterPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OwnCustomerDataDto)
  customerData?: OwnCustomerDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OwnStudentDataDto)
  studentData?: OwnStudentDataDto;
}

/** Self-service profile edit: no email, role, status or tenant changes. */
export class UpdateOwnProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX)
  firstName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX)
  lastName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(SHORT_MAX)
  phone?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX)
  city?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX)
  country?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(TEXT_MAX)
  address?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(BIO_MAX)
  bio?: string;

  @ApiPropertyOptional({ type: OwnProfileMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OwnProfileMetadataDto)
  metadata?: OwnProfileMetadataDto;
}
