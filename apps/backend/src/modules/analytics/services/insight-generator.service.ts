import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { TenantService } from '../../../core/tenant/tenant.service';
import { SocialMediaService } from '../../social-media/social-media.service';
import { CommerceService } from '../../commerce/services/commerce.service';
import { Organization } from '../../organizations/entities/organization.entity';

@Injectable()
export class InsightGeneratorService {
    private readonly logger = new Logger(InsightGeneratorService.name);

    constructor(
        private readonly notificationsGateway: NotificationsGateway,
        private readonly tenantService: TenantService,
        private readonly socialMediaService: SocialMediaService,
        private readonly commerceService: CommerceService,
        @InjectRepository(Organization)
        private readonly organizationRepository: Repository<Organization>,
    ) { }

    // Run every 10 minutes to avoid spamming, but keep it active
    @Cron(CronExpression.EVERY_10_MINUTES)
    async generateActiveInsights() {
        this.logger.log('🧠 Neural Grid: Scanning for active patterns...');

        const tenants = await this.organizationRepository.find({ where: { isActive: true } });

        for (const tenant of tenants) {
            await this.tenantService.runWithTenant({ tenantId: tenant.id }, async () => {
                await Promise.all([
                    this.checkSocialPulse(tenant.id),
                    this.checkQuotaHealth(tenant.id)
                ]);
            });
        }
    }

    private async checkSocialPulse(tenantId: string) {
        try {
            const stats = await this.socialMediaService.getGlobalEngagementStats(tenantId);

            // Insight 1: Viral Detection (High Engagement Rate)
            if (stats.engagementRate > 5) { // Threshold: 5%
                await this.notificationsGateway.sendNotificationToTenant(tenantId, {
                    type: 'neural-insight',
                    title: 'Viral Sinyali Algılandı',
                    message: `Son paylaşımların etkileşim oranı %${stats.engagementRate.toFixed(1)} seviyesine ulaştı.`,
                    impact: 'high',
                    timestamp: new Date()
                });
            }

            // Insight 2: Dormant Detection (No posts)
            if (stats.totalPosts === 0) {
                await this.notificationsGateway.sendNotificationToTenant(tenantId, {
                    type: 'neural-insight',
                    title: 'Sosyal Sinyal Kaybı',
                    message: 'Henüz hiç paylaşım yapılmadı. İlk sinyali göndererek algoritmayı besleyin.',
                    impact: 'medium',
                    timestamp: new Date()
                });
            }
        } catch (error) {
            this.logger.error(`Social Pulse Check Failed for ${tenantId}: ${error.message}`);
        }
    }

    private async checkQuotaHealth(tenantId: string) {
        try {
            const limit = await this.commerceService.checkLimit(tenantId);
            const usagePercent = limit.limit > 0 ? ((limit.limit - limit.remaining) / limit.limit) * 100 : 0;

            if (usagePercent > 80) {
                await this.notificationsGateway.sendNotificationToTenant(tenantId, {
                    type: 'neural-insight',
                    title: 'Kaynak Kritik Seviyede',
                    message: `AI işlem kotanızın %${usagePercent.toFixed(0)} kısmı kullanıldı.`,
                    impact: 'high',
                    timestamp: new Date()
                });
            }
        } catch (error) {
            this.logger.warn(`Quota Check Failed for ${tenantId}: ${error.message}`);
        }
    }
}
