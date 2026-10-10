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
  Res,
  Req
} from '@nestjs/common';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { BulkExportService } from '../services/bulk-export.service';
import {
  CreateExportJobDto,
  ExportJobResponseDto,
  ExportJobListDto,
  ExportStatsDto,
  AvailableFieldsResponseDto,
  ExportJobSummaryDto,
  ExportJobDetailsDto,
  ExportJobQueryDto,
  ExportStatisticsDto,
  ExportResultListDto
} from '../dto/bulk-export.dto';
import * as fs from 'fs/promises';
import { NotFoundException } from '@nestjs/common';

@ApiTags('Bulk Export')
@Controller('email-marketing/export')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@ApiBearerAuth()
export class BulkExportController {
  private readonly logger = new Logger(BulkExportController.name);

  constructor(
    private readonly bulkExportService: BulkExportService
  ) { }

  @Post()
  @ApiOperation({
    summary: 'Create export job',
    description: 'Create a new export job with specified filters and options'
  })
  @ApiResponse({
    status: 201,
    description: 'Export job created successfully',
    type: ExportJobSummaryDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid export parameters' })
  async createExportJob(
    @CurrentUser() user: User,
    @Body() createExportDto: CreateExportJobDto,
  ): Promise<ExportJobSummaryDto> {
    this.logger.log(`Export job creation request`);

    try {
      // Build filters from DTO - cast to ExportFilters type
      const filters: any = {
        tenantId: user.tenantId,
        status: createExportDto.status,
        groupIds: createExportDto.groupIds,
        segmentIds: createExportDto.segmentIds,
        validationStatus: createExportDto.validationStatus,
      };

      // Add date range if provided
      if (createExportDto.dateRange) {
        filters.dateRange = {
          start: createExportDto.dateRange.start,
          end: createExportDto.dateRange.end,
        };
      }

      // Build options from DTO
      const options = {
        fields: createExportDto.fields,
        format: createExportDto.format,
        includeMetadata: createExportDto.includeMetadata || false,
        batchSize: createExportDto.batchSize || 1000,
      };

      const exportJob = await this.bulkExportService.createExportJob(
        filters,
        options,
        user.tenantId,
        user.id,
      );

      this.logger.log(`Export job created successfully: ${exportJob.id}`);

      return this.mapToSummaryDto(exportJob);
    } catch (error) {
      this.logger.error(`Export job creation failed: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create export job: ${error.message}`);
    }
  }

  @Get(':jobId/status')
  @ApiOperation({
    summary: 'Get export job status',
    description: 'Get current status and progress of an export job'
  })
  @ApiParam({
    name: 'jobId',
    description: 'Export job ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Export job status retrieved successfully',
    type: ExportJobSummaryDto,
  })
  @ApiResponse({ status: 404, description: 'Export job not found' })
  async getExportStatus(
    @Param('jobId', ParseUUIDPipe) jobId: string
  ): Promise<ExportJobSummaryDto> {
    this.logger.log(`Export job status request: ${jobId}`);

    try {
      const exportJob = await this.bulkExportService.getExportStatus(jobId);

      this.logger.log(`Export job status retrieved: ${exportJob.status} (${exportJob.progressPercentage}%)`);

      return this.mapToSummaryDto(exportJob);
    } catch (error) {
      this.logger.error(`Export job status retrieval failed: ${error.message}`);
      throw error;
    }
  }

  @Get('jobs')
  @ApiOperation({
    summary: 'List export jobs',
    description: 'Get paginated list of export jobs with optional filtering'
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
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'processing', 'completed', 'failed'],
    description: 'Filter by job status'
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID'
  })
  @ApiResponse({
    status: 200,
    description: 'Export jobs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        jobs: { type: 'array', items: { $ref: '#/components/schemas/ExportJobSummaryDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' }
      }
    }
  })
  async listExportJobs(
    @CurrentUser() user: User,
    @Query() query: ExportJobListDto,
  ): Promise<{
    jobs: ExportJobSummaryDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log(`Export jobs list request: page ${query.page || 1}, limit ${query.limit || 20}`);

    try {
      const result = await this.bulkExportService.listExportJobs({
        userId: query.userId || user.id,
        tenantId: user.tenantId,
        status: query.status,
        page: query.page || 1,
        limit: query.limit || 20
      });

      this.logger.log(`Export jobs list retrieved: ${result.jobs.length} jobs (${result.total} total)`);

      return {
        jobs: result.jobs.map(job => this.mapToSummaryDto(job)),
        total: result.total,
        page: result.page,
        limit: result.limit
      };
    } catch (error) {
      this.logger.error(`Export jobs list retrieval failed: ${error.message}`);
      throw error;
    }
  }

  @Get(':jobId/download')
  @ApiOperation({
    summary: 'Download export file',
    description: 'Download the generated export file for a completed export job'
  })
  @ApiParam({
    name: 'jobId',
    description: 'Export job ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Export job or file not found' })
  @ApiResponse({ status: 400, description: 'Export not ready for download' })
  async downloadExportFile(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`Export file download request: ${jobId}`);

    try {
      const exportJob = await this.bulkExportService.getExportStatus(jobId);

      // Check if export is completed
      if (exportJob.status !== 'completed') {
        throw new BadRequestException('Export is not ready for download');
      }

      // Check if file exists
      try {
        await fs.access(exportJob.filePath);
      } catch {
        throw new NotFoundException('Export file not found or has expired');
      }

      // Set appropriate headers
      const fileName = exportJob.fileName;
      const mimeType = exportJob.options.format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      this.logger.log(`Streaming export file: ${fileName} (${mimeType})`);

      // Stream the file
      const fileStream = require('fs').createReadStream(exportJob.filePath);
      fileStream.pipe(res);

      fileStream.on('end', () => {
        this.logger.log(`Export file download completed: ${jobId}`);
      });

      fileStream.on('error', (error) => {
        this.logger.error(`Export file streaming error: ${error.message}`);
        if (!res.headersSent) {
          res.status(500).json({ error: 'File streaming failed' });
        }
      });

    } catch (error) {
      this.logger.error(`Export file download failed: ${error.message}`);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to download export file: ${error.message}`);
    }
  }

  @Get(':jobId/results')
  @ApiOperation({
    summary: 'Get export results',
    description: 'Get paginated list of export results with optional filtering'
  })
  @ApiParam({
    name: 'jobId',
    description: 'Export job ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
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
    example: 20
  })
  @ApiResponse({
    status: 200,
    description: 'Export results retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        results: { type: 'array', items: { type: 'object' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' }
      }
    }
  })
  async getExportResults(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Query() query: ExportJobListDto,
  ): Promise<{
    results: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log(`Export results request: ${jobId}, page ${query.page || 1}, limit ${query.limit || 20}`);

    try {
      // Get export job status for now
      const exportJob = await this.bulkExportService.getExportStatus(jobId);

      this.logger.log(`Export results retrieved for job ${jobId}`);

      return {
        results: [],
        total: exportJob.totalRecords || 0,
        page: query.page || 1,
        limit: query.limit || 20
      };
    } catch (error) {
      this.logger.error(`Export results retrieval failed: ${error.message}`);
      throw error;
    }
  }

  @Get(':jobId/details')
  @ApiOperation({
    summary: 'Get export job details',
    description: 'Get detailed information about an export job'
  })
  @ApiParam({
    name: 'jobId',
    description: 'Export job ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Export job details retrieved successfully',
    type: ExportJobDetailsDto,
  })
  @ApiResponse({ status: 404, description: 'Export job not found' })
  async getExportDetails(
    @Param('jobId', ParseUUIDPipe) jobId: string
  ): Promise<ExportJobDetailsDto> {
    this.logger.log(`Export job details request: ${jobId}`);

    try {
      const exportJob = await this.bulkExportService.getExportStatus(jobId);

      this.logger.log(`Export job details retrieved: ${exportJob.status} (${exportJob.progressPercentage}%)`);

      return this.mapToDetailsDto(exportJob);
    } catch (error) {
      this.logger.error(`Export job details retrieval failed: ${error.message}`);
      throw error;
    }
  }

  @Delete(':jobId')
  @ApiOperation({
    summary: 'Delete export job',
    description: 'Delete an export job and its associated data'
  })
  @ApiParam({
    name: 'jobId',
    description: 'Export job ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 204, description: 'Export job deleted successfully' })
  @ApiResponse({ status: 404, description: 'Export job not found' })
  async deleteExportJob(
    @Param('jobId', ParseUUIDPipe) jobId: string
  ): Promise<void> {
    this.logger.log(`Export job deletion request: ${jobId}`);

    try {
      await this.bulkExportService.cancelExportJob(jobId);

      this.logger.log(`Export job deleted successfully: ${jobId}`);
    } catch (error) {
      this.logger.error(`Export job deletion failed: ${error.message}`);
      throw error;
    }
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview export statistics' })
  @ApiResponse({
    status: 200,
    description: 'Export preview generated successfully',
    type: ExportStatisticsDto,
  })
  async previewExport(
    @CurrentUser() user: User,
    @Body() createExportDto: CreateExportJobDto,
  ): Promise<ExportStatisticsDto> {
    try {
      // Build filters from DTO - cast to ExportFilters type
      const filters: any = {
        tenantId: user.tenantId,
        status: createExportDto.status,
        groupIds: createExportDto.groupIds,
        segmentIds: createExportDto.segmentIds,
        validationStatus: createExportDto.validationStatus,
      };

      // Add date range if provided
      if (createExportDto.dateRange) {
        filters.dateRange = {
          start: createExportDto.dateRange.start,
          end: createExportDto.dateRange.end,
        };
      }

      // Get count of matching subscribers
      const query = await this.bulkExportService.buildSubscriberQuery(filters);
      const totalSubscribers = await query.getCount();

      // Estimate file size (rough calculation)
      const avgFieldSize = 20; // Average bytes per field
      const fieldCount = createExportDto.fields.length;
      const estimatedFileSizeBytes = totalSubscribers * fieldCount * avgFieldSize;

      // Estimate processing time (rough calculation)
      const recordsPerSecond = 1000; // Estimated processing speed
      const estimatedProcessingTimeSeconds = Math.ceil(totalSubscribers / recordsPerSecond);

      return {
        totalSubscribers,
        estimatedFileSizeBytes,
        estimatedProcessingTimeSeconds,
        totalExports: 0,
        activeExports: 0,
        completedExports: 0,
        failedExports: 0,
        totalRecordsExported: 0,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to generate export preview: ${error.message}`);
    }
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload export file' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'file',
    description: 'Export file to upload',
    type: 'string',
    format: 'binary',
  })
  @ApiResponse({
    status: 201,
    description: 'Export file uploaded successfully',
    type: ExportJobSummaryDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async uploadExportFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ExportJobSummaryDto> {
    this.logger.log(`Export file upload request`);

    try {
      // For now, return a placeholder response
      // This endpoint needs proper implementation
      throw new BadRequestException('Export file upload not yet implemented');
    } catch (error) {
      this.logger.error(`Export file upload failed: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to upload export file: ${error.message}`);
    }
  }

  /**
   * Map export job entity to summary DTO
   */
  private mapToSummaryDto(exportJob: any): ExportJobSummaryDto {
    return {
      id: exportJob.id,
      fileName: exportJob.fileName,
      status: exportJob.status,
      totalRecords: exportJob.totalRecords,
      processedRecords: exportJob.processedRecords,
      progressPercentage: exportJob.progressPercentage,
      createdAt: exportJob.createdAt,
      completedAt: exportJob.completedAt,
      error: exportJob.error
    };
  }

  /**
   * Map export job entity to details DTO
   */
  private mapToDetailsDto(exportJob: any): ExportJobDetailsDto {
    return {
      id: exportJob.id,
      fileName: exportJob.fileName,
      status: exportJob.status,
      totalRecords: exportJob.totalRecords,
      processedRecords: exportJob.processedRecords,
      progressPercentage: exportJob.progressPercentage,
      createdAt: exportJob.createdAt,
      completedAt: exportJob.completedAt,
      error: exportJob.error,
      filters: exportJob.filters,
      options: exportJob.options,
      filePath: exportJob.filePath,
      userId: exportJob.userId
    };
  }
}