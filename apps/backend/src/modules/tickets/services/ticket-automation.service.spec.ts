import { NotificationsService } from "../../notifications/notifications.service";
jest.mock("@nestjs/mapped-types", () => ({
  PartialType: require("@nestjs/swagger").PartialType,
}));
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { TicketAutomationService } from "./ticket-automation.service";
import { TicketsService } from "../tickets.service";
import { TicketEscalationRulesService } from "./ticket-escalation-rules.service";
import { Ticket } from "../entities/ticket.entity";
import { TicketMessage } from "../entities/ticket-message.entity";
import { Organization } from "../../organizations/entities/organization.entity";
import { TenantService } from "../../../core/tenant/tenant.service";
import { TicketStatus } from "../enums/ticket-status.enum";

describe("TicketAutomationService current tenant cron contract", () => {
  const tenants = new TenantService();
  let service: TicketAutomationService;
  const findAll = jest.fn();
  const updateStatus = jest.fn();
  const ticketRepo = { save: jest.fn() };
  const messageRepo = { create: jest.fn(), save: jest.fn() };
  const organizations = {
    find: jest.fn(async () => [
      { id: "organization-a", slug: "tenant-a", name: "A" },
      { id: "organization-b", slug: "tenant-b", name: "B" },
    ]),
  };
  const rules = {
    getActiveRules: jest.fn(),
    hasReachedMaxApplications: jest.fn(),
  };
  const oldTicket = () => ({
    id: "ticket-a",
    tenantId: "tenant-a",
    status: TicketStatus.RESOLVED,
    updatedAt: new Date(Date.now() - 73 * 3600000),
    createdAt: new Date(Date.now() - 96 * 3600000),
    escalationLevel: 0,
  });
  beforeEach(async () => {
    jest.clearAllMocks();
    findAll.mockReset();
    updateStatus.mockReset();
    findAll.mockImplementation(async () =>
      tenants.getTenantId() === "tenant-a" ? [oldTicket()] : [],
    );
    rules.getActiveRules.mockResolvedValue([]);
    rules.hasReachedMaxApplications.mockReturnValue(false);
    const module = await Test.createTestingModule({
      providers: [
        TicketAutomationService,
        { provide: NotificationsService, useValue: {} },
        { provide: TicketsService, useValue: { findAll, updateStatus } },
        { provide: TicketEscalationRulesService, useValue: rules },
        { provide: TenantService, useValue: tenants },
        { provide: getRepositoryToken(Ticket), useValue: ticketRepo },
        { provide: getRepositoryToken(TicketMessage), useValue: messageRepo },
        { provide: getRepositoryToken(Organization), useValue: organizations },
      ],
    }).compile();
    service = module.get(TicketAutomationService);
  });
  it("auto-closes resolved tickets after72hours with an explicit system tenant and nullable actor", async () => {
    updateStatus.mockImplementation(async (id, status, actor) => {
      expect(tenants.getTenantContext()).toMatchObject({
        tenantId: "tenant-a",
        source: "system",
      });
      expect([id, status, actor]).toEqual([
        "ticket-a",
        TicketStatus.CLOSED,
        null,
      ]);
    });
    await service.checkForAutoClose();
    expect(updateStatus).toHaveBeenCalledTimes(1);
    expect(findAll).toHaveBeenCalledWith({ status: TicketStatus.RESOLVED });
    expect(tenants.getTenantId()).toBeUndefined();
  });
  it("does not auto-close recent resolved tickets", async () => {
    findAll.mockResolvedValue([{ ...oldTicket(), updatedAt: new Date() }]);
    await service.checkForAutoClose();
    expect(updateStatus).not.toHaveBeenCalled();
  });
  it("moves overdue pending-third-party tickets back to open", async () => {
    await service.checkForPendingThirdPartyTransition();
    expect(findAll).toHaveBeenCalledWith({
      status: TicketStatus.PENDING_THIRD_PARTY,
    });
    expect(updateStatus).toHaveBeenCalledWith(
      "ticket-a",
      TicketStatus.OPEN,
      null,
    );
  });
  it("does not transition recent third-party tickets", async () => {
    findAll.mockResolvedValue([{ ...oldTicket(), updatedAt: new Date() }]);
    await service.checkForPendingThirdPartyTransition();
    expect(updateStatus).not.toHaveBeenCalled();
  });
  it("applies matching escalation rule once per ticket", async () => {
    rules.getActiveRules.mockResolvedValue([
      {
        id: "rule-a",
        tenantId: "tenant-a",
        name: "Escalate",
        actions: {},
        shouldTrigger: () => true,
      },
    ]);
    const apply = jest.fn(async () => undefined);
    Object.assign(service, { applyEscalationActions: apply });
    await service.checkForEscalation();
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ticket-a" }),
      expect.objectContaining({ id: "rule-a" }),
    );
  });
  it("does not escalate if no rules match", async () => {
    await service.checkForEscalation();
    expect(ticketRepo.save).not.toHaveBeenCalled();
  });
  it("honors maximum rule applications", async () => {
    rules.getActiveRules.mockResolvedValue([
      { id: "rule-a", actions: {}, shouldTrigger: () => true },
    ]);
    rules.hasReachedMaxApplications.mockReturnValue(true);
    await service.checkForEscalation();
    expect(ticketRepo.save).not.toHaveBeenCalled();
  });
  it("calculates elapsed hours independently of cron persistence", () => {
    expect(
      service["getHoursSinceDate"](new Date(0), new Date(5 * 3600000)),
    ).toBe(5);
  });
  it.each([
    "checkForAutoClose",
    "checkForPendingThirdPartyTransition",
    "checkForEscalation",
  ] as const)(
    "handles organization-store outage without executing %s writes",
    async (method) => {
      organizations.find.mockRejectedValueOnce(
        new Error("fixture organization outage"),
      );
      await service[method]();
      expect(updateStatus).not.toHaveBeenCalled();
      expect(ticketRepo.save).not.toHaveBeenCalled();
    },
  );
});
