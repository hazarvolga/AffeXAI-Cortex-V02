import { PlatformAdminGuard } from '../../../core/auth/guards/platform-admin.guard';
import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Param,
  Query,
  BadRequestException,
  UseGuards,
  Logger,
  ParseUUIDPipe,
  Res,
  Req
} from '@nestjs/common';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { FileUploadService } from '../services/file-upload.service';
import { EnhancedFileSecurityService } from '../services/enhanced-file-security.service';
import { FileProcessingService } from '../services/file-processing.service';
import {
  FileUploadOptionsDto,
  FileUploadResponseDto,
  FileValidationResponseDto,
  FileInfoResponseDto,
  UploadStatsResponseDto,
  CleanupResponseDto,
  MultipleFileUploadResponseDto
} from '../dto/file-upload.dto';

@ApiTags('File Upload')
@Controller('email-marketing/files')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@ApiBearerAuth()
export class FileUploadController {
  private readonly logger = new Logger(FileUploadController.name);

  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly securityService: EnhancedFileSecurityService,
    private readonly fileProcessingService: FileProcessingService
  ) { }

  @Post('upload')
  @ApiOperation({
    summary: 'Upload a single file',
    description: 'Upload a CSV or Excel file for bulk import processing with security validation'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: FileUploadResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or upload parameters'
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 1
    },
    fileFilter: (req, file, callback) => {
      const allowedMimeTypes = [
        'text/csv',
        'application/csv',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (allowedMimeTypes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new BadRequestException(`File type ${file.mimetype} is not allowed`), false);
      }
    }
  }))
  async uploadFile(
    @UploadedFile() file: any,
    @CurrentUser() user: any,
    @Body() options: FileUploadOptionsDto = {}
  ): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.logger.log(`File upload request: ${file.originalname} (${file.size} bytes)`);

    try {
      const result = await this.fileUploadService.uploadFile(file, user.tenantId, options);

      this.logger.log(`File upload successful: ${result.jobId}`);

      return result;
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`);
      throw error;
    }
  }

  @Post('upload/multiple')
  @ApiOperation({
    summary: 'Upload multiple files',
    description: 'Upload multiple CSV or Excel files for batch processing'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Files processed (some may have failed)',
    type: MultipleFileUploadResponseDto
  })
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB per file
      files: 10
    }
  }))
  async uploadMultipleFiles(
    @UploadedFiles() files: any[],
    @CurrentUser() user: any,
    @Body() options: FileUploadOptionsDto = {}
  ): Promise<MultipleFileUploadResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    this.logger.log(`Multiple file upload request: ${files.length} files`);

    try {
      const results = await this.fileUploadService.uploadMultipleFiles(files, user.tenantId, options);

      const response: MultipleFileUploadResponseDto = {
        successful: results,
        failed: [], // FileUploadService handles failures internally
        totalProcessed: files.length,
        successCount: results.length,
        failureCount: files.length - results.length
      };

      this.logger.log(`Multiple file upload completed: ${response.successCount}/${response.totalProcessed} successful`);

      return response;
    } catch (error) {
      this.logger.error(`Multiple file upload failed: ${error.message}`);
      throw error;
    }
  }

  @Post('validate')
  @ApiOperation({
    summary: 'Validate file without uploading',
    description: 'Validate file type, size, and security without storing the file'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'File validation completed',
    type: FileValidationResponseDto
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024
    }
  }))
  async validateFile(
    @UploadedFile() file: any
  ): Promise<FileValidationResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.logger.log(`File validation request: ${file.originalname}`);

    try {
      const result = await this.fileProcessingService.validateFileType(file);

      this.logger.log(`File validation completed: ${result.isValid ? 'VALID' : 'INVALID'}`);

      return result;
    } catch (error) {
      this.logger.error(`File validation failed: ${error.message}`);
      throw error;
    }
  }

  @Get('info/:jobId/:fileName')
  @ApiOperation({
    summary: 'Get file information',
    description: 'Get information about an uploaded file without downloading it'
  })
  @ApiResponse({
    status: 200,
    description: 'File information retrieved',
    type: FileInfoResponseDto
  })
  async getFileInfo(
    @Param('jobId') jobId: string,
    @Param('fileName') fileName: string
  ): Promise<FileInfoResponseDto> {
    this.logger.log(`File info request: ${jobId}/${fileName}`);

    try {
      // Construct secure file path using FileProcessingService
      const filePath = this.fileProcessingService.generateSecureFilePath(fileName, jobId);
      const result = await this.fileUploadService.getFileInfo(filePath);

      this.logger.log(`File info retrieved: ${result.exists ? 'EXISTS' : 'NOT_FOUND'}`);

      return result;
    } catch (error) {
      this.logger.error(`File info retrieval failed: ${error.message}`);
      throw error;
    }
  }

  @Delete(':jobId/:fileName')
  @ApiOperation({
    summary: 'Delete uploaded file',
    description: 'Securely delete an uploaded file'
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'File not found'
  })
  async deleteFile(
    @Param('jobId') jobId: string,
    @Param('fileName') fileName: string
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`File deletion request: ${jobId}/${fileName}`);

    try {
      // Construct secure file path using FileProcessingService
      const filePath = this.fileProcessingService.generateSecureFilePath(fileName, jobId);
      const success = await this.fileUploadService.deleteFile(filePath);

      const message = success ? 'File deleted successfully' : 'File not found or could not be deleted';

      this.logger.log(`File deletion completed: ${success ? 'SUCCESS' : 'FAILED'}`);

      return { success, message };
    } catch (error) {
      this.logger.error(`File deletion failed: ${error.message}`);
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get upload statistics',
    description: 'Get statistics about uploaded files'
  })
  @ApiResponse({
    status: 200,
    description: 'Upload statistics retrieved',
    type: UploadStatsResponseDto
  })
  async getUploadStats(): Promise<UploadStatsResponseDto> {
    this.logger.log('Upload stats request');

    try {
      const stats = await this.fileUploadService.getUploadStats();

      this.logger.log(`Upload stats retrieved: ${stats.totalFiles} files, ${stats.totalSize} bytes`);

      return stats;
    } catch (error) {
      this.logger.error(`Upload stats retrieval failed: ${error.message}`);
      throw error;
    }
  }

  @Post('cleanup')
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({
    summary: 'Clean up old files',
    description: 'Remove uploaded files older than specified hours'
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup completed',
    type: CleanupResponseDto
  })
  async cleanupOldFiles(
    @Query('maxAgeHours') maxAgeHours: number = 24
  ): Promise<CleanupResponseDto> {
    this.logger.log(`Cleanup request: files older than ${maxAgeHours} hours`);

    try {
      const cleanedCount = await this.fileUploadService.cleanupOldFiles(maxAgeHours);

      const response: CleanupResponseDto = {
        cleanedCount,
        cleanedAt: new Date()
      };

      this.logger.log(`Cleanup completed: ${cleanedCount} files removed`);

      return response;
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`);
      throw error;
    }
  }
}