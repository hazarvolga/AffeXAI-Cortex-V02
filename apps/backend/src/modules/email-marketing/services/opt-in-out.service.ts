import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { isEmail } from 'class-validator';
import { Subscriber } from '../entities/subscriber.entity';
import { MailService } from '../../mail/mail.service';
import { MailChannel, MailPriority } from '../../mail/interfaces/mail-service.interface';
import { TenantService } from '../../../core/tenant/tenant.service';
import { SubscriberStatus } from '@affexai/shared-types';

type Preferences = { marketingEmails?: boolean; emailNotifications?: boolean };
type Details = { firstName?: string; lastName?: string; company?: string; marketingEmails?: boolean };
const accepted = { message: 'Talebiniz alındı. Uygun bir abonelik için onay bağlantısı e-posta ile iletilmeye çalışılacaktır.', requiresConfirmation: true };
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

@Injectable()
export class OptInOutService {
  private readonly logger = new Logger(OptInOutService.name);
  constructor(@InjectRepository(Subscriber) private readonly subscriberRepository: Repository<Subscriber>,
    private readonly mailService: MailService, private readonly tenantService: TenantService,
    private readonly eventEmitter: EventEmitter2) {}

  private getTenantId(): string {
    const tenant = this.tenantService.getTenantId();
    if (!tenant || !/^[A-Za-z0-9_-]{1,128}$/.test(tenant)) throw new BadRequestException('Tenant is required');
    return tenant;
  }
  private email(value: string): string {
    if (typeof value !== 'string' || value.length > 254 || !isEmail(value.trim())) throw new BadRequestException('Invalid email');
    return value.trim().toLowerCase();
  }
  private token(purpose: 'confirm' | 'unsubscribe', tenant: string, lifetime: number): string {
    return ['v1', purpose, Buffer.from(tenant).toString('base64url'), String(Date.now() + lifetime), randomBytes(32).toString('hex')].join('.');
  }
  private parseToken(token: string, purpose: 'confirm' | 'unsubscribe'): string {
    if (typeof token !== 'string' || token.length > 512) throw new BadRequestException('Invalid or expired link');
    const parts = token.split('.');
    if (parts.length !== 5 || parts[0] !== 'v1' || parts[1] !== purpose || !/^[A-Za-z0-9_-]+$/.test(parts[2]) ||
      !/^\d{13}$/.test(parts[3]) || Number(parts[3]) <= Date.now() || !/^[a-f0-9]{64}$/.test(parts[4])) throw new BadRequestException('Invalid or expired link');
    const tenant = Buffer.from(parts[2], 'base64url').toString();
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(tenant) || Buffer.from(tenant).toString('base64url') !== parts[2]) throw new BadRequestException('Invalid or expired link');
    const hint = this.tenantService.getTenantId();
    if (hint && hint !== tenant) throw new BadRequestException('Invalid or expired link');
    return tenant;
  }
  async subscribeWithDoubleOptIn(email: string, data: Details = {}, ipAddress?: string) {
    const tenantId = this.getTenantId();
    email = this.email(email);
    for (const field of ['firstName', 'lastName', 'company'] as const) {
      if (data[field] !== undefined && (typeof data[field] !== 'string' || data[field]!.length > 128)) throw new BadRequestException('Invalid subscriber details');
    }
    if (data.marketingEmails !== undefined && typeof data.marketingEmails !== 'boolean') throw new BadRequestException('Invalid preferences');
    const previous = await this.subscriberRepository.findOne({ where: { email, tenantId } });
    if (previous && [SubscriberStatus.BOUNCED, SubscriberStatus.COMPLAINED].includes(previous.status as SubscriberStatus)) return { ...accepted };
    if (previous?.status === SubscriberStatus.ACTIVE && previous.isDoubleOptIn === true) return { ...accepted };
    const optInToken = this.token('confirm', tenantId, 24 * 60 * 60 * 1000);
    const subscriber = previous ? this.subscriberRepository.create({ ...previous, optInToken, customFields: { ...previous.customFields, pendingMarketingConsent: data.marketingEmails !== false } }) : this.subscriberRepository.create({
      email, tenantId, ...data, status: SubscriberStatus.PENDING, isDoubleOptIn: false, optInToken,
      emailNotifications: false, marketingEmails: false, transactionalEmails: true, optInIp: ipAddress,
      customFields: { pendingMarketingConsent: data.marketingEmails !== false },
    });
    if (previous) {
      const result = await this.subscriberRepository.update({ id: previous.id, tenantId,
        status: previous.status, isDoubleOptIn: previous.isDoubleOptIn, optInToken: previous.optInToken ?? IsNull() }, {
        optInToken, customFields: subscriber.customFields,
      });
      if (result.affected !== 1) return { ...accepted };
    } else {
      try { await this.subscriberRepository.save(subscriber); }
      catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') return { ...accepted };
        throw error;
      }
    }
    // Generic acknowledgement avoids exposing existing accounts or claiming SMTP delivery.
    try { await this.sendConfirmation(subscriber); }
    catch { this.logger.warn('Subscription confirmation delivery pending; request remains unconfirmed'); }
    return { ...accepted };
  }
  async resubscribe(email: string, ipAddress?: string) {
    return this.subscribeWithDoubleOptIn(email, {}, ipAddress);
  }
  async ensureUnsubscribeToken(subscriberId: string, tenantId: string): Promise<string> {
    if (!tenantId || !/^[A-Za-z0-9_-]{1,128}$/.test(tenantId)) throw new BadRequestException('Tenant is required');
    for (let attempt = 0; attempt < 3; attempt++) {
      const subscriber = await this.subscriberRepository.findOne({ where: { id: subscriberId, tenantId } });
      if (!subscriber || subscriber.status !== SubscriberStatus.ACTIVE || subscriber.isDoubleOptIn !== true) throw new BadRequestException('Subscriber unavailable');
      try {
        if (this.parseToken(subscriber.unsubscribeToken, 'unsubscribe') === tenantId) return subscriber.unsubscribeToken;
      } catch { /* Missing, expired or legacy token requires atomic rotation. */ }
      const token = this.token('unsubscribe', tenantId, 90 * 24 * 60 * 60 * 1000);
      const result = await this.subscriberRepository.update({ id: subscriberId, tenantId,
        status: SubscriberStatus.ACTIVE, isDoubleOptIn: true, unsubscribeToken: subscriber.unsubscribeToken ?? IsNull() }, { unsubscribeToken: token });
      if (result.affected === 1) return token;
    }
    throw new BadRequestException('Subscription changed; retry delivery');
  }
  async confirmOptIn(token: string, ipAddress?: string) {
    const tenantId = this.parseToken(token, 'confirm');
    const subscriber = await this.subscriberRepository.findOne({ where: { tenantId, optInToken: token } });
    if (!subscriber || ![SubscriberStatus.ACTIVE, SubscriberStatus.PENDING, SubscriberStatus.UNSUBSCRIBED].includes(subscriber.status as SubscriberStatus)) throw new BadRequestException('Invalid or expired link');
    const result = await this.subscriberRepository.update({ id: subscriber.id, tenantId, status: subscriber.status, optInToken: token }, {
      optInToken: () => 'NULL', isDoubleOptIn: true, status: SubscriberStatus.ACTIVE,
      emailNotifications: true, marketingEmails: subscriber.customFields?.pendingMarketingConsent === true, optInDate: new Date(), optInIp: ipAddress || '',
      unsubscribeToken: this.token('unsubscribe', tenantId, 90 * 24 * 60 * 60 * 1000),
    });
    if (result.affected !== 1) throw new BadRequestException('Invalid or expired link');
    return { success: true, message: 'Aboneliğiniz onaylandı.' };
  }
  async unsubscribeWithToken(token: string, reason?: string, ipAddress?: string) {
    const tenantId = this.parseToken(token, 'unsubscribe');
    if (reason !== undefined && (typeof reason !== 'string' || reason.length > 500)) throw new BadRequestException('Invalid reason');
    const subscriber = await this.subscriberRepository.findOne({ where: { tenantId, unsubscribeToken: token } });
    if (!subscriber) throw new BadRequestException('Invalid or expired link');
    const result = await this.subscriberRepository.update({ id: subscriber.id, tenantId, status: subscriber.status, unsubscribeToken: token }, {
      status: [SubscriberStatus.BOUNCED, SubscriberStatus.COMPLAINED].includes(subscriber.status as SubscriberStatus) ? subscriber.status : SubscriberStatus.UNSUBSCRIBED, isDoubleOptIn: false, emailNotifications: false, marketingEmails: false,
      optOutDate: new Date(), optOutReason: reason || '', optOutIp: ipAddress || '',
      unsubscribeToken: () => 'NULL', optInToken: () => 'NULL',
    });
    if (result.affected !== 1) throw new BadRequestException('Invalid or expired link');
    this.eventEmitter.emit('neural.signal', { tenantId, source: 'email', type: 'email.unsubscribed', successScore: -10,
      data: { subscriberId: subscriber.id }, timestamp: new Date() });
    return { success: true, message: 'Abonelikten çıktınız.' };
  }
  async updatePreferences(email: string, preferences: Preferences) {
    const tenantId = this.getTenantId();
    const subscriber = await this.subscriberRepository.findOne({ where: { email: this.email(email), tenantId } });
    if (!subscriber) throw new BadRequestException('Subscriber unavailable');
    for (const value of Object.values(preferences)) if (value !== undefined && typeof value !== 'boolean') throw new BadRequestException('Invalid preferences');
    if ((preferences.marketingEmails || preferences.emailNotifications) && (!subscriber.isDoubleOptIn || subscriber.status !== SubscriberStatus.ACTIVE)) throw new BadRequestException('Email confirmation required');
    const changes = {
      ...(preferences.marketingEmails !== undefined ? { marketingEmails: preferences.marketingEmails } : {}),
      ...(preferences.emailNotifications !== undefined ? { emailNotifications: preferences.emailNotifications } : {}) };
    if (!Object.keys(changes).length) return this.preferenceView(subscriber);
    const enabling = preferences.marketingEmails === true || preferences.emailNotifications === true;
    const result = await this.subscriberRepository.update({ id: subscriber.id, tenantId,
      ...(enabling ? { status: SubscriberStatus.ACTIVE, isDoubleOptIn: true } : {}) }, changes);
    if (result.affected !== 1) throw new BadRequestException('Subscription changed; reload preferences');
    return this.preferenceView({ ...subscriber, ...changes });
  }
  private preferenceView(subscriber: Subscriber) {
    return { emailNotifications: subscriber.emailNotifications, marketingEmails: subscriber.marketingEmails,
      transactionalEmails: subscriber.transactionalEmails, status: subscriber.status };
  }
  async getPreferences(email: string) {
    const subscriber = await this.subscriberRepository.findOne({ where: { email: this.email(email), tenantId: this.getTenantId() } });
    if (!subscriber) throw new BadRequestException('Subscriber unavailable');
    return this.preferenceView(subscriber);
  }
  async canReceiveMarketingEmails(email: string): Promise<boolean> {
    const subscriber = await this.subscriberRepository.findOne({ where: { email: this.email(email), tenantId: this.getTenantId() } });
    return !!subscriber && subscriber.status === SubscriberStatus.ACTIVE && subscriber.isDoubleOptIn && subscriber.marketingEmails && subscriber.emailNotifications;
  }
  async canReceiveTransactionalEmails(email: string): Promise<boolean> {
    const subscriber = await this.subscriberRepository.findOne({ where: { email: this.email(email), tenantId: this.getTenantId() } });
    return subscriber?.transactionalEmails !== false;
  }
  private async sendConfirmation(subscriber: Subscriber) {
    const origin = new URL(process.env.NEXT_PUBLIC_BASE_URL || '');
    if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password) throw new Error('Invalid public URL');
    const url = new URL('/confirm-subscription', origin);
    url.searchParams.set('token', subscriber.optInToken);
    const result = await this.mailService.sendMail({ to: { email: subscriber.email }, subject: 'Aboneliğinizi Onaylayın',
      html: `<p>Merhaba ${escapeHtml(subscriber.firstName || 'Değerli Abone')},</p><p>Bülten aboneliğinizi doğrulamak için 24 saat içinde <a href="${escapeHtml(url.toString())}">onaylayın</a>.</p>`,
      text: `Bülten aboneliğinizi 24 saat içinde onaylayın: ${url}`, channel: MailChannel.MARKETING, priority: MailPriority.NORMAL,
    }, subscriber.tenantId);
    if (result?.success !== true) throw new Error('Confirmation delivery failed');
  }
}
