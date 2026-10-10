import { Controller, Post, Body, Get, UseGuards, ForbiddenException } from '@nestjs/common';
import { InsightEngineService } from './services/insight-engine.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('insight-engine')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class InsightEngineController {
  constructor(private readonly insightEngineService: InsightEngineService) {}

  @Post('analyze/manual')
  async triggerAnalysis(@Body() body: { tenantId?: string }, @CurrentUser('tenantId') tenantId: string) {
    if (body?.tenantId !== undefined && body.tenantId !== tenantId) throw new ForbiddenException('Tenant mismatch');
    return this.insightEngineService.triggerManualAnalysis(tenantId);
  }

  @Get('status')
  getStatus() { return { service: 'insight-engine', manualAnalysisSupported: true }; }
}
