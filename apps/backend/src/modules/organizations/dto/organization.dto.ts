import { IsBoolean, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  name: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{1,128}$/)
  slug: string;
}

export class SetOrganizationStatusDto {
  @IsBoolean()
  isActive: boolean;
}
