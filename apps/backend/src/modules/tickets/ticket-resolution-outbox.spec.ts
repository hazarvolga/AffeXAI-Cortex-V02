import { TicketsService } from "./tickets.service";
import { Ticket } from "./entities/ticket.entity";
import { TicketAuditLog } from "./entities/ticket-audit-log.entity";
import { TicketStatus } from "./enums/ticket-status.enum";
import { IsNull } from "typeorm";

jest.mock(
  "../../core/cortex/cortex-outbox.service",
  () => ({ CortexOutboxService: class {} }),
  { virtual: true },
);
const ticketId = "00000000-0000-4000-8000-000000000001";
const actorId = "00000000-0000-4000-8000-000000000002";

describe("Ticket resolution transactional producer", () => {
  let service: TicketsService;
  let state: Ticket;
  let audits: unknown[];
  let events: Record<string, unknown>[];
  let active: boolean;
  let tenantId: string | undefined;
  let failAudit: boolean;
  let failEvent: boolean;
  let working: Ticket;
  let txAudits: unknown[];
  let txEvents: Record<string, unknown>[];
  const calls: string[] = [];
  const lock = jest.fn(async () => ({ ...working }));
  const saveTicket = jest.fn(async (value: Ticket) => {
    calls.push("ticket");
    working = { ...value };
    return value;
  });
  const saveAudit = jest.fn(async (value: unknown) => {
    calls.push("audit");
    if (failAudit) throw new Error("audit failed");
    txAudits.push(value);
    return value;
  });
  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === Ticket) return { findOne: lock, save: saveTicket };
      if (entity === TicketAuditLog) return { save: saveAudit };
      throw new Error("Unexpected repository");
    }),
  };
  const transaction = jest.fn(
    async (callback: (manager: unknown) => Promise<unknown>) => {
      active = true;
      working = { ...state };
      txAudits = [];
      txEvents = [];
      try {
        const result = await callback(manager);
        state = { ...working };
        audits.push(...txAudits);
        events.push(...txEvents);
        calls.push("commit");
        return result;
      } finally {
        active = false;
      }
    },
  );
  const record = jest.fn(
    async (received: unknown, event: Record<string, unknown>) => {
      expect(active).toBe(true);
      expect(received).toBe(manager);
      calls.push("outbox");
      if (failEvent) throw new Error("outbox failed");
      txEvents.push(event);
    },
  );
  const email = jest.fn(async () => {
    expect(active).toBe(false);
    calls.push("email");
  });
  const socket = jest.fn(async () => {
    expect(active).toBe(false);
    calls.push("socket");
  });
  const emit = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    calls.length = 0;
    audits = [];
    events = [];
    active = false;
    tenantId = "tenant-a";
    failAudit = false;
    failEvent = false;
    state = {
      id: ticketId,
      tenantId: "tenant-a",
      status: TicketStatus.OPEN,
      userId: actorId,
      assignedToId: null,
      subject: "Test subject",
      createdAt: new Date(0),
    } as Ticket;
    lock.mockImplementation(async () => ({ ...working }));
    email.mockImplementation(async () => {
      expect(active).toBe(false);
      calls.push("email");
    });
    service = Object.assign(Object.create(TicketsService.prototype), {
      ticketRepository: {
        manager: { transaction },
        save: jest.fn(async (value: Ticket) => {
          state = { ...value };
          return value;
        }),
      },
      userRepository: {
        findOne: jest.fn(async () => ({ id: actorId, tenantId: "tenant-a" })),
      },
      tenantService: {
        getTenantId: () => tenantId,
        getTenantContext: () => ({ tenantId, source: "authenticated" }),
      },
      cortexOutbox: { recordTicketResolved: record },
      slaService: {
        calculateResponseTime: () => 1,
        calculateResolutionTime: () => 2,
        checkSLABreach: () => false,
      },
      ticketEmailService: { sendTicketResolvedEmail: email },
      auditLogRepository: { save: jest.fn(async () => ({})) },
      notificationsGateway: { emitStatusChanged: socket },
      eventEmitter: { emit },
      logger: { error: jest.fn(), log: jest.fn() },
      findOne: jest.fn(async () => ({ ...state })),
    });
  });
  it("accepts a null system actor only in explicit system scope and records provenance", async () => {
    Object.assign(service, {
      tenantService: {
        getTenantContext: () => ({ tenantId, source: "system" }),
      },
    });
    await service.updateStatus(ticketId, TicketStatus.CLOSED, null);
    expect(saveAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
        metadata: { actorType: "system" },
      }),
    );
    expect(events).toHaveLength(0);
  });
  it("rejects a null actor in authenticated scope before writing", async () => {
    await expect(
      service.updateStatus(ticketId, TicketStatus.CLOSED, null),
    ).rejects.toThrow();
    expect(transaction).not.toHaveBeenCalled();
  });
  it("locks tenant scoped live row and commits ticket, audit and durable event together before side effects", async () => {
    await service.updateStatus(ticketId, TicketStatus.RESOLVED, actorId);
    expect(lock).toHaveBeenCalledWith({
      where: { id: ticketId, tenantId: "tenant-a", deletedAt: IsNull() },
      lock: { mode: "pessimistic_write" },
    });
    expect(calls).toEqual([
      "ticket",
      "audit",
      "outbox",
      "commit",
      "email",
      "socket",
    ]);
    expect(events[0]).toMatchObject({
      tenantId: "tenant-a",
      ticketId,
      actorId,
      payload: { ticketId, resolutionTime: 2, successScore: 5 },
    });
    expect(events[0].eventId).toMatch(/^[0-9a-f-]{36}$/);
    expect(events[0].occurredAt).toBeInstanceOf(Date);
    expect(emit).not.toHaveBeenCalled();
    expect(audits).toHaveLength(1);
  });
  it.each(["audit", "outbox"])(
    "rolls back ticket and all records when %s fails",
    async (stage) => {
      failAudit = stage === "audit";
      failEvent = stage === "outbox";
      await expect(
        service.updateStatus(ticketId, TicketStatus.RESOLVED, actorId),
      ).rejects.toThrow(`${stage} failed`);
      expect(state.status).toBe(TicketStatus.OPEN);
      expect(audits).toEqual([]);
      expect(events).toEqual([]);
      expect(email).not.toHaveBeenCalled();
      expect(socket).not.toHaveBeenCalled();
    },
  );
  it("repeated resolved status is a no-op without another event, email or audit", async () => {
    state = { ...state, status: TicketStatus.RESOLVED };
    await service.updateStatus(ticketId, TicketStatus.RESOLVED, actorId);
    expect(record).not.toHaveBeenCalled();
    expect(saveTicket).not.toHaveBeenCalled();
    expect(saveAudit).not.toHaveBeenCalled();
    expect(email).not.toHaveBeenCalled();
    expect(socket).not.toHaveBeenCalled();
  });
  it("reopen then resolve produces a new event and preserves the first resolution timestamp", async () => {
    await service.updateStatus(ticketId, TicketStatus.RESOLVED, actorId);
    const first = state.resolvedAt;
    await service.updateStatus(ticketId, TicketStatus.OPEN, actorId);
    await service.updateStatus(ticketId, TicketStatus.RESOLVED, actorId);
    expect(events).toHaveLength(2);
    expect(events[0].eventId).not.toBe(events[1].eventId);
    expect(state.resolvedAt).toEqual(first);
  });
  it("rejects a missing tenant before starting a transaction", async () => {
    tenantId = undefined;
    await expect(
      service.updateStatus(ticketId, TicketStatus.RESOLVED, actorId),
    ).rejects.toThrow();
    expect(transaction).not.toHaveBeenCalled();
  });
  it("does not modify a missing, foreign or deleted row excluded by the locked lookup", async () => {
    lock.mockResolvedValue(null);
    await expect(
      service.updateStatus(ticketId, TicketStatus.RESOLVED, actorId),
    ).rejects.toThrow();
    expect(record).not.toHaveBeenCalled();
    expect(saveTicket).not.toHaveBeenCalled();
  });
  it("postcommit email failure cannot lose the durable event or duplicate it on retry", async () => {
    email.mockRejectedValue(new Error("provider failed"));
    const result = await service.updateStatus(
      ticketId,
      TicketStatus.RESOLVED,
      actorId,
    );
    expect(result.notificationWarnings).toEqual(["email_delivery_failed"]);
    expect(
      (service as unknown as { auditLogRepository: { save: jest.Mock } })
        .auditLogRepository.save,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "notification_failed",
        metadata: {
          channel: "email",
          template: "ticket_resolved",
          failureCode: "delivery_unavailable",
        },
      }),
    );
    expect(state.status).toBe(TicketStatus.RESOLVED);
    expect(events).toHaveLength(1);
    await service.updateStatus(ticketId, TicketStatus.RESOLVED, actorId);
    expect(events).toHaveLength(1);
    expect(email).toHaveBeenCalledTimes(1);
  });
  it("returns the committed status with explicit warning when notification audit is also unavailable", async () => {
    email.mockRejectedValue(new Error("provider unavailable"));
    Object.assign(service, {
      auditLogRepository: {
        save: jest.fn(async () => {
          throw new Error("database unavailable");
        }),
      },
    });
    const result = await service.updateStatus(
      ticketId,
      TicketStatus.RESOLVED,
      actorId,
    );
    expect(result.notificationWarnings).toEqual([
      "email_delivery_failed",
      "notification_audit_failed",
    ]);
    expect(state.status).toBe(TicketStatus.RESOLVED);
    expect(events).toHaveLength(1);
  });
});
