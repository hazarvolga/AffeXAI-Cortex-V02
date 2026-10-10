import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLog } from './entities/email-log.entity';
import { EmailCampaign } from './entities/email-campaign.entity';
import { Subscriber } from './entities/subscriber.entity';
import { EmailOpenHistory } from './entities/email-open-history.entity';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { TenantService } from '../../core/tenant/tenant.service';
import { UnauthorizedException } from '@nestjs/common';

interface TrackingMetadata {
  userAgent?: string;
  ipAddress?: string;
  originalUrl?: string;
  timestamp: Date;
}

interface TrackingData {
  trackingId: string;
  pixelUrl: string;
  linkWrapper: (url: string) => string;
}

export interface TrackingStats {
  campaignId: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  uniqueOpens: number;
  uniqueClicks: number;
  recentOpens: Array<{
    recipientEmail: string;
    openedAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }>;
  recentClicks: Array<{
    recipientEmail: string;
    clickedAt: Date;
    originalUrl?: string;
    userAgent?: string;
    ipAddress?: string;
  }>;
}

/**
 * Email Tracking Service
 * Handles email open and click tracking functionality
 */
@Injectable()
export class TrackingService {
  private readonly baseUrl: string;

  constructor(
    @InjectRepository(EmailLog)
    private emailLogRepository: Repository<EmailLog>,
    @InjectRepository(EmailCampaign)
    private campaignRepository: Repository<EmailCampaign>,
    @InjectRepository(Subscriber)
    private subscriberRepository: Repository<Subscriber>,
    @InjectRepository(EmailOpenHistory)
    private emailOpenHistoryRepository: Repository<EmailOpenHistory>,
    private readonly tenantService: TenantService,
    private configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:9005');
  }

  private getTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException('Tenant context required');
    return tenantId;
  }

  /**
   * Generate tracking data for an email
   */
  async generateTrackingData(
    campaignId: string,
    recipientEmail: string,
  ): Promise<TrackingData> {
    const tenantId = this.getTenantId();
    // Find or create email log entry
    let emailLog = await this.emailLogRepository.findOne({
      where: {
        campaignId,
        recipientEmail,
        tenantId,
      },
    });

    if (!emailLog) {
      emailLog = this.emailLogRepository.create({
        id: uuidv4(),
        campaignId,
        recipientEmail,
        status: 'pending',
        tenantId,
        metadata: {},
      });
      await this.emailLogRepository.save(emailLog);
    }

    const trackingId = emailLog.id;
    const pixelUrl = `${this.baseUrl}/api/email-marketing/track/open/${trackingId}`;

    const linkWrapper = (originalUrl: string): string => {
      const encodedUrl = encodeURIComponent(originalUrl);
      return `${this.baseUrl}/api/email-marketing/track/click/${trackingId}?url=${encodedUrl}`;
    };

    return {
      trackingId,
      pixelUrl,
      linkWrapper,
    };
  }

  /**
   * Track email open event
   */
  async trackEmailOpen(trackingId: string, metadata: TrackingMetadata): Promise<void> {
    const emailLog = await this.emailLogRepository.findOne({
      where: { id: trackingId },
      relations: ['campaign'],
    });

    if (!emailLog) {
      throw new Error(`Email log not found for tracking ID: ${trackingId}`);
    }

    // Only track first open (unique opens)
    if (!emailLog.openedAt) {
      emailLog.openedAt = metadata.timestamp;
      emailLog.metadata = {
        ...emailLog.metadata,
        openTracking: {
          userAgent: metadata.userAgent,
          ipAddress: metadata.ipAddress,
          firstOpenedAt: metadata.timestamp,
        },
      };

      await this.emailLogRepository.save(emailLog);

      // Update campaign statistics
      await this.updateCampaignStats(emailLog.campaignId, 'opened', emailLog.tenantId);

      // Update subscriber statistics
      await this.updateSubscriberStats(emailLog.recipientEmail, 'opens', emailLog.tenantId);

      // Find subscriber by email to get ID
      const subscriber = await this.subscriberRepository.findOne({
        where: { email: emailLog.recipientEmail, tenantId: emailLog.tenantId },
      });

      // Record open history for Send Time Optimization
      if (subscriber) {
        const openTime = new Date(metadata.timestamp);
        const openHistory = this.emailOpenHistoryRepository.create({
          subscriberId: subscriber.id,
          campaignId: emailLog.campaignId,
          openedAt: openTime,
          hourOfDay: openTime.getHours(),
          dayOfWeek: openTime.getDay(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          deviceType: this.detectDeviceType(metadata.userAgent),
          emailClient: this.detectEmailClient(metadata.userAgent),
          ipAddress: metadata.ipAddress,
        });

        await this.emailOpenHistoryRepository.save(openHistory);

        // 🧠 NEURAL GRID SIGNAL: Email Opened
        this.eventEmitter.emit('neural.signal', {
          tenantId: emailLog.tenantId,
          source: 'email',
          type: 'email.opened',
          successScore: 1,
          context: `Email campaign ${emailLog.campaignId} was opened by ${emailLog.recipientEmail}`,
          data: { campaignId: emailLog.campaignId, recipient: emailLog.recipientEmail }
        });
      }
    }
  }

  /**
   * Track email click event
   */
  async trackEmailClick(trackingId: string, metadata: TrackingMetadata): Promise<void> {
    const emailLog = await this.emailLogRepository.findOne({
      where: { id: trackingId },
      relations: ['campaign'],
    });

    if (!emailLog) {
      throw new Error(`Email log not found for tracking ID: ${trackingId}`);
    }

    // Track click (can have multiple clicks)
    if (!emailLog.clickedAt) {
      emailLog.clickedAt = metadata.timestamp;
    }

    // Add click to metadata
    const clicks = emailLog.metadata?.clicks || [];
    clicks.push({
      clickedAt: metadata.timestamp,
      originalUrl: metadata.originalUrl,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    });

    emailLog.metadata = {
      ...emailLog.metadata,
      clicks,
      lastClickedAt: metadata.timestamp,
    };

    await this.emailLogRepository.save(emailLog);

    // Update campaign statistics (only count first click for unique clicks)
    if (emailLog.clickedAt === metadata.timestamp) {
      await this.updateCampaignStats(emailLog.campaignId, 'clicked', emailLog.tenantId);
    }

    // Update subscriber statistics
    await this.updateSubscriberStats(emailLog.recipientEmail, 'clicks', emailLog.tenantId);

    // 🧠 NEURAL GRID SIGNAL: Email Clicked
    this.eventEmitter.emit('neural.signal', {
      tenantId: emailLog.tenantId,
      source: 'email',
      type: 'email.clicked',
      successScore: 5,
      context: `Link clicked in email campaign ${emailLog.campaignId} by ${emailLog.recipientEmail}. URL: ${metadata.originalUrl}`,
      data: { campaignId: emailLog.campaignId, recipient: emailLog.recipientEmail, url: metadata.originalUrl }
    });
  }

  /**
   * Get tracking statistics for a campaign
   */
  async getTrackingStats(campaignId: string): Promise<TrackingStats> {
    const tenantId = this.getTenantId();
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    // Get all email logs for this campaign
    const emailLogs = await this.emailLogRepository.find({
      where: { campaignId, tenantId },
      order: { createdAt: 'DESC' },
    });

    const totalSent = emailLogs.length;
    const totalOpened = emailLogs.filter(log => log.openedAt).length;
    const totalClicked = emailLogs.filter(log => log.clickedAt).length;

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

    // Recent opens (last 10)
    const recentOpens = emailLogs
      .filter(log => log.openedAt)
      .slice(0, 10)
      .map(log => ({
        recipientEmail: log.recipientEmail,
        openedAt: log.openedAt!,
        userAgent: log.metadata?.openTracking?.userAgent,
        ipAddress: log.metadata?.openTracking?.ipAddress,
      }));

    // Recent clicks (last 10)
    const recentClicks = emailLogs
      .filter(log => log.clickedAt)
      .slice(0, 10)
      .map(log => ({
        recipientEmail: log.recipientEmail,
        clickedAt: log.clickedAt!,
        originalUrl: log.metadata?.clicks?.[0]?.originalUrl,
        userAgent: log.metadata?.clicks?.[0]?.userAgent,
        ipAddress: log.metadata?.clicks?.[0]?.ipAddress,
      }));

    return {
      campaignId,
      totalSent,
      totalOpened,
      totalClicked,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      uniqueOpens: totalOpened,
      uniqueClicks: totalClicked,
      recentOpens,
      recentClicks,
    };
  }

  /**
   * Update campaign statistics
   */
  private async updateCampaignStats(
    campaignId: string,
    metric: 'opened' | 'clicked',
    tenantId: string,
  ): Promise<void> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, tenantId },
    });

    if (campaign) {
      if (metric === 'opened') {
        campaign.openedCount = (campaign.openedCount || 0) + 1;
      } else if (metric === 'clicked') {
        campaign.clickedCount = (campaign.clickedCount || 0) + 1;
      }

      await this.campaignRepository.save(campaign);
    }
  }

  /**
   * Update subscriber statistics
   */
  private async updateSubscriberStats(
    email: string,
    metric: 'opens' | 'clicks',
    tenantId: string,
  ): Promise<void> {
    const subscriber = await this.subscriberRepository.findOne({
      where: { email, tenantId },
    });

    if (subscriber) {
      if (metric === 'opens') {
        subscriber.opens = (subscriber.opens || 0) + 1;
      } else if (metric === 'clicks') {
        subscriber.clicks = (subscriber.clicks || 0) + 1;
      }

      await this.subscriberRepository.save(subscriber);
    }
  }

  /**
   * Process email content to add tracking
   */
  async processEmailContent(
    htmlContent: string,
    campaignId: string,
    recipientEmail: string,
  ): Promise<string> {
    const trackingData = await this.generateTrackingData(campaignId, recipientEmail);

    // Add tracking pixel before closing body tag
    const trackingPixel = `<img src="${trackingData.pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
    let processedContent = htmlContent.replace('</body>', `${trackingPixel}</body>`);

    // If no body tag, add pixel at the end
    if (!processedContent.includes('</body>')) {
      processedContent += trackingPixel;
    }

    // Wrap all links with tracking
    processedContent = processedContent.replace(
      /href="([^"]+)"/g,
      (match, url) => {
        // Skip tracking URLs and mailto links
        if (url.includes('/track/') || url.startsWith('mailto:') || url.startsWith('#')) {
          return match;
        }
        return `href="${trackingData.linkWrapper(url)}"`;
      }
    );

    return processedContent;
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent?: string): string {
    if (!userAgent) return 'unknown';

    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * Detect email client from user agent
   */
  private detectEmailClient(userAgent?: string): string {
    if (!userAgent) return 'unknown';

    const ua = userAgent.toLowerCase();

    // Common email clients
    if (ua.includes('outlook')) return 'Outlook';
    if (ua.includes('thunderbird')) return 'Thunderbird';
    if (ua.includes('apple mail')) return 'Apple Mail';

    // Webmail clients
    if (ua.includes('gmail')) return 'Gmail';
    if (ua.includes('yahoo')) return 'Yahoo Mail';
    if (ua.includes('hotmail') || ua.includes('live.com')) return 'Outlook.com';

    // Mobile clients
    if (ua.includes('android') && ua.includes('mail')) return 'Android Mail';
    if (ua.includes('iphone') && ua.includes('mail')) return 'iOS Mail';

    return 'Other';
  }
}