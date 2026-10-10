import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CrmCustomer } from "./entities/crm-customer.entity";
import { BccSignal } from "../bcc/entities/bcc-signal.entity";
import { SignalType } from "../bcc/interfaces/signal.interface";
import { Organization } from "../organizations/entities/organization.entity";
import { TenantService } from "../../core/tenant/tenant.service";

@Injectable()
export class CrmIntelligenceService {
    private readonly logger = new Logger(CrmIntelligenceService.name);

    constructor(
        @InjectRepository(CrmCustomer)
        private readonly customerRepository: Repository<CrmCustomer>,
        @InjectRepository(BccSignal)
        private readonly signalRepository: Repository<BccSignal>,
        @InjectRepository(Organization)
        private readonly organizationRepository: Repository<Organization>,
        private readonly tenantService: TenantService,
    ) { }

    /**
     * Get current tenant ID from TenantService
     * @private
     */
    private getActiveTenantId(): string {
        return this.tenantService.getTenantId();
    }

    /**
     * Periodically aggregate signals and update neural scores for all active customers.
     * This ensures the "Neural Identity" portal remains data-fresh.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async aggregateAllCustomerScores() {
        this.logger.log("[NEURAL-AGGREGATION] Starting periodic score update...");

        const activeOrganizations = await this.organizationRepository.find({ where: { isActive: true } });

        for (const org of activeOrganizations) {
            await this.tenantService.runWithTenant({ tenantId: org.slug, source: 'system' }, async () => {
                const customers = await this.customerRepository.find({
                    where: { isActive: true, tenantId: org.slug },
                });

                for (const customer of customers) {
                    await this.updateCustomerScores(customer.id);
                }
            });
        }

        this.logger.log(`[NEURAL-AGGREGATION] Completed for ${activeOrganizations.length} tenants.`);
    }

    async updateCustomerScores(customerId: string) {
        const tenantId = this.getActiveTenantId();
        const customer = await this.customerRepository.findOne({
            where: { id: customerId, tenantId }
        });
        if (!customer || !customer.email) return;

        // Fetch signals related to this user
        const signals = await this.signalRepository.find({
            where: { userId: customerId, tenantId },
            order: { createdAt: "DESC" },
            take: 50,
        });

        if (signals.length === 0) return;

        // Calculate Sentiment (Average of SENTIMENT signals)
        const sentimentSignals = signals.filter(s => s.type === SignalType.SENTIMENT);
        const avgSentiment = sentimentSignals.length > 0
            ? sentimentSignals.reduce((acc, s) => acc + s.intensity, 0) / sentimentSignals.length
            : customer.sentimentScore;

        // Calculate Friction (Average of FRICTION signals)
        const frictionSignals = signals.filter(s => s.type === SignalType.FRICTION);
        const avgFriction = frictionSignals.length > 0
            ? frictionSignals.reduce((acc, s) => acc + s.intensity, 0) / frictionSignals.length
            : customer.frictionRank;

        // Calculate Overall Resonance
        // Resonance is high if sentiment is high and friction is low
        const avgInteraction = signals.filter(s => s.type === SignalType.INTERACTION).length / 50;
        const resonance = (avgSentiment * 0.5) + (avgInteraction * 0.3) + ((1 - avgFriction) * 0.2);

        await this.customerRepository.update({ id: customerId, tenantId }, {
            sentimentScore: avgSentiment,
            frictionRank: avgFriction,
            resonanceScore: Math.min(1, resonance),
            lastInteractionAt: signals[0].createdAt,
        });
    }
}
