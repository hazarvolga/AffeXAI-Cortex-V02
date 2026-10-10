import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TicketAnalyticsService } from '../services/ticket-analytics.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

/**
 * Ticket Analytics Controller
 * RESTful API endpoints for ticket analytics and reporting
 */
@ApiTags('Ticket Analytics')
@ApiBearerAuth()
@Controller('tickets/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketAnalyticsController {
  constructor(
    private readonly analyticsService: TicketAnalyticsService,
  ) {}

  /**
   * Get overall ticket statistics
   */
  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get overall ticket statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getOverallStats() {
    return this.analyticsService.getOverallStats();
  }

  /**
   * Get time-based statistics
   */
  @Get('trends')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get time-based ticket trends' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'] })
  @ApiResponse({ status: 200, description: 'Trends retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getTimeBasedStats(
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    return this.analyticsService.getTimeBasedStats(period || 'week');
  }

  /**
   * Get agent performance statistics
   */
  @Get('agents')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get agent performance statistics' })
  @ApiResponse({ status: 200, description: 'Agent stats retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getAgentPerformance() {
    return this.analyticsService.getAgentPerformance();
  }

  /**
   * Get specific agent performance
   */
  @Get('agents/:agentId')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get specific agent performance statistics' })
  @ApiParam({ name: 'agentId', description: 'Agent UUID' })
  @ApiResponse({ status: 200, description: 'Agent stats retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getSpecificAgentPerformance(@Param('agentId') agentId: string) {
    const stats = await this.analyticsService.getAgentPerformance(agentId);
    return stats[0] || null;
  }

  /**
   * Get category statistics
   */
  @Get('categories')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiResponse({ status: 200, description: 'Category stats retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getCategoryStats() {
    return this.analyticsService.getCategoryStats();
  }

  /**
   * Get tag statistics
   */
  @Get('tags')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get tag usage statistics' })
  @ApiResponse({ status: 200, description: 'Tag stats retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getTagStats() {
    return this.analyticsService.getTagStats();
  }

  /**
   * Get customer statistics (admin view)
   */
  @Get('customers')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get customer ticket statistics' })
  @ApiResponse({ status: 200, description: 'Customer stats retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getCustomerStats() {
    return this.analyticsService.getCustomerStats();
  }

  /**
   * Get customer's own statistics
   */
  @Get('my-stats')
  @ApiOperation({ summary: 'Get current user ticket statistics' })
  @ApiResponse({ status: 200, description: 'User stats retrieved successfully' })
  async getMyStats(@CurrentUser('id') userId: string) {
    return this.analyticsService.getCustomerStats(userId);
  }
}
