// Only the constructor needs this type; the real module pulls in most of the app.
jest.mock("../email-campaign.service", () => ({
  EmailCampaignService: class {},
}));

import { UnauthorizedException } from "@nestjs/common";
import { Repository } from "typeorm";
import { TenantService } from "../../../core/tenant/tenant.service";
import { Organization } from "../../organizations/entities/organization.entity";
import { EmailCampaignService } from "../email-campaign.service";
import {
  AutomationExecution,
  ExecutionStatus,
} from "../entities/automation-execution.entity";
import {
  AutomationSchedule,
  ScheduleStatus,
} from "../entities/automation-schedule.entity";
import { EmailAutomation } from "../entities/email-automation.entity";
import { Subscriber } from "../entities/subscriber.entity";
import { WorkflowExecutorService } from "./workflow-executor.service";

const TENANT = "tenant-a";

const welcome = [
  {
    id: "mail-1",
    type: "send_email",
    config: { subject: "Welcome" },
    nextStepId: "wait",
  },
  { id: "wait", type: "delay", config: { duration: 60 }, nextStepId: "mail-2" },
  {
    id: "mail-2",
    type: "send_email",
    config: { subject: "Day two" },
    nextStepId: "done",
  },
  { id: "done", type: "exit", config: {} },
];

function setup(
  workflowSteps: unknown[] = welcome,
  tenant: string | null = TENANT,
) {
  const automation = Object.assign(new EmailAutomation(), {
    id: "a1",
    tenantId: TENANT,
    workflowSteps,
    executionCount: 1,
    successRate: 100,
    avgExecutionTime: 1000,
  });
  const subscriber = {
    id: "sub-1",
    email: "ada@example.com",
    status: "active",
    opens: 3,
  } as unknown as Subscriber;
  const execution = Object.assign(new AutomationExecution(), {
    id: "e1",
    automationId: "a1",
    subscriberId: "sub-1",
    tenantId: TENANT,
    status: ExecutionStatus.PENDING,
    currentStepIndex: 0,
    stepResults: [],
    automation,
    subscriber,
  });
  const executions = {
    findOne: jest.fn(async () => execution),
    save: jest.fn(async (value) => value),
    create: jest.fn((value) => Object.assign(new AutomationExecution(), value)),
  };
  const schedule = Object.assign(new AutomationSchedule(), {
    id: "sch-1",
    automationId: "a1",
    subscriberId: "sub-1",
    tenantId: TENANT,
  });
  const schedules = {
    create: jest.fn((value) => ({ id: "sch-1", ...value })),
    save: jest.fn(async (value) => value),
    findOne: jest.fn(async () => schedule),
  };
  const automations = {
    findOne: jest.fn(async () => automation),
    save: jest.fn(async (value) => value),
  };
  const service = new WorkflowExecutorService(
    automations as unknown as Repository<EmailAutomation>,
    executions as unknown as Repository<AutomationExecution>,
    schedules as unknown as Repository<AutomationSchedule>,
    {
      findOne: jest.fn(async () => subscriber),
    } as unknown as Repository<Subscriber>,
    {} as Repository<Organization>,
    {} as EmailCampaignService,
    { getTenantId: () => tenant } as unknown as TenantService,
  );
  return {
    service,
    automation,
    execution,
    executions,
    schedules,
    schedule,
    automations,
  };
}

const ranSteps = (execution: AutomationExecution) =>
  execution.stepResults.map((result) => result.stepId);

describe("WorkflowExecutorService", () => {
  it("stops at a delay and schedules the rest instead of running it", async () => {
    const { service, execution, schedules, automations } = setup();
    await service.processExecution("e1");
    expect(ranSteps(execution)).toEqual(["mail-1", "wait"]);
    expect(execution.status).toBe(ExecutionStatus.PENDING);
    expect(schedules.save).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: "a1",
        subscriberId: "sub-1",
        status: ScheduleStatus.PENDING,
        tenantId: TENANT,
      }),
    );
    expect(automations.save).not.toHaveBeenCalled();
  });

  it("resumes after the delay without repeating earlier steps", async () => {
    const { service, execution, automation } = setup();
    await service.processExecution("e1");
    await service.resumeExecution("sch-1");
    expect(ranSteps(execution)).toEqual(["mail-1", "wait", "mail-2", "done"]);
    expect(execution.status).toBe(ExecutionStatus.COMPLETED);
    expect(automation.executionCount).toBe(2);
    expect(automation.successRate).toBe(100);
  });

  it("labels automation emails as not delivered", async () => {
    const { service, execution } = setup();
    await service.processExecution("e1");
    expect(execution.stepResults[0].data).toEqual({
      simulated: true,
      recipient: "ada@example.com",
      subject: "Welcome",
      templateId: undefined,
    });
  });

  it("follows the branch a condition selects", async () => {
    const { service, execution } = setup([
      {
        id: "check",
        type: "condition",
        config: { condition: "status equals active" },
        conditionalPaths: [
          { condition: "true", nextStepId: "yes" },
          { condition: "false", nextStepId: "no" },
        ],
      },
      { id: "yes", type: "exit", config: {} },
      { id: "no", type: "exit", config: {} },
    ]);
    await service.processExecution("e1");
    expect(ranSteps(execution)).toEqual(["check", "yes"]);
  });

  it("fails the execution and lowers the success rate when a step fails", async () => {
    const { service, execution, automation } = setup([
      { id: "bad", type: "delay", config: { duration: 0 } },
    ]);
    await service.processExecution("e1");
    expect(execution.status).toBe(ExecutionStatus.FAILED);
    expect(execution.error).toBe("Invalid delay duration");
    expect(automation.successRate).toBe(50);
  });

  it("stops a workflow that loops", async () => {
    const { service, execution } = setup([
      {
        id: "loop",
        type: "condition",
        config: { condition: "status equals active" },
        conditionalPaths: [{ condition: "true", nextStepId: "loop" }],
      },
    ]);
    await service.processExecution("e1");
    expect(execution.status).toBe(ExecutionStatus.FAILED);
    expect(execution.error).toContain("Maximum step limit");
  });

  it("requires a tenant context", async () => {
    await expect(
      setup(welcome, null).service.processExecution("e1"),
    ).rejects.toThrow(UnauthorizedException);
  });
});
