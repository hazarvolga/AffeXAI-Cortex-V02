import { Injectable, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber } from './entities/subscriber.entity';
import { EmailCampaign } from './entities/email-campaign.entity';

export interface MarketingRecipient {
  to: string;
  campaignId?: string;
  recipientId?: string;
}

/** Recheck consent at enqueue AND delivery; queued messages do not preserve revoked consent. */
@Injectable()
export class EmailDispatchPolicy {
  constructor(
    @InjectRepository(Subscriber) private readonly subscribers: Repository<Subscriber>,
    @InjectRepository(EmailCampaign) private readonly campaigns: Repository<EmailCampaign>,
  ) {}

  async authorize(tenantId: string, data: MarketingRecipient): Promise<string> {
    if (!tenantId?.trim()) throw new UnauthorizedException('Tenant context required');
    if (typeof data.to !== 'string' || !data.to.trim()) throw new ForbiddenException('Recipient required');
    const subscriber = await this.subscribers.findOne({ where: { email: data.to, tenantId } });
    if (!subscriber) throw new NotFoundException('Marketing recipient not found');
    if (subscriber.status !== 'active' || subscriber.isDoubleOptIn !== true || subscriber.marketingEmails !== true || subscriber.emailNotifications !== true) {
      throw new ForbiddenException('Marketing consent is not active');
    }
    if (data.campaignId) {
      const campaign = await this.campaigns.findOne({ where: { id: data.campaignId, tenantId } });
      if (!campaign) throw new NotFoundException('Campaign not found');
      // Older internally queued jobs use the subscriber email as recipientId.
      if (data.recipientId !== subscriber.id && data.recipientId !== subscriber.email) {
        throw new ForbiddenException('Campaign recipient mismatch');
      }
    }
    return subscriber.id;
  }
}
