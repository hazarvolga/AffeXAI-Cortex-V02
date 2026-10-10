import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';

import { Controller, Get } from '@nestjs/common';
import { StatsService } from '../services/stats.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@Controller('email-marketing/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('recipients')
  getRecipientStats() {
    return this.statsService.getRecipientStats();
  }
}
