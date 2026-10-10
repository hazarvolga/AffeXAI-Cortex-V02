import { Controller, Post, Get, Body, Req, UseGuards } from "@nestjs/common";
import { BccService } from "./bcc.service";
import { InsightService } from "./insight.service";
import { CreateSignalDto } from "./dto/signal.dto";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    id: string;
  };
}

@Controller("bcc")
@UseGuards(JwtAuthGuard)
export class BccController {
  constructor(
    private readonly bccService: BccService,
    private readonly insightService: InsightService,
  ) { }

  @Post("emit")
  emit(
    @Body() createSignalDto: CreateSignalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    return this.bccService.emit(tenantId, userId, createSignalDto);
  }

  @Get("insights")
  getInsights(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    return this.insightService.getLatestInsights(tenantId);
  }

  @Get("status")
  getStatus(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    return this.bccService.getStatus(tenantId);
  }

  @Get("topology")
  getTopology(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    return this.bccService.getTopology(tenantId);
  }
}
