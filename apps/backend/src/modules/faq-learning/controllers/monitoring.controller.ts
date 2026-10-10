import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { MonitoringAlertingService, AlertType, AlertSeverity } from '../services/monitoring-alerting.service';

@ApiTags('FAQ Learning Monitoring')
@ApiBearerAuth()
@Controller('faq-learning/monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringAlertingService) {}

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health status retrieved' })
  async getSystemHealth() {
    const health = await this.monitoringService.getSystemHealth();
    return {
      success: true,
      data: health,
    };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get all alerts' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Alerts retrieved' })
  async getAllAlerts(@Query('limit') limit?: number) {
    const alerts = this.monitoringService.getAllAlerts(limit ? parseInt(limit.toString()) : 50);
    return {
      success: true,
      data: alerts,
    };
  }

  @Get('alerts/active')
  @ApiOperation({ summary: 'Get active alerts' })
  @ApiResponse({ status: 200, description: 'Active alerts retrieved' })
  async getActiveAlerts() {
    const alerts = this.monitoringService.getActiveAlerts();
    return {
      success: true,
      data: alerts,
    };
  }

  @Get('alerts/type/:type')
  @ApiOperation({ summary: 'Get alerts by type' })
  @ApiParam({ name: 'type', enum: AlertType })
  @ApiResponse({ status: 200, description: 'Alerts by type retrieved' })
  async getAlertsByType(@Param('type') type: AlertType) {
    const alerts = this.monitoringService.getAlertsByType(type);
    return {
      success: true,
      data: alerts,
    };
  }

  @Get('alerts/severity/:severity')
  @ApiOperation({ summary: 'Get alerts by severity' })
  @ApiParam({ name: 'severity', enum: AlertSeverity })
  @ApiResponse({ status: 200, description: 'Alerts by severity retrieved' })
  async getAlertsBySeverity(@Param('severity') severity: AlertSeverity) {
    const alerts = this.monitoringService.getAlertsBySeverity(severity);
    return {
      success: true,
      data: alerts,
    };
  }

  @Get('alerts/statistics')
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiResponse({ status: 200, description: 'Alert statistics retrieved' })
  async getAlertStatistics() {
    const stats = await this.monitoringService.getAlertStatistics();
    return {
      success: true,
      data: stats,
    };
  }

  @Post('alerts/:alertId/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  @ApiParam({ name: 'alertId', type: String })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  async resolveAlert(@Param('alertId') alertId: string) {
    const resolved = await this.monitoringService.resolveAlert(alertId);
    return {
      success: resolved,
      message: resolved ? 'Alert resolved successfully' : 'Alert not found or already resolved',
    };
  }

  @Post('alerts/clear-resolved')
  @ApiOperation({ summary: 'Clear all resolved alerts' })
  @ApiResponse({ status: 200, description: 'Resolved alerts cleared' })
  async clearResolvedAlerts() {
    const count = this.monitoringService.clearResolvedAlerts();
    return {
      success: true,
      message: `Cleared ${count} resolved alerts`,
      data: { clearedCount: count },
    };
  }

  @Post('health-check')
  @ApiOperation({ summary: 'Trigger manual health check' })
  @ApiResponse({ status: 200, description: 'Health check triggered' })
  async triggerHealthCheck() {
    await this.monitoringService.performHealthCheck();
    const health = await this.monitoringService.getSystemHealth();
    return {
      success: true,
      message: 'Health check completed',
      data: health,
    };
  }

  @Post('performance-check')
  @ApiOperation({ summary: 'Trigger manual performance check' })
  @ApiResponse({ status: 200, description: 'Performance check triggered' })
  async triggerPerformanceCheck() {
    await this.monitoringService.checkPerformanceMetrics();
    return {
      success: true,
      message: 'Performance check completed',
    };
  }
}
