import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SocialProvider } from '../enums/social-provider.enum';

export class ConnectAccountDto {
    @IsEnum(SocialProvider)
    @IsNotEmpty()
    provider: SocialProvider;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsOptional()
    redirectUri?: string;
}
