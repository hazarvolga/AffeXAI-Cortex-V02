import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { StrategyService } from '../services/strategy.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';


@Controller('strategy')
@UseGuards(JwtAuthGuard)
export class StrategyController {
    constructor(private readonly strategyService: StrategyService) { }

    @Post('insight')
    async getInsight(@Req() req, @Body() body: { context: string; draftContent?: string }) {
        const tenantId = req.user.tenantId;
        return this.strategyService.getInsight(tenantId, body.context, body.draftContent);
    }

    @Post('feedback')
    async recordFeedback(@Req() req, @Body() body: CreateFeedbackDto) {
        const tenantId = req.user.tenantId;
        return this.strategyService.recordFeedback(tenantId, body);
    }
}
