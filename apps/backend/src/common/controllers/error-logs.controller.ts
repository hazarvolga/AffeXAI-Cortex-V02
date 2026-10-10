import { Controller, Get, Query, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorTrackerService } from '../services/error-tracker.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../modules/users/enums/user-role.enum';

@ApiTags('Error Logs')
@ApiBearerAuth()
@Controller('error-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Only admins can view error logs
export class ErrorLogsController {
  constructor(private readonly errorTracker: ErrorTrackerService) { }

  @Get()
  @ApiOperation({ summary: 'Get recent error logs (Admin only)' })
  async getRecentErrors(@Query('limit') limit: string = '50') {
    const errors = await this.errorTracker.getRecentErrors(parseInt(limit, 10));
    return {
      success: true,
      data: errors,
      meta: { count: errors.length },
    };
  }

  @Get('by-endpoint')
  @ApiOperation({ summary: 'Get errors by endpoint (Admin only)' })
  async getErrorsByEndpoint(
    @Query('endpoint') endpoint: string,
    @Query('limit') limit: string = '20',
  ) {
    const errors = await this.errorTracker.getErrorsByEndpoint(endpoint, parseInt(limit, 10));
    return {
      success: true,
      data: errors,
      meta: { count: errors.length, endpoint },
    };
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Get errors by user (Admin only)' })
  async getErrorsByUser(
    @Query('userId') userId: string,
    @Query('limit') limit: string = '20',
  ) {
    const errors = await this.errorTracker.getErrorsByUser(userId, parseInt(limit, 10));
    return {
      success: true,
      data: errors,
      meta: { count: errors.length, userId },
    };
  }

  @Delete('cleanup')
  @ApiOperation({ summary: 'Clean up old error logs (Admin only)' })
  async cleanupOldErrors(@Query('days') days: string = '30') {
    const deleted = await this.errorTracker.clearOldErrors(parseInt(days, 10));
    return {
      success: true,
      data: { deleted },
      meta: { message: `Deleted ${deleted} error logs older than ${days} days` },
    };
  }
}
