import { BadRequestException, Controller, ForbiddenException, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { NotificationListDto } from './dto/notification-list.dto';
import { User } from '../users/entities/user.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private assertRecipient(user: User, supplied?: string): void {
    if (supplied !== undefined && supplied !== user.id) throw new ForbiddenException('Recipient mismatch');
  }

  @Get()
  findAll(@CurrentUser() user: User, @Query() query: NotificationListDto) {
    this.assertRecipient(user, query.userId);
    return this.notificationsService.findAll(user.id, query.limit, query.offset);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationsService.findOne(id, user.id);
  }

  @Post(':id/read')
  markAsRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('read-all')
  async markAllAsRead(@CurrentUser() user: User, @Body() body: { userId?: string } = {}) {
    this.assertRecipient(user, body?.userId);
    await this.notificationsService.markAllAsRead(user.id);
    return { message: 'All notifications marked as read' };
  }

  @Post('create')
  @Roles(UserRole.ADMIN)
  createNotification(@Body() body: { message: string; type: string; userId: string; metadata?: Record<string, unknown>; tenantId?: string }) {
    if (!body || body.tenantId !== undefined) throw new BadRequestException('Tenant is determined by authenticated identity');
    // Tenant-wide socket broadcasts have their own explicit admin authorization.
    return this.notificationsService.createNotification({ message: body.message, type: body.type, userId: body.userId, metadata: body.metadata });
  }
}
