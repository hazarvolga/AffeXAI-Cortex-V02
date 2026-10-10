import { IsOptional, IsString, IsNumber, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FileUploadOptionsDto {
  @ApiPropertyOptional({
    description: 'Maximum file size in bytes',
    example: 52428800,
    minimum: 1024,
    maximum: 104857600
  })
  @IsOptional()
  @IsNumber()
  @Min(1024) // 1KB minimum
  @Max(104857600) // 100MB maximum
  maxFileSize?: number;

  @ApiPropertyOptional({
    description: 'Allowed MIME types for upload',
    example: ['text/csv', 'application/csv'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedMimeTypes?: string[];

  @ApiPropertyOptional({
    description: 'Whether to generate a job ID for this upload',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  generateJobId?: boolean;

  @ApiPropertyOptional({
    description: 'Custom path within upload directory',
    example: 'imports/bulk-subscribers'
  })
  @IsOptional()
  @IsString()
  customPath?: string;
}

export class FileUploadResponseDto {
  @ApiProperty({
    description: 'Generated job ID for the upload',
    example: 'lm8n9o0p-1a2b3c4d'
  })
  jobId: string;

  @ApiProperty({
    description: 'Generated secure file name',
    example: '1640995200000-a1b2c3d4-subscribers.csv'
  })
  fileName: string;

  @ApiProperty({
    description: 'Original file name as uploaded',
    example: 'subscribers.csv'
  })
  originalFileName: string;

  @ApiProperty({
    description: 'Secure file path on server',
    example: '/temp/uploads/imports/lm8n9o0p-1a2b3c4d/1640995200000-a1b2c3d4-subscribers.csv'
  })
  filePath: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576
  })
  fileSize: number;

  @ApiProperty({
    description: 'MIME type of the uploaded file',
    example: 'text/csv'
  })
  mimeType: string;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2024-01-01T12:00:00.000Z'
  })
  uploadedAt: Date;
}

export class FileValidationResponseDto {
  @ApiProperty({
    description: 'Whether the file passed validation',
    example: true
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Detected or declared file type',
    example: 'text/csv'
  })
  fileType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576
  })
  fileSize: number;

  @ApiProperty({
    description: 'Validation errors if any',
    example: [],
    type: [String]
  })
  errors: string[];

  @ApiProperty({
    description: 'Validation warnings if any',
    example: ['File extension differs from MIME type'],
    type: [String]
  })
  warnings: string[];
}

export class FileInfoResponseDto {
  @ApiProperty({
    description: 'Whether the file exists',
    example: true
  })
  exists: boolean;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1048576
  })
  size?: number;

  @ApiPropertyOptional({
    description: 'MIME type of the file',
    example: 'text/csv'
  })
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'File creation timestamp',
    example: '2024-01-01T12:00:00.000Z'
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Whether the file is readable',
    example: true
  })
  isReadable?: boolean;
}

export class UploadStatsResponseDto {
  @ApiProperty({
    description: 'Total number of uploaded files',
    example: 150
  })
  totalFiles: number;

  @ApiProperty({
    description: 'Total size of all uploaded files in bytes',
    example: 157286400
  })
  totalSize: number;

  @ApiPropertyOptional({
    description: 'Timestamp of the oldest file',
    example: '2024-01-01T12:00:00.000Z'
  })
  oldestFile?: Date;

  @ApiPropertyOptional({
    description: 'Timestamp of the newest file',
    example: '2024-01-15T18:30:00.000Z'
  })
  newestFile?: Date;
}

export class CleanupResponseDto {
  @ApiProperty({
    description: 'Number of files cleaned up',
    example: 25
  })
  cleanedCount: number;

  @ApiProperty({
    description: 'Cleanup operation timestamp',
    example: '2024-01-15T18:30:00.000Z'
  })
  cleanedAt: Date;
}

export class MultipleFileUploadResponseDto {
  @ApiProperty({
    description: 'Successfully uploaded files',
    type: [FileUploadResponseDto]
  })
  successful: FileUploadResponseDto[];

  @ApiProperty({
    description: 'Failed uploads with error messages',
    example: [
      { fileName: 'invalid.txt', error: 'File type not allowed' }
    ]
  })
  failed: Array<{
    fileName: string;
    error: string;
  }>;

  @ApiProperty({
    description: 'Total number of files processed',
    example: 5
  })
  totalProcessed: number;

  @ApiProperty({
    description: 'Number of successful uploads',
    example: 4
  })
  successCount: number;

  @ApiProperty({
    description: 'Number of failed uploads',
    example: 1
  })
  failureCount: number;
}