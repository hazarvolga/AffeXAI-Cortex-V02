import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { TenantService } from "../../../core/tenant/tenant.service";
import {
  AutomationExecution,
  ExecutionStatus,
} from "../entities/automation-execution.entity";
import { AutomationTrigger } from "../entities/automation-trigger.entity";
import {
  AutomationStatus,
  EmailAutomation,
} from "../entities/email-automation.entity";
import { Subscriber } from "../entities/subscriber.entity";
import { AutomationService } from "./automation.service";
import { TriggerEvaluatorService } from "./trigger-evaluator.service";

const TENANT = "tenant-a";

const steps = [
  {
    id: "s1",
    type: "send_email",
    config: { subject: "Welcome" },
    nextStepId: "s2",
  },
  { id: "s2", type: "delay", config: { duration: 60 }, nextStepId: "s3" },
  { id: "s3", type: "exit", config: {} },
];

function automation(overrides: Partial<EmailAutomation> = {}): EmailAutomation {
  return Object.assign(new EmailAutomation(), {
    id: "a1",
    name: "Welcome",
    tenantId: TENANT,
    status: AutomationStatus.DRAFT,
    isActive: false,
    workflowSteps: steps,
    triggerType: "subscriber_added",
    subscriberCount: 5,
    ...overrides,
  });
}

function queryBuilder<T>(rows: T[]) {
  const qb: Record<string, jest.Mock> = {};
  for (const method of [
    "leftJoinAndSelect",
    "where",
    "andWhere",
    "orderBy",
    "skip",
    "take",
  ]) {
    qb[method] = jest.fn(() => qb);
  }
  qb.getCount = jest.fn(async () => rows.length);
  qb.getMany = jest.fn(async () => rows);
  return qb;
}

function setup(stored: EmailAutomation | null = automation()) {
  const automations = {
    create: jest.fn((value) => Object.assign(new EmailAutomation(), value)),
    save: jest.fn(async (value) => ({ id: "a1", ...value })),
    find: jest.fn(async () => []),
    findOne: jest.fn(async () => stored),
    softRemove: jest.fn(async () => undefined),
  };
  const executionQb = queryBuilder<Partial<AutomationExecution>>([]);
  const executions = {
    createQueryBuilder: jest.fn(() => executionQb),
    update: jest.fn(async () => ({ affected: 2 })),
    count: jest.fn(async () => 1),
    create: jest.fn((value) => ({ id: "e1", ...value })),
    save: jest.fn(async (value) => value),
  };
  const triggers = {
    findOne: jest.fn(async () => null),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
  };
  const subscribers = {
    findOne: jest.fn(async () => ({ id: "sub-1", email: "ada@example.com" })),
    find: jest.fn(async () => [{ id: "sub-1" }, { id: "sub-2" }]),
  };
  const service = new AutomationService(
    automations as unknown as Repository<EmailAutomation>,
    executions as unknown as Repository<AutomationExecution>,
    triggers as unknown as Repository<AutomationTrigger>,
    subscribers as unknown as Repository<Subscriber>,
    {} as TriggerEvaluatorService,
    { getTenantId: () => TENANT } as unknown as TenantService,
  );
  return {
    service,
    automations,
    executions,
    executionQb,
    triggers,
    subscribers,
  };
}

const dto = (workflowSteps: unknown[]) =>
  ({
    name: "Welcome",
    triggerType: "subscriber_added",
    triggerConfig: {},
    workflowSteps,
  }) as never;

describe("AutomationService", () => {
  it("creates an inactive automation in the tenant", async () => {
    const { service, automations } = setup();
    await service.create(dto(steps), TENANT);
    expect(automations.create).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false, tenantId: TENANT }),
    );
  });

  it.each([
    ["no steps", []],
    ["duplicate ids", [steps[2], steps[2]]],
    [
      "dangling next step",
      [{ id: "x", type: "exit", config: {}, nextStepId: "missing" }],
    ],
    [
      "email without template or subject",
      [{ id: "x", type: "send_email", config: {} }],
    ],
    [
      "delay without numeric duration",
      [{ id: "x", type: "delay", config: { duration: "1h" } }],
    ],
    [
      "split with one path",
      [
        {
          id: "x",
          type: "split",
          config: {},
          conditionalPaths: [{ nextStepId: "x" }],
        },
      ],
    ],
    ["unknown step type", [{ id: "x", type: "webhook", config: {} }]],
  ])("rejects a workflow with %s", async (_label, workflow) => {
    const { service, automations } = setup();
    await expect(service.create(dto(workflow), TENANT)).rejects.toThrow(
      BadRequestException,
    );
    expect(automations.save).not.toHaveBeenCalled();
  });

  it("looks automations up inside the tenant", async () => {
    const { service, automations } = setup(null);
    await expect(service.findOne("a1", TENANT)).rejects.toThrow(
      NotFoundException,
    );
    expect(automations.findOne).toHaveBeenCalledWith({
      where: { id: "a1", tenantId: TENANT },
      relations: ["segment"],
    });
  });

  it("refuses to change the workflow of an active automation or delete it", async () => {
    const { service } = setup(
      automation({ status: AutomationStatus.ACTIVE, isActive: true }),
    );
    await expect(
      service.update("a1", { workflowSteps: steps } as never, TENANT),
    ).rejects.toThrow(BadRequestException);
    await expect(service.remove("a1", TENANT)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("activates a draft and registers existing active subscribers once", async () => {
    const { service, triggers, subscribers } = setup();
    const result = await service.activate("a1", TENANT, true);
    expect(result).toMatchObject({
      status: AutomationStatus.ACTIVE,
      isActive: true,
    });
    expect(subscribers.find).toHaveBeenCalledWith({
      where: { status: "active", tenantId: TENANT },
    });
    expect(triggers.save).toHaveBeenCalledTimes(2);
  });

  it("pauses and cancels pending executions of the tenant", async () => {
    const { service, executions } = setup(
      automation({ status: AutomationStatus.ACTIVE, isActive: true }),
    );
    await expect(service.pause("a1", TENANT, true)).resolves.toMatchObject({
      status: AutomationStatus.PAUSED,
    });
    expect(executions.update).toHaveBeenCalledWith(
      expect.objectContaining({ automationId: "a1", tenantId: TENANT }),
      { status: ExecutionStatus.CANCELLED },
    );
  });

  it("scopes analytics to the tenant and computes rates", async () => {
    const { service, executionQb, executions } = setup();
    const day = new Date("2026-10-15T10:00:00Z");
    executionQb.getMany.mockResolvedValueOnce([
      {
        status: ExecutionStatus.COMPLETED,
        executionTime: 100,
        createdAt: day,
        stepResults: [{ stepId: "s1", status: "completed", executionTime: 40 }],
      },
      {
        status: ExecutionStatus.FAILED,
        executionTime: 300,
        createdAt: day,
        stepResults: [{ stepId: "s1", status: "failed", executionTime: 60 }],
      },
    ]);
    const analytics = await service.getAnalytics("a1", TENANT);
    expect(executionQb.andWhere).toHaveBeenCalledWith(
      "execution.tenantId = :tenantId",
      { tenantId: TENANT },
    );
    expect(executions.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ automationId: "a1", tenantId: TENANT }),
    });
    expect(analytics).toMatchObject({
      totalExecutions: 2,
      successRate: 50,
      avgExecutionTime: 200,
    });
    expect(analytics.stepPerformance[0]).toMatchObject({
      stepId: "s1",
      totalExecutions: 2,
      avgExecutionTime: 50,
    });
    expect(analytics.timeline).toEqual([
      { date: "2026-10-15", executions: 2, completed: 1, failed: 1 },
    ]);
  });

  it("paginates executions inside the tenant", async () => {
    const { service, executionQb } = setup();
    const page = await service.getExecutions(
      { page: 2, limit: 10 } as never,
      TENANT,
    );
    expect(executionQb.andWhere).toHaveBeenCalledWith(
      "execution.tenantId = :tenantId",
      { tenantId: TENANT },
    );
    expect(executionQb.skip).toHaveBeenCalledWith(10);
    expect(page).toMatchObject({ page: 2, limit: 10, total: 0, totalPages: 0 });
  });

  it("simulates a dry run and ties a real test execution to the subscriber", async () => {
    const { service, executions } = setup();
    const dry = await service.test("a1", "sub-1", TENANT);
    expect(dry.steps.map((step: { status: string }) => step.status)).toEqual([
      "simulated",
      "simulated",
      "simulated",
    ]);
    expect(executions.save).not.toHaveBeenCalled();
    await service.test("a1", "sub-1", TENANT, false);
    expect(executions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: "a1",
        subscriberId: "sub-1",
        tenantId: TENANT,
        status: ExecutionStatus.PENDING,
      }),
    );
  });
});
