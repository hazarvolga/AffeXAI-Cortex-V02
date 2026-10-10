import { PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, MinLength, ValidateNested } from 'class-validator';
import { CreateUserDto } from '../../../modules/users/dto/create-user.dto';

class NewsletterPreferencesDto {
  @IsBoolean() @IsOptional() productUpdates?: boolean;
  @IsBoolean() @IsOptional() events?: boolean;
  @IsBoolean() @IsOptional() promotions?: boolean;
}

class RegistrationMetadataDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => NewsletterPreferencesDto)
  newsletterPreferences?: NewsletterPreferencesDto;
}

export class RegisterDto extends PickType(CreateUserDto, [
  'email', 'password', 'firstName', 'lastName', 'phone',
] as const) {
  @MinLength(8)
  declare password: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegistrationMetadataDto)
  metadata?: RegistrationMetadataDto;
}

/** Keep the privilege allowlist even for callers outside the validation pipe. */
export function registrationInput(input: RegisterDto): CreateUserDto {
  const preferences = input.metadata?.newsletterPreferences;
  return {
    email: input.email,
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(preferences ? { metadata: { newsletterPreferences: {
      productUpdates: preferences.productUpdates === true,
      events: preferences.events === true,
      promotions: preferences.promotions === true,
    } } } : {}),
  };
}
