import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ModuleSource, PlatformEvent, PlatformEventType } from '../../modules/platform-integration/entities/platform-event.entity';

export interface TicketResolvedEvent {
  eventId: string;
  tenantId: string;
  ticketId: string;
  actorId: string;
  occurredAt: Date;
  payload: { successScore: number; context: string; ticketId: string; resolutionTime: number | null };
}

export interface CrmLeadCapturedEvent {
  eventId: string;
  tenantId: string;
  leadId: string;
  customerId: string | null;
  formId: string;
  submissionId: string;
  occurredAt: Date;
}

export interface FormSubmittedEvent {
  eventId: string;
  tenantId: string;
  formId: string;
  submissionId: string;
  occurredAt: Date;
}

@Injectable()
export class CortexOutboxService {
  private async queueAutomationRules(
    manager: EntityManager,
    eventId: string,
    tenantId: string,
    eventType: PlatformEventType,
  ): Promise<void> {
    await manager.query(
      `INSERT INTO automation_dispatch_outbox (event_id, rule_id, tenant_id)
       SELECT $1::uuid, id, tenant_id FROM automation_rules
       WHERE tenant_id = $2 AND "triggerEventType" = $3
         AND "isActive" = true AND deleted_at IS NULL
       ON CONFLICT (event_id, rule_id) DO NOTHING`,
      [eventId, tenantId, eventType],
    );
  }

  async recordTicketResolved(manager: EntityManager, event: TicketResolvedEvent): Promise<void> {
    if (!manager.queryRunner?.isTransactionActive) throw new Error('An active producer transaction is required');
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(event.tenantId)) throw new Error('A valid tenant is required');
    const payload = {
      eventId: event.eventId, tenantId: event.tenantId, source: 'tickets',
      type: 'ticket.resolved', data: { ...event.payload, ticketId: event.ticketId },
      timestamp: event.occurredAt.toISOString(),
    };
    if (Buffer.byteLength(JSON.stringify(payload)) > 65536) throw new Error('Cortex event exceeds delivery limit');
    await manager.save(PlatformEvent, {
      id: event.eventId, tenantId: event.tenantId, source: ModuleSource.SUPPORT,
      eventType: PlatformEventType.TICKET_RESOLVED, payload: payload.data,
      metadata: { actorId: event.actorId }, triggeredRules: [], createdAt: event.occurredAt,
    });
    await manager.query(`INSERT INTO cortex_outbox (event_id, tenant_id, payload) VALUES ($1, $2, $3::jsonb)`,
      [event.eventId, event.tenantId, JSON.stringify(payload)]);
    await this.queueAutomationRules(
      manager,
      event.eventId,
      event.tenantId,
      PlatformEventType.TICKET_RESOLVED,
    );
  }

  async recordCrmLeadCaptured(manager: EntityManager, event: CrmLeadCapturedEvent): Promise<void> {
    if (!manager.queryRunner?.isTransactionActive) throw new Error('An active producer transaction is required');
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(event.tenantId)) throw new Error('A valid tenant is required');
    const data = {
      schemaVersion: 1,
      leadId: event.leadId,
      customerId: event.customerId,
      formId: event.formId,
      submissionId: event.submissionId,
    };
    const payload = {
      eventId: event.eventId,
      tenantId: event.tenantId,
      source: 'crm',
      type: 'crm.lead.captured',
      data,
      timestamp: event.occurredAt.toISOString(),
    };
    await manager.save(PlatformEvent, {
      id: event.eventId,
      tenantId: event.tenantId,
      source: ModuleSource.CRM,
      eventType: PlatformEventType.CRM_LEAD_CAPTURED,
      payload: data,
      metadata: { containsPii: false },
      triggeredRules: [],
      createdAt: event.occurredAt,
    });
    await manager.query(
      `INSERT INTO cortex_outbox (event_id, tenant_id, payload) VALUES ($1, $2, $3::jsonb)`,
      [event.eventId, event.tenantId, JSON.stringify(payload)],
    );
    await this.queueAutomationRules(
      manager,
      event.eventId,
      event.tenantId,
      PlatformEventType.CRM_LEAD_CAPTURED,
    );
  }

  async recordFormSubmitted(manager: EntityManager, event: FormSubmittedEvent): Promise<void> {
    if (!manager.queryRunner?.isTransactionActive) throw new Error('An active producer transaction is required');
    if (!/^[a-z0-9_-]{1,128}$/.test(event.tenantId)) throw new Error('A valid tenant is required');
    const data = {
      schemaVersion: 1,
      formId: event.formId,
      submissionId: event.submissionId,
    };
    await manager.save(PlatformEvent, {
      id: event.eventId,
      tenantId: event.tenantId,
      source: ModuleSource.FORMS,
      eventType: PlatformEventType.FORM_SUBMITTED,
      payload: data,
      metadata: { containsPii: false },
      triggeredRules: [],
      createdAt: event.occurredAt,
    });
    await this.queueAutomationRules(
      manager,
      event.eventId,
      event.tenantId,
      PlatformEventType.FORM_SUBMITTED,
    );
  }
}
