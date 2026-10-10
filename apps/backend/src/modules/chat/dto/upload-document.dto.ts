import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Chat session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Message ID (optional)', required: false })
  @IsUUID()
  @IsOptional()
  messageId?: string;
}

export class DocumentUploadResponse {
  @ApiProperty({ description: 'Document ID' })
  id: string;

  @ApiProperty({ description: 'Original filename' })
  filename: string;

  @ApiProperty({ description: 'File type' })
  fileType: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ description: 'Processing status' })
  processingStatus: string;

  @ApiProperty({ description: 'Upload timestamp' })
  createdAt: Date;
}

export class DocumentProcessingStatusDto {
  @ApiProperty({ description: 'Document ID' })
  id: string;

  @ApiProperty({ description: 'Processing status' })
  processingStatus: string;

  @ApiProperty({ description: 'Extracted content (if completed)', required: false })
  extractedContent?: string;

  @ApiProperty({ description: 'Processing metadata', required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Processing completion timestamp', required: false })
  processedAt?: Date;
}