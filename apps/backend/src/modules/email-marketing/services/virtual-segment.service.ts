import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";
import { Subscriber } from "../entities/subscriber.entity";
import { CrmCustomer } from "../../crm/entities/crm-customer.entity";
import { SubscriberStatus } from "@affexai/shared-types";

export enum NeuralSegmentType {
    HIGH_RESONANCE = "HIGH_RESONANCE",
    AT_RISK = "AT_RISK",
    NEW_POTENTIALS = "NEW_POTENTIALS",
}

@Injectable()
export class VirtualSegmentService {
    private readonly logger = new Logger(VirtualSegmentService.name);

    constructor(
        @InjectRepository(CrmCustomer)
        private readonly crmRepository: Repository<CrmCustomer>,
        @InjectRepository(Subscriber)
        private readonly subscriberRepository: Repository<Subscriber>,
    ) { }

    /**
     * Returns a virtual list of "Subscribers" derived from CRM Neural Nodes.
     * This allows the Email module to target CRM users without manual imports.
     */
    async getVirtualSubscribers(tenantId: string, segment: NeuralSegmentType): Promise<Partial<Subscriber>[]> {
        let query = this.crmRepository.createQueryBuilder("customer")
            .where("customer.tenantId = :tenantId", { tenantId })
            .andWhere("customer.isActive = true");

        switch (segment) {
            case NeuralSegmentType.HIGH_RESONANCE:
                query = query.andWhere("customer.resonanceScore >= 0.7");
                break;
            case NeuralSegmentType.AT_RISK:
                query = query.andWhere("customer.sentimentScore < 0.4")
                    .andWhere("customer.frictionRank > 0.6");
                break;
            case NeuralSegmentType.NEW_POTENTIALS:
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                query = query.andWhere("customer.createdAt >= :weekAgo", { weekAgo });
                break;
        }

        const customers = await query.getMany();

        return customers.map(c => ({
            email: c.email,
            firstName: c.contactPerson?.split(' ')[0] || '',
            lastName: c.contactPerson?.split(' ').slice(1).join(' ') || '',
            company: c.companyName,
            status: SubscriberStatus.ACTIVE,
            customFields: {
                neuralResonance: c.resonanceScore,
                neuralSentiment: c.sentimentScore,
                isVirtual: true,
                crmId: c.id
            }
        }));
    }

    /**
     * Syncs a virtual segment into a physical Email Group if the user wants hard persistence.
     */
    async syncToGroup(tenantId: string, segment: NeuralSegmentType, groupId: string) {
        const virtuals = await this.getVirtualSubscribers(tenantId, segment);
        this.logger.log(`[VIRTUAL-SYNC] Syncing ${virtuals.length} nodes to group ${groupId}`);

        for (const v of virtuals) {
            const existing = await this.subscriberRepository.findOne({
                where: { email: v.email, tenantId }
            });

            if (existing) {
                // Update existing subscriber's groups
                const groups = existing.groups || [];
                if (!groups.includes(groupId)) {
                    existing.groups = [...groups, groupId];
                    await this.subscriberRepository.save(existing);
                }
            } else {
                // Create new subscriber from CRM data
                const subscriber = this.subscriberRepository.create({
                    ...v,
                    tenantId,
                    groups: [groupId]
                });
                await this.subscriberRepository.save(subscriber);
            }
        }
    }
}
