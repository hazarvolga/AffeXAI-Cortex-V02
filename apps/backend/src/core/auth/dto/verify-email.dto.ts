import { IsString, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @Matches(/^verify_[a-f0-9]{64}$/)
  token: string;
}
