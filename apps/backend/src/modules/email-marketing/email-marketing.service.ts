import { EmailDispatchPolicy } from "./email-dispatch-policy";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { EmailJobData } from "./processors/email.processor";
import { TenantService } from "../../core/tenant/tenant.service";
import { UnauthorizedException } from "@nestjs/common";

@Injectable()
export class EmailMarketingService {
  private readonly logger = new Logger(EmailMarketingService.name);

  constructor(
    @InjectQueue("email") private emailQueue: Queue,
    private readonly tenantService: TenantService,
    private readonly dispatchPolicy: EmailDispatchPolicy,
  ) {}

  private getTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException("Tenant context required");
    return tenantId;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const tenantId = this.getTenantId();
    await this.dispatchPolicy.authorize(tenantId, { to });
    const job = await this.emailQueue.add("sendEmail", {
      to,
      subject,
      body,
      tenantId,
    });

    this.logger.log(`Email job added to queue with ID: ${job.id}`);
  }

  async sendCampaignEmail(
    to: string,
    subject: string,
    body: string,
    campaignId: string,
    recipientId: string,
  ): Promise<void> {
    const tenantId = this.getTenantId();
    await this.dispatchPolicy.authorize(tenantId, {
      to,
      campaignId,
      recipientId,
    });
    const job = await this.emailQueue.add("sendCampaignEmail", {
      to,
      subject,
      body,
      campaignId,
      recipientId,
      tenantId,
    });

    this.logger.log(`Campaign email job added to queue with ID: ${job.id}`);
  }

  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    // Counts only; loading the job lists would pull every retained job into memory.
    const counts = await this.emailQueue.getJobCounts(
      "waiting",
      "active",
      "completed",
      "failed",
    );
    return {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
    };
  }
}
