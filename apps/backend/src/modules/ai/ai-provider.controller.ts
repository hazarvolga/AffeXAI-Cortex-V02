import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AiRoutingService } from './ai-routing.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { Request } from 'express';

// Define a minimal interface for the user attached to the request
interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    id: string;
  };
}

@Controller('ai-providers')
export class AiProviderController {
  constructor(private readonly aiRoutingService: AiRoutingService) { }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Req() req: AuthenticatedRequest) {
    // In Phase 1, we rely on the mocked status.
    // In Phase 3, this will return real-time data from Redis/Qdrant health checks.
    const tenantId = req.user.tenantId;
    return this.aiRoutingService.getProviderStatus(tenantId);
  }
}
