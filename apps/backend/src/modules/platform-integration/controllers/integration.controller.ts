import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { Controller, Get, Query, Param } from '@nestjs/common';
import { EventBusService } from '../services/event-bus.service';
import { PlatformEventType, ModuleSource } from '../entities/platform-event.entity';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

/**
 * Integration Controller
 * 
 * Provides endpoints for viewing platform events and statistics.
 */
@Controller('integration')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('settings.manage')
export class IntegrationController {
  constructor(private readonly eventBusService: EventBusService) { }

  /**
   * Get recent events
   */
  @Get('events')
  async getEvents(@Query('limit') limit: string, @CurrentUser() user: User) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.eventBusService.getRecentEvents(user.tenantId, limitNum);
  }

  /**
   * Get events by type
   */
  @Get('events/type/:eventType')
  async getEventsByType(
    @Param('eventType') eventType: PlatformEventType,
    @Query('limit') limit: string,
    @CurrentUser() user: User,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.eventBusService.getEventsByType(eventType, user.tenantId, limitNum);
  }

  /**
   * Get events by source module
   */
  @Get('events/source/:source')
  async getEventsBySource(
    @Param('source') source: ModuleSource,
    @Query('limit') limit: string,
    @CurrentUser() user: User,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.eventBusService.getEventsBySource(source, user.tenantId, limitNum);
  }

  /**
   * Get events with automation
   */
  @Get('events/automated')
  async getEventsWithAutomation(@Query('limit') limit: string, @CurrentUser() user: User) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.eventBusService.getEventsWithAutomation(user.tenantId, limitNum);
  }

  /**
   * Get event statistics
   */
  @Get('events/stats')
  async getEventStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: User,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.eventBusService.getEventStats(user.tenantId, start, end);
  }
}
