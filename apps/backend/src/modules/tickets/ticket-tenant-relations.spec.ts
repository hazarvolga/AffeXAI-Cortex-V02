import { TicketsService } from "./tickets.service";
import { Ticket } from "./entities/ticket.entity";
import { TicketMessage } from "./entities/ticket-message.entity";
import { TicketCategory } from "./entities/ticket-category.entity";
import { IsNull, In } from "typeorm";

describe("Ticket service trusted scope and tenant relations", () => {
  let service: TicketsService;
  let context: { tenantId: string; source?: string } | undefined;
  const ticket = {
    id: "ticket",
    tenantId: "ta",
    userId: "owner",
    priority: "low",
    status: "new",
    categoryId: "category",
  };
  const tickets = {
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
    create: jest.fn((value) => ({ ...value, id: "new-ticket" })),
  };
  const users = { findOne: jest.fn() };
  const messages = {
    find: jest.fn(async () => [{ id: "message" }]),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    update: jest.fn(),
  };
  beforeEach(() => {
    jest.clearAllMocks();
    context = { tenantId: "ta", source: "authenticated" };
    tickets.findOne.mockResolvedValue({ ...ticket });
    users.findOne.mockResolvedValue(null);
    messages.update.mockResolvedValue({ affected: 1 });
    Object.assign(tickets, {
      findOneOrFail: tickets.findOne,
      manager: {
        transaction: async (callback) =>
          callback({
            getRepository: (entity) =>
              entity === Ticket
                ? tickets
                : entity === TicketMessage
                  ? messages
                  : entity === TicketCategory
                    ? { findOne: async () => ({ id: "category" }) }
                    : { save: async () => ({}) },
          }),
      },
    });
    service = Object.assign(Object.create(TicketsService.prototype), {
      tenantService: {
        getTenantId: () => context?.tenantId,
        getTenantContext: () => context,
      },
      ticketRepository: tickets,
      userRepository: users,
      messageRepository: messages,
      categoryRepository: {
        findOne: jest.fn(async () => ({ id: "category", tenantId: "ta" })),
      },
      createAuditLog: jest.fn(),
      generateDisplayNumber: async () => "SUP-00001",
      slaService: { calculateSLADueDates: () => ({}) },
      ticketEmailService: {
        sendTicketAssignedEmail: jest.fn(),
        sendTicketEscalatedEmail: jest.fn(),
      },
      notificationsGateway: {
        emitTicketAssigned: jest.fn(),
        emitTicketEscalated: jest.fn(),
      },
      logger: { log: jest.fn(), error: jest.fn() },
    });
  });
  it.each([
    undefined,
    { tenantId: "ta" },
    { tenantId: "ta", source: "public" },
  ])("rejects untrusted/missing context before lookup %p", async (value) => {
    context = value;
    await expect(service.findOne("ticket")).rejects.toThrow();
    expect(tickets.findOne).not.toHaveBeenCalled();
  });
  it.each([
    ["low", "medium"],
    ["urgent", "urgent"],
  ])("escalates %s to valid persisted %s", async (before, after) => {
    const original = { ...ticket, priority: before };
    tickets.findOne.mockResolvedValue(original);
    await service.escalateTicket("ticket", "actor");
    expect(tickets.save).toHaveBeenCalledWith(
      expect.objectContaining({ priority: after }),
    );
    expect(original.priority).toBe(before);
  });
  it("always scopes detail by authenticated tenant and live rows", async () => {
    await service.findOne("ticket");
    expect(tickets.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket", tenantId: "ta", deletedAt: IsNull() },
      }),
    );
  });
  it.each(["assign", "escalate"])(
    "rejects foreign/deleted/inactive %s target before save",
    async (action) => {
      await expect(
        action === "assign"
          ? service.assignTo("ticket", "foreign", "actor")
          : service.escalateTicket("ticket", "actor", "reason", "foreign"),
      ).rejects.toThrow();
      expect(tickets.save).not.toHaveBeenCalled();
      expect(users.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "foreign",
            tenantId: "ta",
            isActive: true,
            deletedAt: IsNull(),
          },
        }),
      );
    },
  );
  it.each(["assign", "escalate"])(
    "rejects ordinary tenant customer as %s target",
    async (action) => {
      users.findOne.mockResolvedValue({
        id: "customer",
        tenantId: "ta",
        isActive: true,
        roleEntity: { name: "customer" },
        userRoles: [],
      });
      await expect(
        action === "assign"
          ? service.assignTo("ticket", "customer", "actor")
          : service.escalateTicket("ticket", "actor", "reason", "customer"),
      ).rejects.toThrow();
      expect(tickets.save).not.toHaveBeenCalled();
    },
  );
  it.each(["assign", "escalate"])("rejects disabled support role for %s", async(action)=>{
    users.findOne.mockResolvedValue({id:"support",tenantId:"ta",isActive:true,roleEntity:{name:"support_agent",tenantId:"ta",isActive:false},userRoles:[]});
    await expect(action === "assign" ? service.assignTo("ticket","support","actor") : service.escalateTicket("ticket","actor","reason","support")).rejects.toThrow();
    expect(tickets.save).not.toHaveBeenCalled();
  });
  it.each(["assign", "escalate"])(
    "accepts active same-tenant support target for %s",
    async (action) => {
      users.findOne.mockResolvedValue({
        id: "support",
        tenantId: "ta",
        isActive: true,
        roleEntity: { name: "support_agent", tenantId: "ta", isActive: true },
        userRoles: [],
      });
      await (action === "assign"
        ? service.assignTo("ticket", "support", "actor")
        : service.escalateTicket("ticket", "actor", "reason", "support"));
      expect(tickets.save).toHaveBeenCalledWith(
        expect.objectContaining({ assignedToId: "support" }),
      );
    },
  );
  it("preserves tenant on split ticket and all messages; scopes moved rows and reloads", async () => {
    await service.splitTicket(
      "ticket",
      {
        newTicketSubject: "New subject",
        newTicketDescription: "Detailed description",
        newTicketPriority: "LOW",
        messageIds: ["message"],
      },
      "actor",
    );
    expect(tickets.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "ta" }),
    );
    for (const [message] of messages.create.mock.calls)
      expect(message.tenantId).toBe("ta");
    expect(messages.update).toHaveBeenCalledWith(
      { id: In(["message"]), ticketId: "ticket", tenantId: "ta" },
      { ticketId: "new-ticket" },
    );
    for (const [query] of tickets.findOne.mock.calls)
      expect(query.where.tenantId).toBe("ta");
  });
});
