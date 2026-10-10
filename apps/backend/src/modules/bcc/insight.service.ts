import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";
import { BccSignal } from "./entities/bcc-signal.entity";
import { SignalType } from "./interfaces/signal.interface";

export interface BccInsight {
    title: string;
    narrative: string;
    intensity: number;
    type: "success" | "warning" | "info";
    timestamp: Date;
}

@Injectable()
export class InsightService {
    private readonly logger = new Logger(InsightService.name);

    constructor(
        @InjectRepository(BccSignal)
        private readonly signalRepository: Repository<BccSignal>,
    ) { }

    async getLatestInsights(tenantId: string): Promise<BccInsight[]> {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Fetch last hour of signals for this tenant
        const signals = await this.signalRepository.find({
            where: {
                tenantId,
                createdAt: MoreThanOrEqual(oneHourAgo),
            },
            order: { createdAt: "DESC" },
        });

        const insights: BccInsight[] = [];

        // Pattern 1: High Interaction Success
        const highInteraction = signals.filter(
            (s) => s.type === SignalType.INTERACTION && s.intensity > 0.8,
        );
        if (highInteraction.length > 5) {
            insights.push({
                title: "Resonance Peak",
                narrative: `${highInteraction.length} high-intensity interactions detected. User engagement is currently optimal.`,
                intensity: 0.9,
                type: "success",
                timestamp: new Date(),
            });
        }

        // Pattern 2: Intent Detection
        const intentSignals = signals.filter((s) => s.type === SignalType.INTENT);
        if (intentSignals.length > 0) {
            insights.push({
                title: "Conversion Pipeline Active",
                narrative: `Detected ${intentSignals.length} high-intent signals. Pipeline momentum is building.`,
                intensity: 0.7,
                type: "info",
                timestamp: intentSignals[0].createdAt,
            });
        }

        // Pattern 3: Friction Alert
        const frictionSignals = signals.filter(
            (s) => s.type === SignalType.FRICTION && s.intensity > 0.6
        );
        if (frictionSignals.length > 3) {
            insights.push({
                title: "Friction Detected",
                narrative: "Multiple high-intensity friction signals recorded. UX bottleneck detected in active modules.",
                intensity: 0.8,
                type: "warning",
                timestamp: new Date(),
            });
        }

        // Default Intelligence Narrative if no patterns found
        if (insights.length === 0) {
            insights.push({
                title: "Ambient Equilibrium",
                narrative: "Neural metrics are stable. No significant resonance deviations detected in the last hour.",
                intensity: 0.4,
                type: "info",
                timestamp: new Date(),
            });
        }

        return insights;
    }
}
