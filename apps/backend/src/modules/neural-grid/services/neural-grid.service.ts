import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { postToCortex } from '../../../core/cortex/signed-request';

import { NeuralSignal } from '../interfaces/neural-signal.interface';

interface TenantRewardState {
    totalReward: number;
    signalCount: number;
    lastSignalAt: Date;
}

/**
 * NeuralGridService - The Central Nervous System Backbone (CORTEX_ZERO.md Phase 1-2)
 *
 * Responsibilities:
 * 1. Ingest every `neural.signal` emitted by business modules.
 * 2. Aggregate per-tenant reward scores (reciprocity ledger).
 * 3. Forward signals to Cortex (`POST /signals/ingest`) for vectorization
 *    and long-term RAG memory. Forwarding is fire-and-forget with a short
 *    timeout so a Cortex outage can never break business flows.
 */
@Injectable()
export class NeuralGridService {
    private readonly logger = new Logger(NeuralGridService.name);

    /** Per-tenant event receipt ledger (in-memory; forwarding may fail). */
    private readonly rewardLedger = new Map<string, TenantRewardState>();

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {

    }

    @OnEvent('neural.signal')
    async handleNeuralSignal(signal: NeuralSignal): Promise<void> {
        this.logger.log(
            `[NeuralGrid] Signal Received: ${signal.source}.${signal.type} | Tenant: ${signal.tenantId} | Score: ${signal.successScore || 0}`,
        );

        // 1. Update the reward ledger (reciprocity accounting)
        if (signal.successScore !== undefined) {
            this.registerReward(signal.tenantId, signal.successScore);
        }

        // 2. External intelligence note
        if (signal.source === 'crawler') {
            this.logger.log(
                `[NeuralGrid] Market Intelligence Received from ${signal.metadata?.url || 'unknown'}`,
            );
        }

        // 3. Forward to Cortex for vectorization + durable memory (best-effort)
        await this.forwardToCortex(signal);
    }

    /**
     * Fire-and-forget forward to the Cortex brain. Never throws.
     */
    private async forwardToCortex(signal: NeuralSignal): Promise<void> {
        try {
        const payload = {
            tenantId: signal.tenantId,
            source: signal.source,
            type: signal.type,
            data: {
                successScore: signal.successScore,
                context: signal.context,
                content: signal.content,
                ...(signal.data || {}),
                ...(signal.metadata || {}),
            },
            timestamp: (signal.timestamp || new Date()).toISOString(),
        };

            const result = await postToCortex<{ status: string; id: string }>(this.httpService, this.configService, '/signals/ingest', payload);
            if (result?.status !== 'ingested' || !result.id) throw new Error('Memory write was not acknowledged');
            this.logger.debug(`[NeuralGrid] Forwarded ${signal.source}.${signal.type} -> Cortex`);
        } catch (err) {
            // Cortex is optional infrastructure; log and continue.
            this.logger.warn(
                '[NeuralGrid] Cortex memory delivery failed; signal is not durably stored',
            );
        }
    }

    private registerReward(tenantId: string, score: number): void {
        const key = tenantId || 'default';
        const current = this.rewardLedger.get(key) || {
            totalReward: 0,
            signalCount: 0,
            lastSignalAt: new Date(),
        };
        current.totalReward = Math.round((current.totalReward + score) * 100) / 100;
        current.signalCount += 1;
        current.lastSignalAt = new Date();
        this.rewardLedger.set(key, current);

        this.logger.debug(
            `[NeuralGrid] Reward registered for ${key}: ${score} (total: ${current.totalReward})`,
        );
    }

    /** Snapshot of a tenant's accumulated reward (used by analytics/strategy). */
    getRewardSnapshot(tenantId: string): TenantRewardState {
        return (
            this.rewardLedger.get(tenantId || 'default') || {
                totalReward: 0,
                signalCount: 0,
                lastSignalAt: new Date(),
            }
        );
    }

    /** All tenants' reward state (admin analytics). */
    getAllRewards(): Array<TenantRewardState & { tenantId: string }> {
        return Array.from(this.rewardLedger.entries()).map(([tenantId, state]) => ({
            tenantId,
            ...state,
        }));
    }
}
