import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { TrustService } from './trust.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@Controller('trust')
@UseGuards(JwtAuthGuard)
export class TrustController {
    constructor(private readonly trustService: TrustService) { }

    @Get('metrics')
    getTrustMetrics(@CurrentUser() user: any) {
        return this.trustService.getTrustMetrics(user.tenantId);
    }
}
