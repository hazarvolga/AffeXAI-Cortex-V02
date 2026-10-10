import { TicketsService } from "./tickets.service";
import { Ticket } from "./entities/ticket.entity";
import { TicketMessage } from "./entities/ticket-message.entity";
import { TicketCategory } from "./entities/ticket-category.entity";

describe("Ticket producer attachment binding transaction", () => {
  let service: TicketsService;
  let active = false;
  let fail = false;
  let committed: unknown[];
  let pending: unknown[];
  const ticket = {
    id: "ticket",
    tenantId: "ta",
    userId: "actor",
    status: "open",
    subject: "subject",
  };
  const save = jest.fn(async (row) => {
    pending.push(row);
    return row;
  });
  const ticketRepo = {
    findOne: jest.fn(async () => ticket),
    create: (row) => ({ ...row, id: "ticket" }),
    save,
    update: jest.fn(),
  };
  const messageRepo = {
    create: (row) => ({ ...row, id: "message" }),
    save,
    findOne: jest.fn(async () => null),
  };
  const manager = {
    getRepository: (entity) =>
      entity === Ticket
        ? ticketRepo
        : entity === TicketMessage
          ? messageRepo
          : entity === TicketCategory
            ? { findOne: async () => ({ id: "category" }) }
            : { save },
  };
  const transaction = jest.fn(async (callback) => {
    active = true;
    pending = [];
    try {
      const result = await callback(manager);
      committed.push(...pending);
      return result;
    } finally {
      active = false;
    }
  });
  const bind = jest.fn(async (received, ids, target) => {
    expect(active).toBe(true);
    expect(received).toBe(manager);
    if (fail) throw new Error("foreign attachment");
    return [];
  });
  const email = jest.fn(async () => {
    expect(active).toBe(false);
  });
  const notify = jest.fn(async () => ({ id: "notification" }));
  beforeEach(() => {
    jest.clearAllMocks();
    active = false;
    fail = false;
    committed = [];
    pending = [];
    service = Object.assign(Object.create(TicketsService.prototype), {
      tenantService: {
        getTenantContext: () => ({ tenantId: "ta", source: "authenticated" }),
      },
      ticketRepository: { ...ticketRepo, manager: { transaction } },
      messageRepository: messageRepo,
      auditLogRepository: { save },
      attachmentService: { bindDrafts: bind },
      userRepository: { findOne: async () => null },
      createAuditLog: jest.fn(),
      findOne: async () => ticket,
      generateDisplayNumber: async () => "SUP-00001",
      slaService: { calculateSLADueDates: () => ({}) },
      autoTaggingService: { autoTag: async () => [] },
      ticketEmailService: {
        sendTicketCreatedEmail: email,
        sendTicketMessageEmail: email,
      },
      notificationsGateway: {
        emitTicketCreated: jest.fn(),
        emitNewMessage: jest.fn(),
      },
      notificationsService: { createNotification: notify },
      eventEmitter: { emit: jest.fn() },
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });
  });
  const create = () =>
    service.create("actor", {
      subject: "subject",
      description: "sufficient description",
      attachmentIds: ["attachment"],
    });
  const reply = () =>
    service.addMessage("ticket", "actor", {
      content: "sufficient message",
      attachmentIds: ["attachment"],
      isInternal: true,
    });
  it.each(["create", "reply"])(
    "binds %s drafts to verified actor and new message in same transaction",
    async (action) => {
      await (action === "create" ? create() : reply());
      expect(bind).toHaveBeenCalledWith(manager, ["attachment"], {
        tenantId: "ta",
        ownerId: "actor",
        ticketId: "ticket",
        messageId: "message",
      });
      expect(committed.length).toBeGreaterThan(0);
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          attachmentIds: ["attachment"],
          tenantId: "ta",
        }),
      );
    },
  );
  it.each(["create", "reply"])(
    "rolls %s records back on invalid/foreign attachment",
    async (action) => {
      fail = true;
      await expect(action === "create" ? create() : reply()).rejects.toThrow(
        "foreign attachment",
      );
      expect(committed).toEqual([]);
      expect(email).not.toHaveBeenCalled();
    },
  );  it('reports committed ticket creation with a notification warning when postcommit email fails', async () => {
    Object.assign(service,{userRepository:{findOne:async()=>({id:'actor',email:'fixture@example.test'})},getSupportManagers:async()=>[]});
    email.mockRejectedValueOnce(new Error('mail configuration unavailable'));
    const result=await create();
    expect(result.id).toBe('ticket');expect(result.notificationWarnings).toEqual(['email_delivery_failed']);
    expect(committed.length).toBeGreaterThan(0);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({action:'notification_failed'}));
  });

  it("persists a customer notification in the reply transaction", async () => {
    await service.addMessage("ticket", "support-agent", {
      content: "A visible support reply",
      isInternal: false,
    });
    expect(notify).toHaveBeenCalledWith(
      {
        userId: "actor",
        type: "ticket_message",
        message: "Destek talebinizde yeni bir yanıt var: subject",
        metadata: {
          ticketId: "ticket",
          messageId: "message",
          authorId: "support-agent",
        },
      },
      manager,
    );
  });

});
