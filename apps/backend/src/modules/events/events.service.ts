import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { EventRegistration } from './entities/event-registration.entity';
import { CacheService } from '../../core/shared/services/cache.service';
import { MailService } from '../mail/mail.service';
import { MailChannel, MailPriority } from '../mail/interfaces/mail-service.interface';
import { EventBusService } from '../platform-integration/services/event-bus.service';
import { TenantService } from '../../core/tenant/tenant.service';
import { StrategyService } from '../strategy/services/strategy.service';
import { CommerceService } from '../commerce/services/commerce.service';


@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(EventRegistration)
    private registrationsRepository: Repository<EventRegistration>,
    private cacheService: CacheService,
    private mailService: MailService,
    private eventBusService: EventBusService,
    private tenantService: TenantService,
    private readonly strategyService: StrategyService,
    private readonly commerceService: CommerceService,
  ) { }

  private getActiveTenantId(tenantId?: string): string {
    return tenantId || this.tenantService.getTenantId() || 'default';
  }

  async create(createEventDto: CreateEventDto, tenantId?: string): Promise<Event> {
    const activeTenantId = this.getActiveTenantId(tenantId);

    // 0. Governance Check (Neural Grid)
    const limitCheck = await this.commerceService.checkLimit(activeTenantId);
    if (!limitCheck.allowed) {
      this.logger.warn(`Event Creation Blocked: Rate limit exceeded for tenant ${activeTenantId}`);
      throw new BadRequestException('Plan Limit Exceeded. Please upgrade to create more events.');
    }

    const event = this.eventsRepository.create({ ...createEventDto, tenantId: activeTenantId });
    event.slug = this.generateSlug(createEventDto.title);

    // Ensure uniqueness (basic check)
    let count = 1;
    let baseSlug = event.slug;
    while (await this.eventsRepository.findOne({ where: { slug: event.slug } })) {
      event.slug = `${baseSlug}-${count}`;
      count++;
    }

    const savedEvent = await this.eventsRepository.save(event);

    // 1. Neural Signal (RAG Feed)
    this.strategyService.emitSignal(activeTenantId, 'EVENT_CREATED', {
      eventId: savedEvent.id,
      title: savedEvent.title,
      date: savedEvent.startDate,
      location: savedEvent.location
    }).catch(e => this.logger.warn(`Failed to emit signal: ${e.message}`));

    // Clear cache for findAll of this tenant
    await this.cacheService.del(`events:${activeTenantId}:all`);

    // Publish platform event
    await this.eventBusService.publishEventCreated(
      savedEvent.id,
      {
        title: savedEvent.title,
        startDate: savedEvent.startDate,
        endDate: savedEvent.endDate,
        location: savedEvent.location,
        capacity: savedEvent.capacity,
      },
      activeTenantId,
    );

    return savedEvent;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findAll(tenantId?: string): Promise<Event[]> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const cached = await this.cacheService.get<Event[]>(`events:${activeTenantId}:all`);
    if (cached) {
      return cached;
    }

    const events = await this.eventsRepository.find({ where: { tenantId: activeTenantId } });
    await this.cacheService.set(`events:${activeTenantId}:all`, events, 30); // 30 seconds TTL
    return events;
  }

  async findOne(idOrSlug: string, tenantId?: string): Promise<Event> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const cached = await this.cacheService.get<Event>(`events:${activeTenantId}:${idOrSlug}`);
    if (cached) {
      return cached;
    }

    // Check if UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const event = await this.eventsRepository.findOne({
      where: isUuid ? { id: idOrSlug, tenantId: activeTenantId } : { slug: idOrSlug, tenantId: activeTenantId },
      relations: ['registrations']
    });

    if (!event) {
      throw new NotFoundException(`Event with identifer ${idOrSlug} not found`);
    }

    await this.cacheService.set(`events:${activeTenantId}:${idOrSlug}`, event, 60); // 60 seconds TTL
    return event;
  }

  // New method to get dashboard statistics
  async getDashboardStats(tenantId?: string): Promise<{
    upcomingEvents: number;
    totalTicketSales: number;
    totalParticipants: number;
    monthlyRevenue: number;
    revenueChange: number;
  }> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const allEvents = await this.findAll(activeTenantId);
    const now = new Date();

    // Count upcoming events (events that haven't started yet)
    const upcomingEvents = allEvents.filter(event => new Date(event.startDate) > now).length;

    // For ticket sales, we'll simulate based on event capacity (assuming 75% average attendance)
    const totalTicketSales = allEvents.reduce((total, event) => {
      return total + Math.floor(event.capacity * 0.75);
    }, 0);

    // For participants, we'll use the same calculation as ticket sales
    const totalParticipants = totalTicketSales;

    // For revenue, we'll calculate based on price and attendance
    const monthlyRevenue = allEvents.reduce((total, event) => {
      const attendance = Math.floor(event.capacity * 0.75);
      const price = Number(event.price) || 0; // Handle case where price might be null
      return total + (attendance * price);
    }, 0);

    // Calculate revenue change (simplified - using 10% as a mock value)
    const revenueChange = 10;

    return {
      upcomingEvents,
      totalTicketSales,
      totalParticipants,
      monthlyRevenue,
      revenueChange
    };
  }

  /**
   * Send bulk reminders to all confirmed participants
   */
  async sendBulkReminder(eventId: string, tenantId?: string): Promise<{ sentCount: number }> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const registrations = await this.getRegistrations(eventId, activeTenantId);
    const confirmed = registrations.filter(r => r.status === 'confirmed');

    const event = await this.findOne(eventId, activeTenantId);

    let sentCount = 0;
    for (const reg of confirmed) {
      try {
        await this.sendEventReminder(event, reg.guestEmail, reg.guestName);
        sentCount++;
      } catch (err) {
        this.logger.error(`Failed to send bulk reminder to ${reg.guestEmail}: ${err.message}`);
      }
    }

    return { sentCount };
  }

  async update(id: string, updateEventDto: UpdateEventDto, tenantId?: string): Promise<Event> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    // First check if event exists
    const existingEvent = await this.eventsRepository.findOne({ where: { id, tenantId: activeTenantId } });
    if (!existingEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Regenerate slug if title changes
    if (updateEventDto.title && updateEventDto.title !== existingEvent.title) {
      updateEventDto['slug'] = this.generateSlug(updateEventDto.title);

      // Ensure uniqueness (basic check)
      let count = 1;
      let baseSlug = updateEventDto['slug'];
      while (await this.eventsRepository.findOne({ where: { slug: updateEventDto['slug'], tenantId: activeTenantId } })) {
        updateEventDto['slug'] = `${baseSlug}-${count}`;
        count++;
      }
    }

    await this.eventsRepository.update({ id, tenantId: activeTenantId }, updateEventDto);
    const event = await this.findOne(id, activeTenantId);

    // Clear cache for this event and all events
    await this.cacheService.del(`events:${activeTenantId}:${id}`);
    await this.cacheService.del(`events:${activeTenantId}:all`);

    // Publish platform event for significant updates
    if (updateEventDto.status === 'published') {
      await this.eventBusService.publishEventPublished(
        event.id,
        {
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          capacity: event.capacity,
        },
        activeTenantId,
      );
    }

    return event;
  }

  async remove(id: string, tenantId?: string): Promise<void> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    // First check if event exists
    const existingEvent = await this.eventsRepository.findOne({ where: { id, tenantId: activeTenantId } });
    if (!existingEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    await this.eventsRepository.delete({ id, tenantId: activeTenantId });

    // Clear cache for this event and all events
    await this.cacheService.del(`events:${activeTenantId}:${id}`);
    await this.cacheService.del(`events:${activeTenantId}:all`);
  }

  /**
   * Get all registrations for an event
   */
  async getRegistrations(eventId: string, tenantId?: string): Promise<EventRegistration[]> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const event = await this.findOne(eventId, activeTenantId); // Ensure event exists and belongs to tenant
    return this.registrationsRepository.find({
      where: { event: { id: event.id } },
      relations: ['event'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Update registration status (Scoped by tenant via event)
   */
  async updateRegistrationStatus(registrationId: string, status: string, tenantId?: string): Promise<EventRegistration> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    // We need to verify that the registration belongs to an event owned by the tenant
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId },
      relations: ['event']
    });

    if (!registration) {
      throw new NotFoundException(`Registration with ID ${registrationId} not found`);
    }

    // Manual tenant check since registration doesn't have tenantId directly (it's via event)
    // Assuming Event entity has tenantId (inherited from BaseEntity)
    if (registration.event.tenantId !== activeTenantId) {
      throw new NotFoundException(`Registration with ID ${registrationId} not found`); // Obfuscate isolation error
    }

    registration.status = status;
    return this.registrationsRepository.save(registration);
  }

  /**
   * Register for an event
   */
  async register(idOrSlug: string, data: { name: string; email: string }, tenantId?: string): Promise<{ success: boolean; message: string }> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const event = await this.findOne(idOrSlug, activeTenantId);

    // Check capacity
    const registrationCount = await this.registrationsRepository.count({
      where: { event: { id: event.id } }
    });

    if (event.capacity && registrationCount >= event.capacity) {
      throw new BadRequestException('Event is at full capacity');
    }

    // Check if already registered
    const existing = await this.registrationsRepository.findOne({
      where: {
        event: { id: event.id },
        guestEmail: data.email
      }
    });

    if (existing) {
      return { success: true, message: 'Already registered for this event' };
    }

    const registration = this.registrationsRepository.create({
      event,
      guestName: data.name,
      guestEmail: data.email,
      status: 'confirmed',
      amountPaid: 0,
    });

    await this.registrationsRepository.save(registration);

    // Trigger automated email
    try {
      await this.sendEventInvitation(event, data.email, data.name);
    } catch (error) {
      this.logger.error(`Failed to send registration email to ${data.email}: ${error.message}`);
      // Don't fail the registration if email fails
    }

    return { success: true, message: 'Successfully registered for the event' };
  }

  /**
   * Send event invitation email to participant
   */
  async sendEventInvitation(
    event: Event,
    participantEmail: string,
    participantName: string,
    additionalInfo?: Record<string, any>,
  ): Promise<void> {
    try {
      const eventDate = new Date(event.startDate).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9fafb; }
              .event-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
              .detail-row { margin: 10px 0; }
              .label { font-weight: bold; color: #1f2937; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
              .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Etkinlik Daveti</h1>
              </div>
              <div class="content">
                <p>Merhaba ${participantName},</p>
                <p>Aşağıdaki etkinliğe davetlisiniz:</p>
                
                <div class="event-details">
                  <h2>${event.title}</h2>
                  <div class="detail-row">
                    <span class="label">Tarih:</span> ${eventDate}
                  </div>
                  <div class="detail-row">
                    <span class="label">Konum:</span> ${event.location}
                  </div>
                  <div class="detail-row">
                    <span class="label">Kapasite:</span> ${event.capacity} kişi
                  </div>
                  ${event.price > 0 ? `<div class="detail-row"><span class="label">Fiyat:</span> ${event.price} TL</div>` : ''}
                  <div class="detail-row">
                    <p>${event.description}</p>
                  </div>
                </div>

                ${event.grantsCertificate ? '<p><strong>✨ Bu etkinlik sonunda sertifika alacaksınız!</strong></p>' : ''}
                
                <p>Katılımınızı bekliyoruz!</p>
              </div>
              <div class="footer">
                <p>© 2025 Aluplan. Tüm hakları saklıdır.</p>
                <p>Bu email info@affexai.com tarafından gönderilmiştir.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await this.mailService.sendMail({
        to: { email: participantEmail, name: participantName },
        subject: `Etkinlik Daveti: ${event.title}`,
        html: htmlContent,
        channel: MailChannel.EVENT,
        priority: MailPriority.NORMAL,
        metadata: {
          eventId: event.id,
          eventTitle: event.title,
          participantName,
          ...additionalInfo,
        },
      });

      this.logger.log(`Event invitation sent to ${participantEmail} for event: ${event.title}`);
    } catch (error) {
      this.logger.error(`Failed to send event invitation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send event reminder email (24 hours before event)
   */
  async sendEventReminder(
    event: Event,
    participantEmail: string,
    participantName: string,
  ): Promise<void> {
    try {
      const eventDate = new Date(event.startDate).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #fffbeb; }
              .event-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
              .detail-row { margin: 10px 0; }
              .label { font-weight: bold; color: #1f2937; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
              .reminder-badge { background: #fbbf24; color: #78350f; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ Etkinlik Hatırlatması</h1>
              </div>
              <div class="content">
                <p>Merhaba ${participantName},</p>
                <p><span class="reminder-badge">Yarın gerçekleşecek!</span></p>
                <p>Katılacağınız etkinlik yaklaşıyor:</p>
                
                <div class="event-details">
                  <h2>${event.title}</h2>
                  <div class="detail-row">
                    <span class="label">📅 Tarih:</span> ${eventDate}
                  </div>
                  <div class="detail-row">
                    <span class="label">📍 Konum:</span> ${event.location}
                  </div>
                </div>

                <p>Lütfen zamanında katılmayı unutmayın!</p>
              </div>
              <div class="footer">
                <p>© 2025 Aluplan. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await this.mailService.sendMail({
        to: { email: participantEmail, name: participantName },
        subject: `Hatırlatma: ${event.title} - Yarın Gerçekleşecek!`,
        html: htmlContent,
        channel: MailChannel.EVENT,
        priority: MailPriority.HIGH,
        metadata: {
          eventId: event.id,
          eventTitle: event.title,
          participantName,
          reminderType: '24h',
        },
      });

      this.logger.log(`Event reminder sent to ${participantEmail} for event: ${event.title}`);
    } catch (error) {
      this.logger.error(`Failed to send event reminder: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send event cancellation email
   */
  async sendEventCancellation(
    event: Event,
    participantEmail: string,
    participantName: string,
    cancellationReason?: string,
  ): Promise<void> {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #fef2f2; }
              .event-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
              .detail-row { margin: 10px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
              .cancel-badge { background: #ef4444; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>❌ Etkinlik İptali</h1>
              </div>
              <div class="content">
                <p>Merhaba ${participantName},</p>
                <p><span class="cancel-badge">İPTAL EDİLDİ</span></p>
                <p>Üzülerek bildiririz ki aşağıdaki etkinlik iptal edilmiştir:</p>
                
                <div class="event-details">
                  <h2>${event.title}</h2>
                  ${cancellationReason ? `<p><strong>İptal Nedeni:</strong> ${cancellationReason}</p>` : ''}
                </div>

                <p>Bu durumdan dolayı özür dileriz. Gelecek etkinliklerimizden haberdar olmak için takipte kalın.</p>
              </div>
              <div class="footer">
                <p>© 2025 Aluplan. Tüm hakları saklıdır.</p>
                <p>Sorularınız için: support@affexai.com</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await this.mailService.sendMail({
        to: { email: participantEmail, name: participantName },
        subject: `İptal: ${event.title}`,
        html: htmlContent,
        channel: MailChannel.EVENT,
        priority: MailPriority.HIGH,
        metadata: {
          eventId: event.id,
          eventTitle: event.title,
          participantName,
          cancellationReason: cancellationReason || 'Belirtilmedi',
        },
      });

      this.logger.log(`Event cancellation sent to ${participantEmail} for event: ${event.title}`);
    } catch (error) {
      this.logger.error(`Failed to send event cancellation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send event update notification
   */
  async sendEventUpdate(
    event: Event,
    participantEmail: string,
    participantName: string,
    changes: string[],
  ): Promise<void> {
    try {
      const eventDate = new Date(event.startDate).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const changesHtml = changes.map(change => `<li>${change}</li>`).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #0891b2; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #ecfeff; }
              .event-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
              .changes-list { background: #f0f9ff; padding: 15px; margin: 15px 0; border-left: 4px solid #0891b2; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📢 Etkinlik Güncellendi</h1>
              </div>
              <div class="content">
                <p>Merhaba ${participantName},</p>
                <p>Katılacağınız etkinlikte değişiklik yapılmıştır:</p>
                
                <div class="event-details">
                  <h2>${event.title}</h2>
                  <p><strong>Yeni Tarih:</strong> ${eventDate}</p>
                  <p><strong>Konum:</strong> ${event.location}</p>
                </div>

                <div class="changes-list">
                  <strong>Yapılan Değişiklikler:</strong>
                  <ul>
                    ${changesHtml}
                  </ul>
                </div>

                <p>Lütfen bu değişiklikleri not alın.</p>
              </div>
              <div class="footer">
                <p>© 2025 Aluplan. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await this.mailService.sendMail({
        to: { email: participantEmail, name: participantName },
        subject: `Güncelleme: ${event.title}`,
        html: htmlContent,
        channel: MailChannel.EVENT,
        priority: MailPriority.NORMAL,
        metadata: {
          eventId: event.id,
          eventTitle: event.title,
          participantName,
          changes,
        },
      });

      this.logger.log(`Event update sent to ${participantEmail} for event: ${event.title}`);
    } catch (error) {
      this.logger.error(`Failed to send event update: ${error.message}`);
      throw error;
    }
  }
}