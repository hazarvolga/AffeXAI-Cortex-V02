import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../../modules/users/enums/user-role.enum';
import { SupportDashboardService } from '../services/support-dashboard.service';
import {
  DashboardStatsResponseDto,
  SupportAgentStatsResponseDto,
  SessionOverviewResponseDto,
  EscalationAlertResponseDto,
  RealTimeMetricsResponseDto,
  DashboardQueryDto,
  SessionOverviewQueryDto,
} from '../dto/support-dashboard.dto';

import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';

@ApiTags('Support Dashboard')
@Controller('chat/support-dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupportDashboardController {
  constructor(
    private readonly supportDashboardService: SupportDashboardService,
  ) { }

  @Get('stats')
  @Roles(UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get overall dashboard statistics' })
  @ApiQuery({ name: 'dateFrom', description: 'Start date (ISO string)', required: false })
  @ApiQuery({ name: 'dateTo', description: 'End date (ISO string)', required: false })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved', type: DashboardStatsResponseDto })
  async getDashboardStats(
    @Query() query: DashboardQueryDto,
    @CurrentUser() user: any
  ): Promise<DashboardStatsResponseDto> {
    try {
      const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
      const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;

      return await this.supportDashboardService.getDashboardStats(dateFrom, dateTo);
    } catch (error) {
      throw new HttpException(
        `Failed to get dashboard stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('agents')
  @Roles(UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get support agent statistics' })
  @ApiQuery({ name: 'agentId', description: 'Specific agent ID to filter by', required: false })
  @ApiResponse({ status: 200, description: 'Agent statistics retrieved', type: [SupportAgentStatsResponseDto] })
  async getSupportAgentStats(
    @Query() query: DashboardQueryDto,
    @CurrentUser() user: any
  ): Promise<SupportAgentStatsResponseDto[]> {
    try {
      return await this.supportDashboardService.getSupportAgentStats(query.agentId);
    } catch (error) {
      throw new HttpException(
        `Failed to get agent stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my-stats')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current user agent statistics' })
  @ApiResponse({ status: 200, description: 'Current user agent statistics retrieved', type: [SupportAgentStatsResponseDto] })
  async getMyStats(
    @CurrentUser() user: any,
  ): Promise<SupportAgentStatsResponseDto[]> {
    try {
      return await this.supportDashboardService.getSupportAgentStats(user.id);
    } catch (error) {
      throw new HttpException(
        `Failed to get my stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sessions')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get session overview for dashboard' })
  @ApiQuery({ name: 'status', description: 'Filter by session status', required: false })
  @ApiQuery({ name: 'assignedTo', description: 'Filter by assigned support user', required: false })
  @ApiQuery({ name: 'limit', description: 'Maximum number of sessions', required: false })
  @ApiResponse({ status: 200, description: 'Session overview retrieved', type: [SessionOverviewResponseDto] })
  async getSessionOverview(
    @Query() query: SessionOverviewQueryDto,
    @CurrentUser() user: any
  ): Promise<SessionOverviewResponseDto[]> {
    try {
      return await this.supportDashboardService.getSessionOverview(
        query.status,
        query.assignedTo,
        query.limit || 50,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to get session overview: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my-sessions')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get sessions assigned to current user' })
  @ApiQuery({ name: 'limit', description: 'Maximum number of sessions', required: false })
  @ApiResponse({ status: 200, description: 'My sessions retrieved', type: [SessionOverviewResponseDto] })
  async getMySessions(
    @Query() query: SessionOverviewQueryDto,
    @CurrentUser() user: any
  ): Promise<SessionOverviewResponseDto[]> {
    try {
      return await this.supportDashboardService.getSessionOverview(
        undefined, // any status
        user.id, // assigned to current user
        query.limit || 50,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to get my sessions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('escalations')
  @Roles(UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get escalation alerts' })
  @ApiResponse({ status: 200, description: 'Escalation alerts retrieved', type: [EscalationAlertResponseDto] })
  async getEscalationAlerts(
    @CurrentUser() user: any
  ): Promise<EscalationAlertResponseDto[]> {
    try {
      return await this.supportDashboardService.getEscalationAlerts();
    } catch (error) {
      throw new HttpException(
        `Failed to get escalation alerts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('realtime')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get real-time dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Real-time metrics retrieved', type: RealTimeMetricsResponseDto })
  async getRealTimeMetrics(
    @CurrentUser() user: any
  ): Promise<RealTimeMetricsResponseDto> {
    try {
      return await this.supportDashboardService.getRealTimeMetrics();
    } catch (error) {
      throw new HttpException(
        `Failed to get real-time metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('queue')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get sessions in support queue (waiting for assignment)' })
  @ApiQuery({ name: 'limit', description: 'Maximum number of sessions', required: false })
  @ApiResponse({ status: 200, description: 'Queue sessions retrieved', type: [SessionOverviewResponseDto] })
  async getQueueSessions(
    @Query() query: SessionOverviewQueryDto,
    @CurrentUser() user: any
  ): Promise<SessionOverviewResponseDto[]> {
    try {
      // Get active sessions and filter for those without assignments
      const allSessions = await this.supportDashboardService.getSessionOverview(
        'active' as any, // ChatSessionStatus.ACTIVE
        undefined,
        query.limit || 50,
      );

      // Filter for sessions without assigned support
      return allSessions.filter(session => !session.assignedSupport);
    } catch (error) {
      throw new HttpException(
        `Failed to get queue sessions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}