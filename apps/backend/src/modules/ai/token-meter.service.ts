import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenUsage } from './entities/token-usage.entity';
import { AiProvider, AiModel } from '../settings/dto/ai-settings.dto';
import { CommerceService } from '../commerce/services/commerce.service';

@Injectable()
export class TokenMeterService {
    private readonly logger = new Logger(TokenMeterService.name);

    // Approximate costs per 1K tokens (USD) - Simplified for MVP
    private readonly COST_TABLE = {
        [AiModel.GPT_4_TURBO]: 0.01,
        [AiModel.GPT_4O]: 0.005,
        [AiModel.GPT_3_5_TURBO]: 0.001,
        [AiModel.CLAUDE_3_5_SONNET]: 0.003,
        [AiModel.CLAUDE_3_OPUS]: 0.015,
        [AiModel.CLAUDE_3_HAIKU]: 0.00025,
        [AiModel.GEMINI_1_5_PRO]: 0.007,
        [AiModel.GEMINI_1_5_FLASH]: 0.0007,
        [AiModel.LOCAL_LLAMA_3_1]: 0.0, // Free!
        [AiModel.LOCAL_MISTRAL]: 0.0,   // Free!
    };

    constructor(
        @InjectRepository(TokenUsage)
        private readonly tokenRepo: Repository<TokenUsage>,
        private readonly commerceService: CommerceService,
    ) { }

    /**
     * Record usage for a specific generation event
     */
    async trackUsage(
        tenantId: string,
        provider: AiProvider,
        model: AiModel,
        tokens: number,
        taskType: string
    ): Promise<void> {
        try {
            const isLocal = provider === AiProvider.LOCAL;
            const costPer1k = this.COST_TABLE[model] || 0;
            const estimatedCost = (tokens / 1000) * costPer1k;

            const usage = this.tokenRepo.create({
                tenantId,
                provider,
                model,
                tokensUsed: tokens,
                costEstimated: estimatedCost,
                taskType,
                isLocal,
            });

            await this.tokenRepo.save(usage);

            // Economy Bridge: Log to centralized commerce ledger
            await this.commerceService.logUsage(
                tenantId,
                tokens,
                `AI Generation (${model})`,
                'ai_core'
            );

            if (isLocal) {
                this.logger.debug(`Saved ${estimatedCost} USD by using Local AI for tenant ${tenantId}`);
            }
        } catch (error) {
            this.logger.error(`Failed to track token usage: ${error.message}`, error.stack);
            // Don't block the actual AI response if logging fails
        }
    }

    /**
     * Get total usage stats for a tenant
     */
    async getTenantStats(tenantId: string) {
        const totalUsage = await this.tokenRepo
            .createQueryBuilder('usage')
            .where('usage.tenantId = :tenantId', { tenantId })
            .select('SUM(usage.tokensUsed)', 'totalTokens')
            .addSelect('SUM(usage.costEstimated)', 'totalCost')
            .addSelect('SUM(CASE WHEN usage.isLocal = true THEN usage.costEstimated ELSE 0 END)', 'savedCost') // Theoretical saving
            .getRawOne();

        return {
            totalTokens: Number(totalUsage.totalTokens) || 0,
            totalCost: Number(totalUsage.totalCost) || 0,
            // For savedCost, we need to calculate what it WOULD have cost on cloud (e.g. GPT-4o rate)
            // This is a complex query, implemented simply as 'Local Count * Avg Cloud Rate' in dashboard usually.
        };
    }
}
