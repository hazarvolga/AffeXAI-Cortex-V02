import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString, IsEnum } from 'class-validator';
import { SocialPostStatus } from '../enums/post-status.enum';

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    mediaUrls?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    accountIds: string[];

    @IsDateString()
    @IsOptional()
    scheduledAt?: string;

    @IsEnum(SocialPostStatus)
    @IsOptional()
    status?: SocialPostStatus;
}
