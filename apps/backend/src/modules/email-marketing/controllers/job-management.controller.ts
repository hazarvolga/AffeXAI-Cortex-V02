import { PlatformAdminGuard } from '../../../core/auth/guards/platform-admin.guard';
import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { BulkImportService } from '../services/bulk-import.service';
import { BulkExportService } from '../services/bulk-export.service';
import { ExportCleanupService } from '../services/export-cleanup.service';
import {
  ImportJobSummaryDto,
  ExportJobSummaryDto,
  JobStatisticsDto,
  CleanupResultDto,
  JobListResponseDto,
  JobSummaryDto,
  JobCleanupResponseDto,
  JobType
} from '../dto/job-management.dto';

@ApiTags('Job Management')
@Controller('email-marketing/jobs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@ApiBearerAuth()
export class JobManagementController {
  private readonly logger = new Logger(JobManagementController.name);

  constructor(
    private readonly bulkImportService: BulkImportService,
    private readonly bulkExportService: BulkExportService,
    private readonly exportCleanupService: ExportCleanupService
  ) { }

  @Get()
  @ApiOperation({
    summary: 'List all jobs',
    description: 'Get paginated list of both import and export jobs with optional filtering'
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['import', 'export'],
    description: 'Filter by job type'
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
    description: 'Jobs list retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        jobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['import', 'export'] },
              fileName: { type: 'string' },
              status: { type: 'string' },
              totalRecords: { type: 'number' },
              processedRecords: { type: 'number' },
              progressPercentage: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
              completedAt: { type: 'string', format: 'date-time', nullable: true },
              error: { type: 'string', nullable: true }
            }
          }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' }
      }
    }
  })
  async listAllJobs(
    @Query('type') type?: 'import' | 'export',
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: User
  ): Promise<JobListResponseDto> {
    const actualPage = page || 1;
    const actualLimit = limit || 20;

    this.logger.log(`Jobs list request: type=${type}, status=${status}, page=${actualPage}, limit=${actualLimit}`);

    try {
      const jobs: JobSummaryDto[] = [];
      let totalJobs = 0;

      // Fetch import jobs if requested or no type filter
      if (!type || type === 'import') {
        const importResult = await this.bulkImportService.listImportJobs({
          userId: user?.id,
          status: status as any,
          page: 1,
          limit: 1000 // Get all for now, we'll implement proper pagination later
        });

        const importJobs = importResult.jobs.map(job => ({
          id: job.id,
          type: JobType.IMPORT,
          fileName: job.fileName,
          status: job.status as any,
          totalRecords: job.totalRecords,
          processedRecords: job.processedRecords,
          progressPercentage: job.progressPercentage,
          createdAt: job.createdAt,
          completedAt: job.completedAt
        }));

        jobs.push(...importJobs);
        totalJobs += importResult.total;
      }

      // Fetch export jobs if requested or no type filter
      if (!type || type === 'export') {
        const exportResult = await this.bulkExportService.listExportJobs({
          userId: user?.id,
          status,
          page: 1,
          limit: 1000 // Get all for now, we'll implement proper pagination later
        });

        const exportJobs = exportResult.jobs.map(job => ({
          id: job.id,
          type: JobType.EXPORT,
          fileName: job.fileName,
          status: job.status as any,
          totalRecords: job.totalRecords,
          processedRecords: job.processedRecords,
          progressPercentage: job.progressPercentage,
          createdAt: job.createdAt,
          completedAt: job.completedAt
        }));

        jobs.push(...exportJobs);
        totalJobs += exportResult.total;
      }

      // Sort by creation date (newest first)
      jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination
      const startIndex = (actualPage - 1) * actualLimit;
      const endIndex = startIndex + actualLimit;
      const paginatedJobs = jobs.slice(startIndex, endIndex);

      this.logger.log(`Jobs list retrieved: ${paginatedJobs.length} jobs (${totalJobs} total)`);

      return {
        jobs: paginatedJobs,
        total: totalJobs,
        page: actualPage,
        limit: actualLimit
      };
    } catch (error) {
      this.logger.error(`Jobs list retrieval failed: ${error.message}`);
      throw error;
    }
  }

  @Delete(':jobId')
  @ApiOperation({
    summary: 'Cancel job',
    description: 'Cancel a pending or processing job and clean up associated files'
  })
  @ApiParam({
    name: 'jobId',
    description: 'Job ID (import or export)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Job cancelled successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        jobType: { type: 'string', enum: ['import', 'export'] }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Job cannot be cancelled (already completed or failed)'
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found'
  })
  async cancelJob(
    @Param('jobId', ParseUUIDPipe) jobId: string
  ): Promise<{ success: boolean; message: string; jobType: string }> {
    this.logger.log(`Job cancellation request: ${jobId}`);

    try {
      // Try to find and cancel as import job first
      try {
        await this.bulkImportService.cancelImportJob(jobId);

        const message = 'Import job cancelled successfully';
        this.logger.log(`Import job cancelled: ${jobId}`);

        return { success: true, message, jobType: 'import' };
      } catch (importError) {
        // If not found as import job, try as export job
        if (importError instanceof NotFoundException) {
          try {
            await this.bulkExportService.cancelExportJob(jobId);

            const message = 'Export job cancelled successfully';
            this.logger.log(`Export job cancelled: ${jobId}`);

            return { success: true, message, jobType: 'export' };
          } catch (exportError) {
            if (exportError instanceof NotFoundException) {
              throw new NotFoundException(`Job ${jobId} not found`);
            }
            throw exportError;
          }
        }
        throw importError;
      }
    } catch (error) {
      this.logger.error(`Job cancellation failed: ${error.message}`);
      throw error;
    }
  }

  @Post('cleanup')
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({
    summary: 'Clean up old jobs',
    description: 'Remove old completed/failed jobs and their associated files'
  })
  @ApiQuery({
    name: 'olderThanDays',
    required: false,
    type: Number,
    description: 'Remove jobs older than specified days',
    example: 30
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup completed successfully',
    schema: {
      type: 'object',
      properties: {
        cleanedJobs: { type: 'number' },
        cleanedFiles: { type: 'number' },
        cleanedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  async cleanupOldJobs(
    @Query('olderThanDays') olderThanDays: number = 30
  ): Promise<JobCleanupResponseDto> {
    this.logger.log(`Job cleanup request: older than ${olderThanDays} days`);

    try {
      // Clean up import jobs
      const cleanedImportJobs = await this.bulkImportService.cleanupOldJobs(olderThanDays);

      // Clean up export jobs
      const cleanedExportJobs = await this.bulkExportService.cleanupOldJobs(olderThanDays);

      const totalCleanedJobs = cleanedImportJobs + cleanedExportJobs;
      const totalCleanedFiles = totalCleanedJobs; // Assuming 1 file per job

      const response: JobCleanupResponseDto = {
        cleanedCount: totalCleanedJobs,
        cleanedJobs: totalCleanedJobs,
        cleanedAt: new Date()
      };

      this.logger.log(`Job cleanup completed: ${totalCleanedJobs} jobs, ${totalCleanedFiles} files`);

      return response;
    } catch (error) {
      this.logger.error(`Job cleanup failed: ${error.message}`);
      throw error;
    }
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get job statistics',
    description: 'Get overall statistics about import and export operations'
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter statistics by user ID'
  })
  @ApiResponse({
    status: 200,
    description: 'Job statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalJobs: { type: 'number' },
        importJobs: { type: 'number' },
        exportJobs: { type: 'number' },
        completedJobs: { type: 'number' },
        failedJobs: { type: 'number' },
        processingJobs: { type: 'number' },
        pendingJobs: { type: 'number' },
        totalRecordsProcessed: { type: 'number' },
        averageProcessingTime: { type: 'number' }
      }
    }
  })
  async getJobStatistics(
    @Query('userId') userId?: string,
    @CurrentUser() user?: User
  ): Promise<JobStatisticsDto> {
    this.logger.log(`Job statistics request${userId ? ` for user: ${userId}` : ''}`);

    try {
      // Use current user if no userId specified
      const targetUserId = userId || user?.id;

      // Get import statistics
      const importStats = await this.bulkImportService.getImportStatistics(targetUserId);

      // Get export statistics (assuming similar method exists)
      // For now, we'll create a basic structure
      const exportStats = {
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        totalRecordsProcessed: 0,
        totalValidRecords: 0,
        averageSuccessRate: 0
      };

      // Combine statistics
      const totalJobs = importStats.totalJobs + exportStats.totalJobs;
      const completedJobs = importStats.completedJobs + exportStats.completedJobs;
      const failedJobs = importStats.failedJobs + exportStats.failedJobs;
      const totalRecordsProcessed = importStats.totalRecordsProcessed + exportStats.totalRecordsProcessed;

      // Calculate derived statistics
      const processingJobs = 0; // Would need to query current processing jobs
      const pendingJobs = 0; // Would need to query current pending jobs
      const averageProcessingTime = 0; // Would need to calculate from job completion times

      const statistics: JobStatisticsDto = {
        totalJobs,
        totalImportJobs: importStats.totalJobs,
        activeImportJobs: 0, // Would need to query current active jobs
        completedImportJobs: importStats.completedJobs,
        failedImportJobs: importStats.failedJobs,
        totalExportJobs: exportStats.totalJobs,
        activeExportJobs: 0, // Would need to query current active jobs
        completedExportJobs: exportStats.completedJobs,
        failedExportJobs: exportStats.failedJobs,
        totalRecordsProcessed,
        completedJobs,
        failedJobs,
        processingJobs,
        pendingJobs,
        averageProcessingTime
      };

      this.logger.log(`Job statistics retrieved: ${totalJobs} total jobs, ${completedJobs} completed`);

      return statistics;
    } catch (error) {
      this.logger.error(`Job statistics retrieval failed: ${error.message}`);
      throw error;
    }
  }

  @Get(':jobId/details')
  @ApiOperation({
    summary: 'Get job details',
    description: 'Get detailed information about a specific job (import or export)'
  })
  @ApiParam({
    name: 'jobId',
    description: 'Job ID (import or export)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Job details retrieved successfully',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/ImportJobDetailsDto' },
        { $ref: '#/components/schemas/ExportJobResponseDto' }
      ]
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found'
  })
  async getJobDetails(
    @Param('jobId', ParseUUIDPipe) jobId: string
  ): Promise<any> {
    this.logger.log(`Job details request: ${jobId}`);

    try {
      // Try to find as import job first
      try {
        const importJob = await this.bulkImportService.getImportJob(jobId);
        this.logger.log(`Import job details retrieved: ${importJob.fileName}`);
        return { ...importJob, jobType: 'import' };
      } catch (importError) {
        // If not found as import job, try as export job
        if (importError instanceof NotFoundException) {
          try {
            const exportJob = await this.bulkExportService.getExportStatus(jobId);
            this.logger.log(`Export job details retrieved: ${exportJob.fileName}`);
            return { ...exportJob, jobType: 'export' };
          } catch (exportError) {
            if (exportError instanceof NotFoundException) {
              throw new NotFoundException(`Job ${jobId} not found`);
            }
            throw exportError;
          }
        }
        throw importError;
      }
    } catch (error) {
      this.logger.error(`Job details retrieval failed: ${error.message}`);
      throw error;
    }
  }
}