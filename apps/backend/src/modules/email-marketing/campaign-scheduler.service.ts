import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailCampaign } from './entities/email-campaign.entity';
import { EmailCampaignService } from './email-campaign.service';
import { TenantService } from '../../core/tenant/tenant.service';

/**
 * Campaign Scheduler Service
 * Handles scheduled campaign execution using cron jobs
 */
@Injectable()
export class CampaignSchedulerService {
  private readonly logger = new Logger(CampaignSchedulerService.name);

  constructor(
    @InjectRepository(EmailCampaign)
    private campaignRepository: Repository<EmailCampaign>,
    private emailCampaignService: EmailCampaignService,
    private readonly tenantService: TenantService,
  ) { }

  private getTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException('Tenant context required');
    return tenantId;
  }

  /**
   * Schedule a campaign for future sending
   */
  async scheduleCampaign(campaignId: string, scheduledAt: Date): Promise<EmailCampaign> {
    const tenantId = this.getTenantId();
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status !== 'draft') {
      throw new Error(`Cannot schedule campaign with status: ${campaign.status}`);
    }

    if (scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    // Update campaign with scheduled time and status
    campaign.scheduledAt = scheduledAt;
    campaign.status = 'scheduled';

    const updatedCampaign = await this.campaignRepository.save(campaign);

    this.logger.log(
      `Campaign ${campaignId} scheduled for ${scheduledAt.toISOString()}`
    );

    return updatedCampaign;
  }

  /**
   * Cancel a scheduled campaign
   */
  async cancelScheduledCampaign(campaignId: string): Promise<EmailCampaign> {
    const tenantId = this.getTenantId();
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status !== 'scheduled') {
      throw new Error(`Cannot cancel campaign with status: ${campaign.status}`);
    }

    // Reset campaign to draft status
    campaign.scheduledAt = undefined as any;
    campaign.status = 'draft';

    const updatedCampaign = await this.campaignRepository.save(campaign);

    this.logger.log(`Campaign ${campaignId} schedule cancelled`);

    return updatedCampaign;
  }

  /**
   * Reschedule a campaign
   */
  async rescheduleCampaign(campaignId: string, newScheduledAt: Date): Promise<EmailCampaign> {
    const tenantId = this.getTenantId();
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status !== 'scheduled') {
      throw new Error(`Cannot reschedule campaign with status: ${campaign.status}`);
    }

    if (newScheduledAt <= new Date()) {
      throw new Error('New scheduled time must be in the future');
    }

    campaign.scheduledAt = newScheduledAt;
    const updatedCampaign = await this.campaignRepository.save(campaign);

    this.logger.log(
      `Campaign ${campaignId} rescheduled to ${newScheduledAt.toISOString()}`
    );

    return updatedCampaign;
  }

  /**
   * Get all scheduled campaigns
   */
  async getScheduledCampaigns(): Promise<EmailCampaign[]> {
    const tenantId = this.getTenantId();
    return this.campaignRepository.find({
      where: {
        status: 'scheduled',
        tenantId,
      },
      order: {
        scheduledAt: 'ASC',
      },
    });
  }

  /**
   * Get campaigns ready to be sent (scheduled time has passed)
   */
  async getCampaignsReadyToSend(): Promise<EmailCampaign[]> {
    const now = new Date();

    return this.campaignRepository.find({
      where: {
        status: 'scheduled',
        scheduledAt: LessThanOrEqual(now),
      },
      order: {
        scheduledAt: 'ASC',
      },
    });
  }

  /**
   * Cron job to check and send scheduled campaigns
   * Runs every minute to check for campaigns ready to send
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledCampaigns(): Promise<void> {
    this.logger.debug('Checking for scheduled campaigns ready to send...');

    try {
      const campaignsToSend = await this.getCampaignsReadyToSend();

      if (campaignsToSend.length === 0) {
        this.logger.debug('No scheduled campaigns ready to send');
        return;
      }

      this.logger.log(`Found ${campaignsToSend.length} campaigns ready to send`);

      for (const campaign of campaignsToSend) {
        try {
          this.logger.log(`Sending scheduled campaign: ${campaign.id} (${campaign.name})`);

          // Send the campaign using the existing service
          // Multi-Tenancy: Use runWithTenant to provide context for the service call
          if (campaign.tenantId) {
            await this.tenantService.runWithTenant({ tenantId: campaign.tenantId }, async () => {
              await this.emailCampaignService.sendCampaign(campaign.id);
            });
          } else {
            this.logger.warn(`Campaign ${campaign.id} has no tenantId, skipping sending`);
          }

          this.logger.log(`Successfully sent scheduled campaign: ${campaign.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to send scheduled campaign ${campaign.id}: ${error.message}`,
            error.stack
          );

          // Mark campaign as failed
          campaign.status = 'failed';
          campaign.metadata = {
            ...campaign.metadata,
            error: error.message,
            failedAt: new Date().toISOString(),
          };
          await this.campaignRepository.save(campaign);
        }
      }
    } catch (error) {
      this.logger.error('Error processing scheduled campaigns:', error.stack);
    }
  }

  /**
   * Get campaign scheduling statistics
   */
  async getSchedulingStats(): Promise<{
    totalScheduled: number;
    readyToSend: number;
    upcomingToday: number;
    upcomingThisWeek: number;
  }> {
    const tenantId = this.getTenantId();
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [totalScheduled, readyToSend, upcomingToday, upcomingThisWeek] = await Promise.all([
      this.campaignRepository.count({
        where: { status: 'scheduled', tenantId },
      }),
      this.campaignRepository.count({
        where: {
          status: 'scheduled',
          scheduledAt: LessThanOrEqual(now),
          tenantId,
        },
      }),
      this.campaignRepository.count({
        where: {
          status: 'scheduled',
          scheduledAt: LessThanOrEqual(todayEnd),
          tenantId,
        },
      }),
      this.campaignRepository.count({
        where: {
          status: 'scheduled',
          scheduledAt: LessThanOrEqual(weekEnd),
          tenantId,
        },
      }),
    ]);

    return {
      totalScheduled,
      readyToSend,
      upcomingToday,
      upcomingThisWeek,
    };
  }

  /**
   * Validate scheduling time
   */
  validateScheduleTime(scheduledAt: Date): { valid: boolean; error?: string } {
    const now = new Date();
    const minScheduleTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
    const maxScheduleTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    if (scheduledAt <= minScheduleTime) {
      return {
        valid: false,
        error: 'Campaign must be scheduled at least 5 minutes in the future',
      };
    }

    if (scheduledAt > maxScheduleTime) {
      return {
        valid: false,
        error: 'Campaign cannot be scheduled more than 1 year in advance',
      };
    }

    return { valid: true };
  }
}