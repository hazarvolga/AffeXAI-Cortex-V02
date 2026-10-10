jest.mock("@nestjs/mapped-types", () => ({
  PartialType: require("@nestjs/swagger").PartialType,
}));
import { TicketAutomationService } from "./ticket-automation.service";
import { Ticket } from "../entities/ticket.entity";
import { TicketMessage } from "../entities/ticket-message.entity";
import { TicketEscalationRule } from "../entities/ticket-escalation-rule.entity";
import { User } from "../../users/entities/user.entity";
import { TenantService } from "../../../core/tenant/tenant.service";

describe("automatic escalation atomic system actor boundary", () => {
  const tenants = new TenantService();
  let ticket: Record<string, unknown>;
  let rule: Record<string, unknown>;
  let recipient: Record<string, unknown>;
  const writes: unknown[] = [];
  const manager = {
    queryRunner: { isTransactionActive: true },
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((_entity, value) => value),
    save: jest.fn(async (_entity, value) => {
      writes.push(value);
      return value;
    }),
    update: jest.fn(async (_entity, _where, value) => {
      writes.push(value);
      return { affected: 1 };
    }),
  };
  const transaction = jest.fn(async (callback) => {
    const before = [...writes];
    try {
      return await callback(manager);
    } catch (error) {
      writes.splice(0, writes.length, ...before);
      throw error;
    }
  });
  const reached = jest.fn(() => false);
  const notification = jest.fn(async (_data, tx) => {
    expect(tx).toBe(manager);
  });
  const service = Object.assign(
    Object.create(TicketAutomationService.prototype),
    {
      tenantService: tenants,
      ticketRepository: { manager: { transaction } },
      messageRepository: manager,
      escalationRulesService: { hasReachedMaxApplications: reached },
      notificationsService: { createNotification: notification },
      logger: { log: jest.fn(), error: jest.fn() },
    },
  ) as TicketAutomationService;
  const apply = () =>
    tenants.runWithTenant({ tenantId: "tenant-a", source: "system" }, () =>
      service["applyEscalationActions"](
        ticket as unknown as Ticket,
        rule as unknown as TicketEscalationRule,
      ),
    );
  beforeEach(() => {
    jest.clearAllMocks();
    reached.mockReturnValue(false);
    writes.length = 0;
    notification.mockResolvedValue(undefined);
    ticket = {
      id: "ticket-a",
      tenantId: "tenant-a",
      createdAt: new Date(),
      updatedAt: new Date(),
      escalationLevel: 0,
      escalationHistory: [],
    };
    rule = {
      id: "rule-a",
      tenantId: "tenant-a",
      isActive: true,
      name: "Rule",
      actions: {
        addNote: "Automatic support escalation",
        notifySupervisors: true,
        assignToId: "agent-a",
      },
      shouldTrigger: () => true,
    };
    recipient = {
      id: "agent-a",
      tenantId: "tenant-a",
      isActive: true,
      roleEntity: {
        name: "support_manager",
        tenantId: "tenant-a",
        isActive: true,
      },
    };
    manager.findOne.mockImplementation(async (entity) =>
      entity === Ticket
        ? ticket
        : entity === TicketEscalationRule
          ? rule
          : recipient,
    );
    manager.find.mockResolvedValue([recipient]);
  });
  it("writes internal system note with explicit tenant and null author in same transaction as escalation and notification", async () => {
    await apply();
    expect(manager.save).toHaveBeenCalledWith(
      TicketMessage,
      expect.objectContaining({
        authorId: null,
        tenantId: "tenant-a",
        isInternal: true,
        metadata: {
          actorType: "system",
          action: "ticket.escalation",
          ruleId: "rule-a",
        },
      }),
    );
    expect(manager.update).toHaveBeenCalledWith(
      Ticket,
      { id: "ticket-a", tenantId: "tenant-a" },
      expect.objectContaining({ escalationLevel: 1, assignedToId: "agent-a" }),
    );
    expect(notification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "agent-a", type: "ticket_escalated" }),
      manager,
    );
    expect(ticket.escalationLevel).toBe(0);
  });
  it("rejects missing system context before writes", async () => {
    await expect(
      service["applyEscalationActions"](
        ticket as unknown as Ticket,
        rule as unknown as TicketEscalationRule,
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(transaction).not.toHaveBeenCalled();
  });
  it("rejects a foreign or nonstaff assignee before writes", async () => {
    recipient = {
      ...recipient,
      roleEntity: { name: "customer", tenantId: "tenant-a" },
    };
    await expect(apply()).rejects.toMatchObject({ status: 400 });
    expect(writes).toEqual([]);
  });
  it("rolls back the complete operation when notification persistence fails", async () => {
    notification.mockRejectedValueOnce(
      new Error("fixture persistence failure"),
    );
    await expect(apply()).rejects.toThrow("fixture persistence failure");
    expect(writes).toEqual([]);
  });
  it("does not reapply an inactive or missing fresh rule", async () => {
    manager.findOne.mockImplementation(async (entity) =>
      entity === Ticket ? ticket : null,
    );
    await apply();
    expect(writes).toEqual([]);
    expect(notification).not.toHaveBeenCalled();
  });
  it("rejects unsupported action fields instead of claiming success", async () => {
    rule = { ...rule, actions: { sendExternalEmail: true } };
    await expect(apply()).rejects.toMatchObject({ status: 400 });
    expect(writes).toEqual([]);
  });
  it.each([
    { setPriority: "invalid" },
    { addNote: "" },
    { addNote: 4 },
    { notifySupervisors: "yes" },
    { increaseEscalationLevel: "yes" },
    { assignToId: 7 },
    [],
  ])("validates stored rule action values %j", async (actions) => {
    rule = { ...rule, actions };
    await expect(apply()).rejects.toMatchObject({ status: 400 });
    expect(writes).toEqual([]);
  });
  it("rechecks maximum applications and conditions after the lock", async () => {
    reached.mockReturnValue(true);
    await apply();
    expect(writes).toEqual([]);
    reached.mockReturnValue(false);
    rule = { ...rule, shouldTrigger: () => false };
    await apply();
    expect(writes).toEqual([]);
  });
  it("does not write if ticket disappeared", async () => {
    manager.findOne.mockImplementation(async (entity) =>
      entity === Ticket ? null : rule,
    );
    await apply();
    expect(writes).toEqual([]);
  });
  it("fails before partial success if supervisor audience is empty", async () => {
    manager.find.mockResolvedValueOnce([]);
    await expect(apply()).rejects.toMatchObject({ status: 400 });
    expect(writes).toEqual([]);
  });
  it("supports priority-only action without note, assignment or notification", async () => {
    rule = {
      ...rule,
      actions: { setPriority: "high", increaseEscalationLevel: false },
    };
    await apply();
    expect(manager.update).toHaveBeenCalledWith(
      Ticket,
      expect.anything(),
      expect.objectContaining({ priority: "high", escalationLevel: 0 }),
    );
    expect(manager.save).not.toHaveBeenCalled();
    expect(notification).not.toHaveBeenCalled();
  });
  it("accepts current same-tenant role assignment relation and rejects foreign-role provenance", async () => {
    recipient = {
      ...recipient,
      roleEntity: undefined,
      userRoles: [
        {
          role: {
            name: "support_manager",
            tenantId: "tenant-a",
            isActive: true,
          },
        },
      ],
    };
    await apply();
    expect(notification).toHaveBeenCalledTimes(1);
    writes.length = 0;
    recipient = {
      ...recipient,
      userRoles: [{ role: { name: "support_manager", tenantId: "tenant-b" } }],
    };
    await expect(apply()).rejects.toMatchObject({ status: 400 });
    expect(writes).toEqual([]);
  });

  it("rejects a disabled staff role before assigning or notifying", async () => {
    recipient = {
      ...recipient,
      roleEntity: {
        name: "support_manager",
        tenantId: "tenant-a",
        isActive: false,
      },
    };
    await expect(apply()).rejects.toMatchObject({ status: 400 });
    expect(writes).toEqual([]);
  });
});
