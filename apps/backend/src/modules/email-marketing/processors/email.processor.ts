import { OptInOutService } from '../services/opt-in-out.service';
import { EmailDispatchPolicy } from '../email-dispatch-policy';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailCampaignService } from '../email-campaign.service';
import { MailService } from '../../mail/mail.service';
import { MailChannel, MailPriority } from '../../mail/interfaces/mail-service.interface';
import { TenantService } from '../../../core/tenant/tenant.service';
import { OrganizationsService } from '../../organizations/organizations.service';

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  campaignId?: string;
  recipientId?: string;
  tenantId?: string;
}

@Processor('email', {
  concurrency: 5, // Process 5 emails at a time
  limiter: {
    max: 100, // Max 100 emails
    duration: 60000, // Per 60 seconds (1 minute)
  },
})
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly campaignService: EmailCampaignService,
    private readonly mailService: MailService,
    private readonly tenantService: TenantService,
    private readonly dispatchPolicy: EmailDispatchPolicy,
    private readonly subscriptions: OptInOutService,
    private readonly organizations: OrganizationsService,
  ) {
    super();
  }

  async process(job: Job<EmailJobData, any, string>): Promise<any> {
    this.logger.log(`Processing email job ${job.id}`);

    const tenantId = job.data.tenantId;
    if (!tenantId?.trim()) throw new Error('Email job requires tenant context');
    await this.organizations.assertActiveTenant(tenantId);
    const subscriberId = await this.dispatchPolicy.authorize(tenantId, job.data);

    return this.tenantService.runWithTenant({ tenantId }, async () => {
      try {
        const origin = new URL(process.env.NEXT_PUBLIC_BASE_URL || '');
        if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password) throw new Error('Invalid public URL');
        const token = await this.subscriptions.ensureUnsubscribeToken(subscriberId, tenantId);
        const link = new URL('/unsubscribe', origin);
        link.searchParams.set('token', token);
        const unsubscribeUrl = link.toString();
        const footer = `<p><a href="${unsubscribeUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">Abonelikten ayrıl</a></p>`;
        const result = await this.mailService.sendMail({
          to: { email: job.data.to },
          subject: job.data.subject,
          html: `${job.data.body}${footer}`,
          unsubscribe: { url: unsubscribeUrl, oneClick: false },
          channel: MailChannel.MARKETING,
          priority: MailPriority.NORMAL,
          tags: job.data.campaignId ? ['campaign', job.data.campaignId] : ['marketing'],
        }, tenantId);

        if (result?.success !== true) {
          throw new Error(result?.error || 'Email sending failed');
        }

        // If this is a campaign email, update campaign stats
        if (job.data.campaignId) {
          await this.updateCampaignStats(job.data.campaignId);
        }

        this.logger.log(`Email job ${job.id} delivered for tenant ${tenantId}`);
        return {
          success: true,
          sentAt: new Date(),
          messageId: result.messageId,
        };
      } catch (error) {
        this.logger.error(`Email job ${job.id} failed`);

        // Retry logic: throw error to let BullMQ handle retries
        throw error;
      }
    });
  }

  private async updateCampaignStats(campaignId: string): Promise<void> {
    await this.campaignService.incrementSentCount(campaignId);
  }
}
