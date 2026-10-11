/**
 * Events Service
 * Handles all event-related API operations
 */

import { BaseApiService } from "./base-service";
import type {
  Event,
  CreateEventDto,
  UpdateEventDto,
  EventQueryParams,
  EventDashboardStats,
  UpcomingEventSummaryDto,
} from "@affexai/shared-types";

class EventsService extends BaseApiService<
  Event,
  CreateEventDto,
  UpdateEventDto
> {
  constructor() {
    super({
      endpoint: "/events",
      useWrappedResponses: true,
    });
  }

  /**
   * Get all events with filters
   */
  async getEvents(params?: EventQueryParams): Promise<Event[]> {
    const queryString = this.buildQueryString(params as any);
    return this.client.getWrapped<Event[]>(`${this.endpoint}${queryString}`);
  }

  /**
   * Get dashboard stats
   */
  async getStats(): Promise<EventDashboardStats> {
    return this.client.getWrapped<EventDashboardStats>(
      `${this.endpoint}/stats`,
    );
  }

  /**
   * Alias for getStats to maintain compatibility
   */
  async getDashboardStats(): Promise<EventDashboardStats> {
    return this.getStats();
  }

  /**
   * Alias for getById to maintain compatibility or for slug support
   */
  async findOne(idOrSlug: string): Promise<Event> {
    return this.getById(idOrSlug);
  }

  /**
   * Get upcoming events (convenience method)
   */
  async getUpcomingEvents(
    limit: number = 2,
  ): Promise<UpcomingEventSummaryDto[]> {
    const safeLimit = Math.min(Math.max(Math.trunc(limit) || 2, 1), 20);
    return this.client.getWrapped<UpcomingEventSummaryDto[]>(
      `${this.endpoint}/upcoming?limit=${safeLimit}`,
    );
  }

  /**
   * Register for an event
   */
  async register(
    idOrSlug: string,
    data: { name: string; email: string },
  ): Promise<{ success: boolean; message: string }> {
    return this.client.postWrapped<{ success: boolean; message: string }>(
      `${this.endpoint}/${idOrSlug}/register`,
      data,
    );
  }

  /**
   * Send event invitation email
   */
  async sendInvitation(
    eventId: string,
    data: { email: string; name: string; additionalInfo?: Record<string, any> },
  ) {
    return this.client.postWrapped(
      `${this.endpoint}/${eventId}/emails/invitation`,
      data,
    );
  }

  /**
   * Send event reminder email
   */
  async sendReminder(eventId: string, data: { email: string; name: string }) {
    return this.client.postWrapped(
      `${this.endpoint}/${eventId}/emails/reminder`,
      data,
    );
  }

  /**
   * Send event cancellation email
   */
  async sendCancellation(
    eventId: string,
    data: { email: string; name: string; reason?: string },
  ) {
    return this.client.postWrapped(
      `${this.endpoint}/${eventId}/emails/cancellation`,
      data,
    );
  }

  /**
   * Send event update email
   */
  async sendUpdate(
    eventId: string,
    data: { email: string; name: string; changes: string[] },
  ) {
    return this.client.postWrapped(
      `${this.endpoint}/${eventId}/emails/update`,
      data,
    );
  }

  /**
   * Generate certificates for participants
   */
  async generateCertificates(
    eventId: string,
    data: { participantIds?: string[]; userIds?: string[] },
  ) {
    return this.client.postWrapped(
      `${this.endpoint}/${eventId}/certificates/generate`,
      data,
    );
  }

  /**
   * Get certificate statistics
   */
  async getCertificateStats(eventId: string) {
    return this.client.getWrapped(
      `${this.endpoint}/${eventId}/certificates/stats`,
    );
  }

  /**
   * Get all certificates for event
   */
  async getCertificates(eventId: string) {
    return this.client.getWrapped(`${this.endpoint}/${eventId}/certificates`);
  }

  /**
   * Get all registrations for an event
   */
  async getRegistrations(eventId: string) {
    return this.client.getWrapped(`${this.endpoint}/${eventId}/registrations`);
  }

  /**
   * Update registration status
   */
  async updateRegistrationStatus(registrationId: string, status: string) {
    return this.client.patchWrapped(
      `${this.endpoint}/registrations/${registrationId}/status`,
      { status },
    );
  }

  /**
   * Send bulk reminders to all confirmed participants
   */
  async sendBulkReminder(eventId: string) {
    return this.client.postWrapped(
      `${this.endpoint}/${eventId}/emails/reminder/bulk`,
      {},
    );
  }
}

export const eventsService = new EventsService();
export default eventsService;

export type { Event, EventDashboardStats } from "@affexai/shared-types";
