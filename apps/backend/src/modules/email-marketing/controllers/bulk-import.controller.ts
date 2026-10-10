import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Query,
  BadRequestException,
  UseGuards,
  Logger,
  ParseUUIDPipe,
  Req
} from '@nestjs/common';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import type { User } from '../../users/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { BulkImportService } from '../services/bulk-import.service';
import {
  CreateImportJobDto,
  ImportJobSummaryDto,
  ImportJobDetailsDto,
  ImportJobListDto,
  ImportResultListDto,
  CsvValidationDto,
  ImportStatisticsDto,
  ImportJobQueryDto,
  ImportResultQueryDto
} from '../dto/bulk-import.dto';
import { ImportResultStatus } from '../entities/import-result.entity';

@ApiTags('Bulk Import')
@Controller('email-marketing/import')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@ApiBearerAuth()
export class BulkImportController {
  private readonly logger = new Logger(BulkImportController.name);

  constructor(
    private readonly bulkImportService: BulkImportService
  ) { }

  @Post('upload')
  @ApiOperation({
    summary: 'Upload CSV file and create import job',
    description: 'Upload a CSV file for bulk subscriber import with validation and processing options'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Import job created successfully',
    type: ImportJobDetailsDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or import parameters'
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
  async uploadAndCreateImportJob(
    @UploadedFile() file: any,
    @CurrentUser() user: User,
    @Body() body: any
  ): Promise<ImportJobDetailsDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.logger.log(`Import job creation request: ${file.originalname} (${file.size} bytes)`);

    try {
      // Parse options from JSON string if needed
      let options;
      if (typeof body.options === 'string') {
        try {
          options = JSON.parse(body.options);
        } catch (e) {
          throw new BadRequestException('Invalid options format. Expected valid JSON.');
        }
      } else {
        options = body.options;
      }

      if (!options || !options.columnMapping) {
        throw new BadRequestException('Missing required field: options.columnMapping');
      }

      const result = await this.bulkImportService.createImportJob({
        file,
        options: options,
        userId: user.id,
        tenantId: user.tenantId
      });

      this.logger.log(`Import job created successfully: ${result.id}`);

      return result;
    } catch (error) {
      this.logger.error(`Import job creation failed: ${error.message}`);
      throw error;
    }
  }

  @Get(':jobId/status')
  @ApiOperation({
    summary: 'Get import job status',
    description: 'Get current status and progress of an import job'
  })
  @ApiParam({
    name: 'jobId',
    description: 'Import job ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Import job status retrieved',
    type: ImportJobSummaryDto
  })
  @ApiResponse({
    status: 404,
    description: 'Import job not found'
  })
  async getImportJobStatus(
    @Param('jobId', ParseUUIDPipe) jobId: string
  ): Promise<ImportJobSummaryDto> {
    this.logger.log(`Import job status request: ${jobId}`);

    try {
      const result = await this.bulkImportService.getImportJobSummary(jobId);

      this.logger.log(`Import job status retrieved: ${result.status} (${result.progressPercentage}%)`);

      return result;
    } catch (error) {
      this.logger.error(`Import job status retrieval failed: ${error.message}`);
      throw error;
    }
  }

  @Get(':jobId/results')
  @ApiOperation({
    summary: 'Get import validation results',
    description: 'Get detailed validation results for an import job with pagination'
  })
  @ApiParam({
    name: 'jobId',
    description: 'Import job ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['valid', 'invalid', 'risky', 'duplicate'],
    description: 'Filter results by validation status'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results per page',
    example: 100
  })
  @ApiResponse({
    status: 200,
    description: 'Import results retrieved',
    type: ImportResultListDto
  })
  @ApiResponse({
    status: 404,
    description: 'Import job not found'
  })
  async getImportResults(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Query() query: ImportResultQueryDto
  ): Promise<ImportResultListDto> {
    this.logger.log(`Import results request: ${jobId} (page: ${query.page || 1}, limit: ${query.limit || 100})`);

    try {
      const result = await this.bulkImportService.getImportResults(jobId, {
        status: query.status ? query.status as ImportResultStatus : undefined,
        page: query.page || 1,
        limit: query.limit || 100
      });

      this.logger.log(`Import results retrieved: ${result.results.length} results (${result.total} total)`);

      return result;
    } catch (error) {
      this.logger.error(`Import results retrieval failed: ${error.message}`);
      throw error;
    }
  }

  @Get(':jobId/details')
  @ApiOperation({
    summary: 'Get detailed import job information',
    description: 'Get comprehensive information about an import job including configuration and validation summary'
  })
  @ApiParam({
    name: 'jobId',
    description: 'Import job ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Import job details retrieved',
    type: ImportJobDetailsDto
  })
  @ApiResponse({
    status: 404,
    description: 'Import job not found'
  })
  async getImportJobDetails(
    @Param('jobId', ParseUUIDPipe) jobId: string
  ): Promise<ImportJobDetailsDto> {
    this.logger.log(`Import job details request: ${jobId}`);

    try {
      const result = await this.bulkImportService.getImportJob(jobId);

      this.logger.log(`Import job details retrieved: ${result.fileName} (${result.status})`);

      return result;
    } catch (error) {
      this.logger.error(`Import job details retrieval failed: ${error.message}`);
      throw error;
    }
  }

  @Post('validate-csv')
  @ApiOperation({
    summary: 'Validate CSV structure without creating import job',
    description: 'Upload and validate CSV file structure, get column suggestions without processing'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'CSV validation completed',
    type: CsvValidationDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or validation failed'
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
        'text/plain'
      ];

      if (allowedMimeTypes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new BadRequestException(`File type ${file.mimetype} is not allowed for CSV validation`), false);
      }
    }
  }))
  async validateCsvStructure(
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ): Promise<CsvValidationDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.logger.log(`CSV validation request: ${file.originalname}`);

    try {
      // Create temporary file path for validation
      const tempPath = `/tmp/csv-validation-${Date.now()}-${file.originalname}`;

      // This would typically involve saving the file temporarily
      // For now, we'll use the file buffer directly
      const result = await this.bulkImportService.validateCsvStructure(tempPath, user.tenantId);

      this.logger.log(`CSV validation completed: ${result.isValid ? 'VALID' : 'INVALID'} (${result.headers.length} columns)`);

      return result;
    } catch (error) {
      this.logger.error(`CSV validation failed: ${error.message}`);
      throw error;
    }
  }

  @Get('jobs')
  @ApiOperation({
    summary: 'List import jobs',
    description: 'Get paginated list of import jobs with optional filtering'
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'processing', 'completed', 'failed'],
    description: 'Filter by job status'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of jobs per page',
    example: 20
  })
  @ApiResponse({
    status: 200,
    description: 'Import jobs list retrieved',
    type: ImportJobListDto
  })
  async listImportJobs(
    @Query() query: ImportJobQueryDto
  ): Promise<ImportJobListDto> {
    this.logger.log(`Import jobs list request: page ${query.page || 1}, limit ${query.limit || 20}`);

    try {
      const result = await this.bulkImportService.listImportJobs({
        userId: query.userId,
        status: query.status,
        page: query.page || 1,
        limit: query.limit || 20
      });

      this.logger.log(`Import jobs list retrieved: ${result.jobs.length} jobs (${result.total} total)`);

      return result;
    } catch (error) {
      this.logger.error(`Import jobs list retrieval failed: ${error.message}`);
      throw error;
    }
  }

  @Delete(':jobId')
  @ApiOperation({
    summary: 'Cancel import job',
    description: 'Cancel a pending or processing import job and clean up associated files'
  })
  @ApiParam({
    name: 'jobId',
    description: 'Import job ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Import job cancelled successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Job cannot be cancelled (already completed or failed)'
  })
  @ApiResponse({
    status: 404,
    description: 'Import job not found'
  })
  async cancelImportJob(
    @Param('jobId', ParseUUIDPipe) jobId: string
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Import job cancellation request: ${jobId}`);

    try {
      await this.bulkImportService.cancelImportJob(jobId);

      const message = 'Import job cancelled successfully';
      this.logger.log(`Import job cancelled: ${jobId}`);

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Import job cancellation failed: ${error.message}`);
      throw error;
    }
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get import statistics',
    description: 'Get overall statistics about import operations'
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter statistics by user ID'
  })
  @ApiResponse({
    status: 200,
    description: 'Import statistics retrieved',
    type: ImportStatisticsDto
  })
  async getImportStatistics(
    @Query('userId') userId?: string
  ): Promise<ImportStatisticsDto> {
    this.logger.log(`Import statistics request${userId ? ` for user: ${userId}` : ''}`);

    try {
      const result = await this.bulkImportService.getImportStatistics(userId);

      this.logger.log(`Import statistics retrieved: ${result.totalJobs} jobs, ${result.averageSuccessRate}% success rate`);

      return result;
    } catch (error) {
      this.logger.error(`Import statistics retrieval failed: ${error.message}`);
      throw error;
    }
  }
}