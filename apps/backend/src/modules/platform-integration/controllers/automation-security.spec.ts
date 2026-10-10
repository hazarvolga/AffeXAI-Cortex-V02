import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { PERMISSIONS } from "../../../lib/permissions";
import { AutomationRulesController } from "./automation-rules.controller";
import { ApprovalsController } from "./approvals.controller";
import {
  AutomationActionType,
  AutomationRule,
} from "../entities/automation-rule.entity";
import {
  ActionImpactLevel,
  ApprovalStatus,
} from "../entities/automation-approval.entity";
import { PlatformEventType } from "../entities/platform-event.entity";

describe("automation administration security boundaries", () => {
  const tenantUser = {
    id: "9e95e3eb-6e6f-4e86-a4e0-6ea3cd9fb4d8",
    tenantId: "tenant-a",
    firstName: "Ada",
    lastName: "Admin",
    email: "ada@example.test",
    roleNames: ["organization_owner"],
  } as any;

  it("separates rule management from approval authority", () => {
    expect(
      Reflect.getMetadata("permissions", AutomationRulesController),
    ).toEqual([PERMISSIONS.SETTINGS_MANAGE]);
    expect(Reflect.getMetadata("permissions", ApprovalsController)).toEqual([
      PERMISSIONS.AUTOMATION_APPROVE,
    ]);
  });

  it("allowlists persisted automation rule fields and forces the authenticated tenant", async () => {
    const repository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    } as any;
    const controller = new AutomationRulesController(repository);

    const result = await controller.create(
      {
        name: "Form intake",
        triggerEventType: PlatformEventType.FORM_SUBMITTED,
        triggerConditions: {},
        actions: [
          {
            type: AutomationActionType.TRIGGER_WEBHOOK,
            config: { webhookId: "safe" },
            order: 0,
          },
        ],
        priority: 1,
        requiresApproval: true,
        impactLevel: ActionImpactLevel.MEDIUM,
        authorizedApprovers: [tenantUser.id],
        tenantId: "tenant-b",
        id: "attacker-id",
        executionCount: 9000,
      } as any,
      tenantUser,
    );

    expect(result).toMatchObject({ tenantId: "tenant-a", name: "Form intake" });
    expect(result).not.toHaveProperty("id");
    expect(result).not.toHaveProperty("executionCount");
  });

  it("rejects unsafe nested rule input before persistence", async () => {
    const repository = { create: jest.fn(), save: jest.fn() } as any;
    const controller = new AutomationRulesController(repository);
    expect(() =>
      controller.create(
        {
          name: "Unsafe",
          triggerEventType: PlatformEventType.FORM_SUBMITTED,
          actions: [
            {
              type: AutomationActionType.TRIGGER_WEBHOOK,
              config: JSON.parse('{"__proto__":{"polluted":true}}'),
              order: 0,
            },
          ],
        } as any,
        tenantUser,
      ),
    ).toThrow(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("rejects email.send until the provider supports crash-safe idempotency", () => {
    const repository = { create: jest.fn(), save: jest.fn() } as any;
    const controller = new AutomationRulesController(repository);

    expect(() =>
      controller.create(
        {
          name: "Unsafe bulk send",
          triggerEventType: PlatformEventType.FORM_SUBMITTED,
          actions: [
            {
              type: AutomationActionType.SEND_EMAIL,
              config: { campaignId: "campaign-1" },
              order: 0,
            },
          ],
        } as any,
        tenantUser,
      ),
    ).toThrow("email.send is unavailable until crash-safe idempotency is enabled");
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("requires approval and rejects low-impact or auto-approval policies", () => {
    const repository = { create: jest.fn(), save: jest.fn() } as any;
    const controller = new AutomationRulesController(repository);
    const base = {
      name: "Governed webhook",
      triggerEventType: PlatformEventType.FORM_SUBMITTED,
      actions: [{
        type: AutomationActionType.TRIGGER_WEBHOOK,
        config: { webhookId: "safe" },
        order: 0,
      }],
    };

    expect(() => controller.create({ ...base, requiresApproval: false } as any, tenantUser))
      .toThrow("requires approval");
    expect(() => controller.create({
      ...base,
      requiresApproval: true,
      impactLevel: ActionImpactLevel.LOW,
    } as any, tenantUser)).toThrow("medium impact");
    expect(() => controller.create({
      ...base,
      requiresApproval: true,
      impactLevel: ActionImpactLevel.CRITICAL,
    } as any, tenantUser)).toThrow("Critical automation");
    expect(() => controller.create({
      ...base,
      requiresApproval: true,
      autoApprovalConditions: { eventSource: "admin" },
    } as any, tenantUser)).toThrow("Auto-approval");
    expect(repository.save).not.toHaveBeenCalled();
  });

  function approvalFixture() {
    return {
      id: "approval-1",
      tenantId: "tenant-a",
      status: ApprovalStatus.PENDING,
      isExpired: false,
      isExecuted: false,
      currentApprovals: 0,
      requiredApprovals: 1,
      approvalChain: [],
      rule: { authorizedApprovers: [tenantUser.id] },
      requestContext: { authorizedApprovers: [tenantUser.id] },
      canApprove: () => true,
      addApproval: jest.fn(function (
        this: any,
        userId,
        userName,
        action,
        comment,
      ) {
        this.approvalChain = [
          ...this.approvalChain,
          { userId, userName, action, comment },
        ];
        this.currentApprovals += 1;
        this.status = ApprovalStatus.APPROVED;
      }),
    } as any;
  }

  function approvalController(approval: any) {
    const transactionalRepository = {
      findOne: jest.fn(async (_options?: unknown) => approval),
      save: jest.fn(async (value) => value),
    };
    const ruleRepository = {
      findOne: jest.fn(async (_options?: unknown) => approval.rule),
    };
    const dataSource = {
      transaction: jest.fn(async (callback) =>
        callback({
          getRepository: (entity) =>
            entity === AutomationRule
              ? ruleRepository
              : transactionalRepository,
        }),
      ),
    } as unknown as DataSource;
    const repository = {} as any;
    const executor = { executeApprovedAutomation: jest.fn() } as any;
    return {
      controller: new ApprovalsController(repository, executor, dataSource),
      transactionalRepository,
      executor,
    };
  }

  it("uses the authenticated actor and executes only after the locked transaction commits", async () => {
    const approval = approvalFixture();
    const { controller, transactionalRepository, executor } =
      approvalController(approval);
    await controller.approve(
      "approval-1",
      {
        userId: "spoofed-user",
        userName: "Spoofed Name",
        comment: "Reviewed",
      } as any,
      tenantUser,
    );

    expect(transactionalRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        lock: { mode: "pessimistic_write" },
        where: { id: "approval-1", tenantId: "tenant-a" },
      }),
    );
    expect(transactionalRepository.findOne.mock.calls[0][0]).not.toHaveProperty(
      "relations",
    );
    expect(approval.addApproval).toHaveBeenCalledWith(
      tenantUser.id,
      "Ada Admin",
      "approved",
      "Reviewed",
      undefined,
    );
    expect(executor.executeApprovedAutomation).toHaveBeenCalledWith(
      "approval-1",
      "tenant-a",
    );
  });

  it("enforces the rule approver allowlist and prevents duplicate votes", async () => {
    const unauthorized = approvalFixture();
    unauthorized.requestContext.authorizedApprovers = ["someone-else"];
    const first = approvalController(unauthorized);
    await expect(
      first.controller.approve("approval-1", {}, tenantUser),
    ).rejects.toBeInstanceOf(ForbiddenException);

    const duplicate = approvalFixture();
    duplicate.approvalChain = [{ userId: tenantUser.id, action: "approved" }];
    const second = approvalController(duplicate);
    await expect(
      second.controller.approve("approval-1", {}, tenantUser),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("uses the snapshotted approver policy when the current rule changes", async () => {
    const approval = approvalFixture();
    approval.requestContext.authorizedApprovers = [tenantUser.id];
    approval.rule.authorizedApprovers = ["attacker-added-after-request"];
    const { controller, executor } = approvalController(approval);

    await controller.approve("approval-1", {}, tenantUser);

    expect(executor.executeApprovedAutomation).toHaveBeenCalledWith(
      "approval-1",
      "tenant-a",
    );
  });

  it("prevents the event requester from approving their own automation", async () => {
    const selfRequested = approvalFixture();
    selfRequested.requestedBy = tenantUser.id;
    const { controller, executor } = approvalController(selfRequested);

    await expect(controller.approve("approval-1", {}, tenantUser))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(executor.executeApprovedAutomation).not.toHaveBeenCalled();
  });

  it("rejects delegated tenant admins even if they hold automation.approve", async () => {
    const approval = approvalFixture();
    const delegatedAdmin = {
      ...tenantUser,
      id: "5bc6d465-51b7-47d1-a08a-7a47d48edba1",
      roleNames: ["organization_admin"],
    };
    const { controller, executor } = approvalController(approval);

    await expect(controller.approve("approval-1", {}, delegatedAdmin as any))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(executor.executeApprovedAutomation).not.toHaveBeenCalled();
  });

  it("rejects an expired pending approval even when its stored expiry flag is stale", async () => {
    const expired = approvalFixture();
    expired.expiresAt = new Date(Date.now() - 1_000);
    expired.isExpired = false;
    const { controller, executor } = approvalController(expired);

    await expect(
      controller.approve("approval-1", {}, tenantUser),
    ).rejects.toThrow("Approval has expired");
    expect(expired.addApproval).not.toHaveBeenCalled();
    expect(executor.executeApprovedAutomation).not.toHaveBeenCalled();
  });

  it("allows idempotent execution retry after an approved request failed to execute", async () => {
    const approved = approvalFixture();
    approved.status = ApprovalStatus.APPROVED;
    approved.isExecuted = false;
    approved.expiresAt = new Date(Date.now() - 86_400_000);
    approved.approvalChain = [{ userId: tenantUser.id, action: "approved" }];
    const { controller, transactionalRepository, executor } =
      approvalController(approved);

    await controller.approve("approval-1", {}, tenantUser);

    expect(transactionalRepository.save).not.toHaveBeenCalled();
    expect(approved.addApproval).not.toHaveBeenCalled();
    expect(executor.executeApprovedAutomation).toHaveBeenCalledWith(
      "approval-1",
      "tenant-a",
    );
  });
});
