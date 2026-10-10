import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlatformEvent, PlatformEventType, ModuleSource } from '../entities/platform-event.entity';

/**
 * EventBus Service
 * 
 * Central event management system for the entire platform.
 * Handles event publishing, logging, and triggering automation rules.
 * 
 * Features:
 * - Event logging to database
 * - Event broadcasting to subscribers
 * - Automatic automation rule triggering
 * - Event filtering and querying
 * - Real-time event streaming
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(
    @InjectRepository(PlatformEvent)
    private readonly eventRepository: Repository<PlatformEvent>,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Publish an event to the platform
   * 
   * This is the main entry point for all platform events.
   * 
   * @param source - Module that generated the event
   * @param eventType - Type of event
   * @param payload - Event data
   * @param metadata - Additional context (userId, ip, userAgent, etc.)
   * @returns Created event entity
   */
  async publish(
    source: ModuleSource,
    eventType: PlatformEventType,
    payload: Record<string, any>,
    tenantId: string,
    metadata?: Record<string, any>,
  ): Promise<PlatformEvent> {
    if (!tenantId || !/^[a-z0-9_-]{1,128}$/.test(tenantId)) {
      throw new BadRequestException('A valid tenant is required');
    }
    try {
      const savedEvent = await this.dataSource.transaction(async manager => {
        const events = manager.getRepository(PlatformEvent);
        const event = events.create({
          source, eventType, payload, tenantId, metadata, triggeredRules: [],
        });
        const saved = await events.save(event);
        await manager.query(
          `INSERT INTO automation_dispatch_outbox (event_id, rule_id, tenant_id)
           SELECT $1::uuid, id, tenant_id FROM automation_rules
           WHERE tenant_id = $2 AND "triggerEventType" = $3
             AND "isActive" = true AND deleted_at IS NULL
           ON CONFLICT (event_id, rule_id) DO NOTHING`,
          [saved.id, tenantId, eventType],
        );
        return saved;
      });

      this.logger.log(
        `Event published: ${eventType} from ${source}`,
        { eventId: savedEvent.id },
      );

      // Emit event to EventEmitter2 for real-time subscribers
      this.eventEmitter.emit(eventType, {
        event: savedEvent,
        payload,
        metadata,
      });

      // Also emit a generic event for all-event listeners
      this.eventEmitter.emit('platform.event', {
        event: savedEvent,
        payload,
        metadata,
      });

      return savedEvent;
    } catch (error) {
      this.logger.error(
        `Failed to publish event: ${eventType} from ${source}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get events by type
   */
  async getEventsByType(
    eventType: PlatformEventType,
    tenantId: string,
    limit = 100,
  ): Promise<PlatformEvent[]> {
    return this.eventRepository.find({
      where: { eventType, tenantId } as any,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get events by source module
   */
  async getEventsBySource(
    source: ModuleSource,
    tenantId: string,
    limit = 100,
  ): Promise<PlatformEvent[]> {
    return this.eventRepository.find({
      where: { source, tenantId } as any,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get recent events
   */
  async getRecentEvents(tenantId: string, limit = 100): Promise<PlatformEvent[]> {
    return this.eventRepository.find({
      where: { tenantId } as any,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get events that triggered automation rules
   */
  async getEventsWithAutomation(tenantId: string, limit = 100): Promise<PlatformEvent[]> {
    return this.eventRepository
      .createQueryBuilder('event')
      .where("array_length(event.triggered_rules, 1) > 0")
      .andWhere("event.tenantId = :tenantId", { tenantId })
      .orderBy('event.created_at', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get event statistics
   */
  async getEventStats(tenantId: string, startDate?: Date, endDate?: Date): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySource: Record<string, number>;
    eventsWithAutomation: number;
  }> {
    if (!tenantId || !/^[A-Za-z0-9_-]{1,128}$/.test(tenantId)) throw new BadRequestException('Tenant is required');
    const query = this.eventRepository.createQueryBuilder('event');
    query.where('event.tenantId = :tenantId', { tenantId });

    if (startDate) {
      query.andWhere('event.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('event.created_at <= :endDate', { endDate });
    }

    const events = await query.getMany();

    const eventsByType: Record<string, number> = {};
    const eventsBySource: Record<string, number> = {};
    let eventsWithAutomation = 0;

    events.forEach((event) => {
      // Count by type
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;

      // Count by source
      eventsBySource[event.source] = (eventsBySource[event.source] || 0) + 1;

      // Count events with automation
      if (event.triggeredRules && event.triggeredRules.length > 0) {
        eventsWithAutomation++;
      }
    });

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySource,
      eventsWithAutomation,
    };
  }

  /**
   * Subscribe to events in real-time
   * 
   * @param eventType - Event type to subscribe to (or 'platform.event' for all)
   * @param callback - Function to call when event occurs
   * @returns Unsubscribe function
   */
  subscribe(
    eventType: PlatformEventType | 'platform.event',
    callback: (data: any) => void,
  ): () => void {
    this.eventEmitter.on(eventType, callback);

    // Return unsubscribe function
    return () => {
      this.eventEmitter.off(eventType, callback);
    };
  }

  /**
   * Publish event helper methods for common event types
   */

  // Events Module
  async publishEventCreated(eventId: string, eventData: any, tenantId: string, userId?: string) {
    return this.publish(
      ModuleSource.EVENTS,
      PlatformEventType.EVENT_CREATED,
      { eventId, ...eventData },
      tenantId,
      { userId },
    );
  }

  async publishEventPublished(eventId: string, eventData: any, tenantId: string, userId?: string) {
    return this.publish(
      ModuleSource.EVENTS,
      PlatformEventType.EVENT_PUBLISHED,
      { eventId, ...eventData },
      tenantId,
      { userId },
    );
  }

  async publishEventCancelled(eventId: string, reason: string, tenantId: string, userId?: string) {
    return this.publish(
      ModuleSource.EVENTS,
      PlatformEventType.EVENT_CANCELLED,
      { eventId, reason },
      tenantId,
      { userId },
    );
  }

  // Email Marketing Module
  async publishCampaignSent(campaignId: string, recipientCount: number, tenantId: string, userId?: string) {
    return this.publish(
      ModuleSource.EMAIL_MARKETING,
      PlatformEventType.CAMPAIGN_SENT,
      { campaignId, recipientCount },
      tenantId,
      { userId },
    );
  }

  async publishSubscriberAdded(subscriberId: string, email: string, tenantId: string, source?: string) {
    return this.publish(
      ModuleSource.EMAIL_MARKETING,
      PlatformEventType.SUBSCRIBER_ADDED,
      { subscriberId, email, source },
      tenantId,
    );
  }

  // Certificates Module
  async publishCertificateIssued(certificateId: string, userId: string, tenantId: string, eventId?: string) {
    return this.publish(
      ModuleSource.CERTIFICATES,
      PlatformEventType.CERTIFICATE_ISSUED,
      { certificateId, userId, eventId },
      tenantId,
    );
  }

  // CMS Module
  async publishPagePublished(pageId: string, slug: string, tenantId: string, userId?: string) {
    return this.publish(
      ModuleSource.CMS,
      PlatformEventType.PAGE_PUBLISHED,
      { pageId, slug },
      tenantId,
      { userId },
    );
  }

  // Media Module
  async publishMediaUploaded(mediaId: string, fileName: string, fileSize: number, tenantId: string, userId?: string) {
    return this.publish(
      ModuleSource.MEDIA,
      PlatformEventType.MEDIA_UPLOADED,
      { mediaId, fileName, fileSize },
      tenantId,
      { userId },
    );
  }
}
