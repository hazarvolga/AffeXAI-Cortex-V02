import { TicketsService } from "./tickets.service";
import { Ticket } from "./entities/ticket.entity";
import { TicketMessage } from "./entities/ticket-message.entity";
import { TicketCategory } from "./entities/ticket-category.entity";
import { TicketAuditLog } from "./entities/ticket-audit-log.entity";
import { TicketAttachmentEntity } from "./entities/ticket-attachment.entity";
import { In } from "typeorm";

describe("Atomic tenant-bound ticket restructuring", () => {
  let service: TicketsService;
  let active: boolean;
  let failAudit: boolean;
  let tickets: Record<string, unknown>[];
  let messages: Record<string, unknown>[];
  const find = jest.fn();
  const findOne = jest.fn();
  const category = jest.fn();
  const saveTicket = jest.fn(async (row) => {
    expect(active).toBe(true);
    tickets.push(row);
    return row;
  });
  const saveMessage = jest.fn(async (row) => {
    expect(active).toBe(true);
    messages.push(row);
    return row;
  });
  const updateMessage = jest.fn(async () => ({ affected: 1 }));
  const audit = jest.fn(async () => {
    if (failAudit) throw new Error("audit rollback");
  });
  const ticketRepo = {
    find,
    findOne,
    findOneOrFail: findOne,
    save: saveTicket,
    create: (row: object) => ({ id: "new", ...row }),
  };
  const messageRepo = {
    find: jest.fn(),
    create: (row: object) => row,
    save: saveMessage,
    update: updateMessage,
  };
  const manager = {
    getRepository: (entity: unknown) =>
      entity === Ticket
        ? ticketRepo
        : entity === TicketMessage
          ? messageRepo
          : entity === TicketCategory
            ? { findOne: category }
            : entity === TicketAttachmentEntity
              ? { update: jest.fn() }
              : { save: audit },
  };
  const transaction = jest.fn(async (callback) => {
    const before = [...tickets];
    const previous = [...messages];
    active = true;
    try {
      return await callback(manager);
    } catch (error) {
      tickets = before;
      messages = previous;
      throw error;
    } finally {
      active = false;
    }
  });
  const split = () =>
    service.splitTicket(
      "source",
      {
        newTicketSubject: "subject",
        newTicketDescription: "description",
        newTicketPriority: "LOW",
        newTicketCategoryId: "category",
        messageIds: ["m1"],
      },
      "actor",
    );
  beforeEach(() => {
    jest.clearAllMocks();
    active = false;
    failAudit = false;
    tickets = [];
    messages = [];
    findOne.mockResolvedValue({
      id: "source",
      tenantId: "ta",
      userId: "owner",
      status: "open",
      subject: "source",
    });
    find.mockResolvedValue([
      { id: "source", tenantId: "ta", userId: "owner", status: "open" },
    ]);
    category.mockResolvedValue({ id: "category", tenantId: "ta" });
    messageRepo.find.mockResolvedValue([{ id: "m1" }]);
    updateMessage.mockResolvedValue({ affected: 1 });
    service = Object.assign(Object.create(TicketsService.prototype), {
      tenantService: {
        getTenantContext: () => ({ tenantId: "ta", source: "authenticated" }),
      },
      ticketRepository: { ...ticketRepo, manager: { transaction } },
      messageRepository: messageRepo,
      categoryRepository: { findOne: category },
      auditLogRepository: { save: audit },
      slaService: { calculateSLADueDates: () => ({}) },
      generateDisplayNumber: async () => "SUP-00001",
      logger: { log: jest.fn(), error: jest.fn() },
    });
  });
  it.each(["merge", "split"])(
    "rolls all %s writes back when audit fails",
    async (action) => {
      failAudit = true;
      await expect(
        action === "merge"
          ? service.mergeTickets(["source"], "target", "actor")
          : split(),
      ).rejects.toThrow("audit rollback");
      expect(transaction).toHaveBeenCalledTimes(1);
      expect(tickets).toEqual([]);
      expect(messages).toEqual([]);
    },
  );
  it("rejects merging another customer conversation into target", async () => {
    find.mockResolvedValue([
      { id: "source", tenantId: "ta", userId: "foreign-customer" },
    ]);
    await expect(
      service.mergeTickets(["source"], "target", "actor"),
    ).rejects.toThrow();
    expect(saveMessage).not.toHaveBeenCalled();
  });
  it("rejects foreign category before any split write", async () => {
    category.mockResolvedValue(null);
    await expect(split()).rejects.toThrow();
    expect(saveTicket).not.toHaveBeenCalled();
    expect(saveMessage).not.toHaveBeenCalled();
    expect(category).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "category", tenantId: "ta" }),
      }),
    );
  });
  it("rejects foreign or missing split messages without partial ticket", async () => {
    messageRepo.find.mockResolvedValue([]);
    await expect(split()).rejects.toThrow();
    expect(saveTicket).not.toHaveBeenCalled();
  });
  it("rejects missing merge source rather than silently accepting subset", async () => {
    find.mockResolvedValue([]);
    await expect(
      service.mergeTickets(["source"], "target", "actor"),
    ).rejects.toThrow();
    expect(saveMessage).not.toHaveBeenCalled();
  });
  it("uses active tenant for every merge read, note, and message move", async () => {
    await service.mergeTickets(["source"], "target", "actor");
    for (const [query] of findOne.mock.calls)
      expect(query.where.tenantId).toBe("ta");
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "ta" }),
      }),
    );
    for (const [row] of saveMessage.mock.calls) expect(row.tenantId).toBe("ta");
    expect(updateMessage).toHaveBeenCalledWith(
      { ticketId: "source", tenantId: "ta" },
      { ticketId: "target" },
    );
  });
  it("binds new split ticket and notes to tenant and moves only selected own messages", async () => {
    await split();
    expect(saveTicket).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "ta", displayNumber: "SUP-00001" }),
    );
    expect(updateMessage).toHaveBeenCalledWith(
      { id: In(["m1"]), ticketId: "source", tenantId: "ta" },
      { ticketId: "new" },
    );
    for (const [row] of saveMessage.mock.calls) expect(row.tenantId).toBe("ta");
  });
});
