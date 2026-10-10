import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailCampaign } from './entities/email-campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { CacheService } from '../../core/shared/services/cache.service';
import { EventBusService } from '../platform-integration/services/event-bus.service';
import { SubscriberService } from './subscriber.service';
import { TenantService } from '../../core/tenant/tenant.service';
import { StrategyService } from '../strategy/services/strategy.service';
import { CommerceService } from '../commerce/services/commerce.service';
import { createHash } from 'crypto';



@Injectable()
export class EmailCampaignService {
  private readonly logger = new Logger(EmailCampaignService.name);

  constructor(
    @InjectRepository(EmailCampaign)
    private campaignRepository: Repository<EmailCampaign>,
    @InjectQueue('email') private emailQueue: Queue,
    private cacheService: CacheService,
    private eventBusService: EventBusService,
    private subscriberService: SubscriberService,
    private readonly tenantService: TenantService,
    private readonly strategyService: StrategyService,
    private readonly commerceService: CommerceService,
  ) { }

  private getTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException('Tenant context required');
    return tenantId;
  }

  async create(createCampaignDto: CreateCampaignDto): Promise<EmailCampaign> {
    const tenantId = this.getTenantId();
    const slug = createCampaignDto.slug || this.generateSlug(createCampaignDto.name);
    const campaign = this.campaignRepository.create({ ...createCampaignDto, slug, tenantId });
    const savedCampaign = await this.campaignRepository.save(campaign);

    // Clear cache for findAll of this tenant
    await this.cacheService.del(`email-campaigns:${tenantId}:all`);

    return savedCampaign;
  }

  async findAll(): Promise<EmailCampaign[]> {
    const tenantId = this.getTenantId();
    const cached = await this.cacheService.get<EmailCampaign[]>(`email-campaigns:${tenantId}:all`);
    if (cached) {
      return cached;
    }

    const campaigns = await this.campaignRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    await this.cacheService.set(`email-campaigns:${tenantId}:all`, campaigns, 30); // 30 seconds TTL
    return campaigns;
  }

  async findOne(id: string): Promise<EmailCampaign> {
    const tenantId = this.getTenantId();
    const cached = await this.cacheService.get<EmailCampaign>(`email-campaigns:${tenantId}:${id}`);
    if (cached) {
      return cached;
    }

    const campaign = await this.campaignRepository.findOne({ where: { id, tenantId } });
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    await this.cacheService.set(`email-campaigns:${tenantId}:${id}`, campaign, 60); // 60 seconds TTL
    return campaign;
  }

  async findBySlug(slug: string): Promise<EmailCampaign> {
    const tenantId = this.getTenantId();
    const cached = await this.cacheService.get<EmailCampaign>(`email-campaigns:${tenantId}:slug:${slug}`);
    if (cached) {
      return cached;
    }

    const campaign = await this.campaignRepository.findOne({ where: { slug, tenantId } });
    if (!campaign) {
      throw new Error('Campaign not found by slug');
    }
    await this.cacheService.set(`email-campaigns:${tenantId}:slug:${slug}`, campaign, 60);
    return campaign;
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<EmailCampaign> {
    const tenantId = this.getTenantId();
    const data = { ...updateCampaignDto };
    if (updateCampaignDto.name && !updateCampaignDto.slug) {
      data.slug = this.generateSlug(updateCampaignDto.name);
    }

    await this.campaignRepository.update({ id, tenantId }, data);
    const campaign = await this.campaignRepository.findOne({ where: { id, tenantId } });
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Clear cache for this campaign and all campaigns
    await this.cacheService.del(`email-campaigns:${tenantId}:${id}`);
    if (campaign.slug) await this.cacheService.del(`email-campaigns:${tenantId}:slug:${campaign.slug}`);
    await this.cacheService.del(`email-campaigns:${tenantId}:all`);

    return campaign;
  }

  async remove(id: string): Promise<void> {
    const tenantId = this.getTenantId();
    await this.campaignRepository.delete({ id, tenantId });

    // Clear cache for this campaign and all campaigns
    await this.cacheService.del(`email-campaigns:${tenantId}:${id}`);
    await this.cacheService.del(`email-campaigns:${tenantId}:all`);
  }

  async sendCampaign(id: string): Promise<void> {
    const tenantId = this.getTenantId();
    const campaign = await this.findOne(id); // Automated tenant check inside findOne
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // 0. Governance Check (Unified Quota)
    // Sending emails consumes project resources. We must ensure the tenant has enough "credit".
    // For now, we use the same generic 'checkLimit' (Token based), considering 1 Email recipient ~= 10 Tokens (cost approximation)
    // or simply check if they are allowed to operate at all.
    const limitCheck = await this.commerceService.checkLimit(tenantId);
    if (!limitCheck.allowed) {
      this.logger.warn(`Email Campaign Blocked: Rate limit exceeded for tenant ${tenantId}`);
      // Mark campaign as 'failed' or 'draft' to prevent stuck state? 
      // Actually, better to throw error so the UI shows it immediately.
      throw new UnauthorizedException('Plan Limit Exceeded. Please upgrade to send this campaign.');
    }

    // Update campaign status
    campaign.status = 'sending';
    campaign.sentAt = new Date();
    await this.campaignRepository.save(campaign);

    // Clear cache for this campaign
    await this.cacheService.del(`email-campaigns:${id}`);

    // Fetch real subscribers from the database
    // Note: In a production system, this should be filtered by segment/list
    // and paginated for large subscriber counts
    const allSubscribers = await this.subscriberService.findAll(); // Automated tenant check

    // Filter out suppressed emails (bounced, complained, unsubscribed)
    const activeRecipients: string[] = [];
    for (const subscriber of allSubscribers) {
      if (subscriber.status === 'active') {
        const isSuppressed = await this.subscriberService.isEmailSuppressed(subscriber.email); // Automated tenant check
        if (!isSuppressed) {
          activeRecipients.push(subscriber.email);
        }
      }
    }

    if (activeRecipients.length === 0) {
      this.logger.warn(`Campaign ${id} has no active recipients to send to`);
      campaign.status = 'completed';
      await this.campaignRepository.save(campaign);
      return;
    }

    campaign.totalRecipients = activeRecipients.length;
    await this.campaignRepository.save(campaign);

    for (const recipient of activeRecipients) {
      const recipientHash = createHash('sha256').update(recipient).digest('hex');
      await this.emailQueue.add(
        'sendCampaignEmail',
        {
          to: recipient,
          subject: campaign.subject,
          body: campaign.content,
          campaignId: campaign.id,
          recipientId: recipient,
          tenantId,
        },
        { jobId: `campaign-${campaign.id}-${recipientHash}` },
      );
    }

    // Publish platform event
    await this.eventBusService.publishCampaignSent(
      campaign.id,
      activeRecipients.length,
      tenantId,
      'system',
    );

    // [NEURAL GRID] Emit Signal to RAG (Feed the Brain)
    // We do this asynchronously to not block the main flow
    this.strategyService.emitSignal(tenantId, 'EMAIL_CAMPAIGN_SENT', {
      campaignId: campaign.id,
      subject: campaign.subject,
      content: campaign.content,
      recipientCount: activeRecipients.length
    }).catch(err => this.logger.warn(`Failed to emit RAG signal: ${err.message}`));

    this.logger.log(`Campaign ${id} queued for sending to ${activeRecipients.length} recipients`);
  }

  async incrementSentCount(campaignId: string): Promise<void> {
    const tenantId = this.getTenantId();
    await this.campaignRepository.increment({ id: campaignId, tenantId }, 'sentCount', 1);
    // Clear cache for this campaign
    await this.cacheService.del(`email-campaigns:${tenantId}:${campaignId}`);
  }

  async incrementOpenedCount(campaignId: string): Promise<void> {
    const tenantId = this.getTenantId();
    await this.campaignRepository.increment({ id: campaignId, tenantId }, 'openedCount', 1);
    // Clear cache for this campaign
    await this.cacheService.del(`email-campaigns:${tenantId}:${campaignId}`);
  }

  async incrementClickedCount(campaignId: string): Promise<void> {
    const tenantId = this.getTenantId();
    await this.campaignRepository.increment({ id: campaignId, tenantId }, 'clickedCount', 1);
    // Clear cache for this campaign
    await this.cacheService.del(`email-campaigns:${tenantId}:${campaignId}`);
  }

  async incrementDeliveredCount(campaignId: string): Promise<void> {
    const tenantId = this.getTenantId();
    await this.campaignRepository.increment({ id: campaignId, tenantId }, 'deliveredCount', 1);
    await this.cacheService.del(`email-campaigns:${tenantId}:${campaignId}`);
  }

  async incrementBouncedCount(campaignId: string): Promise<void> {
    const tenantId = this.getTenantId();
    await this.campaignRepository.increment({ id: campaignId, tenantId }, 'bounceCount', 1);
    await this.cacheService.del(`email-campaigns:${tenantId}:${campaignId}`);
  }

  async incrementComplainedCount(campaignId: string): Promise<void> {
    const tenantId = this.getTenantId();
    await this.campaignRepository.increment({ id: campaignId, tenantId }, 'complainedCount', 1);
    await this.cacheService.del(`email-campaigns:${tenantId}:${campaignId}`);
  }

  async getCampaignStats(id: string): Promise<any> {
    const campaign = await this.findOne(id); // Automated tenant check
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      deliveredCount: campaign.deliveredCount,
      openedCount: campaign.openedCount,
      clickedCount: campaign.clickedCount,
      bounceCount: campaign.bounceCount,
      complainedCount: campaign.complainedCount,
      completionRate: campaign.totalRecipients > 0
        ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100)
        : 0,
      deliveryRate: campaign.sentCount > 0
        ? Math.round((campaign.deliveredCount / campaign.sentCount) * 100)
        : 0,
      openRate: campaign.deliveredCount > 0
        ? Math.round((campaign.openedCount / campaign.deliveredCount) * 100)
        : 0,
      clickRate: campaign.openedCount > 0
        ? Math.round((campaign.clickedCount / campaign.openedCount) * 100)
        : 0,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 7);
  }
}
