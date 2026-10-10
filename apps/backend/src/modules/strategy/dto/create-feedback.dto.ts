import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FeedbackAction {
    THUMBS_UP = 'THUMBS_UP',
    THUMBS_DOWN = 'THUMBS_DOWN',
    COPY = 'COPY',
    EDIT = 'EDIT'
}

export class CreateFeedbackDto {
    @ApiProperty({ description: 'ID of the signal or insight being rated', required: false })
    @IsString()
    @IsOptional()
    signalId?: string;

    @ApiProperty({ description: 'Context ID (e.g., Ticket ID, Email Campaign ID)' })
    @IsString()
    @IsNotEmpty()
    contextId: string;

    @ApiProperty({ enum: FeedbackAction, description: 'User action' })
    @IsEnum(FeedbackAction)
    action: FeedbackAction;

    @ApiProperty({ description: 'Constructive feedback text (optional)', required: false })
    @IsString()
    @IsOptional()
    comment?: string;
}
