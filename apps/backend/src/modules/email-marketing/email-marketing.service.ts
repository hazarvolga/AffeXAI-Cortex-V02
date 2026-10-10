import { EmailDispatchPolicy } from './email-dispatch-policy';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { EmailJobData } from './processors/email.processor';
import { TenantService } from '../../core/tenant/tenant.service';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class EmailMarketingService {
  private readonly logger = new Logger(EmailMarketingService.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    private readonly tenantService: TenantService,
    private readonly dispatchPolicy: EmailDispatchPolicy,
  ) { }

  private getTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException('Tenant context required');
    return tenantId;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const tenantId = this.getTenantId();
    await this.dispatchPolicy.authorize(tenantId, { to });
    const job = await this.emailQueue.add('sendEmail', {
      to,
      subject,
      body,
      tenantId,
    });

    this.logger.log(`Email job added to queue with ID: ${job.id}`);
  }

  async sendCampaignEmail(to: string, subject: string, body: string, campaignId: string, recipientId: string): Promise<void> {
    const tenantId = this.getTenantId();
    await this.dispatchPolicy.authorize(tenantId, { to, campaignId, recipientId });
    const job = await this.emailQueue.add('sendCampaignEmail', {
      to,
      subject,
      body,
      campaignId,
      recipientId,
      tenantId,
    });

    this.logger.log(`Campaign email job added to queue with ID: ${job.id}`);
  }

  async getQueueStatus(): Promise<any> {
    const waiting = await this.emailQueue.getWaiting();
    const active = await this.emailQueue.getActive();
    const completed = await this.emailQueue.getCompleted();
    const failed = await this.emailQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }
}
