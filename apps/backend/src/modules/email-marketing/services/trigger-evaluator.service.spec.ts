import { UnauthorizedException } from "@nestjs/common";
import { Repository } from "typeorm";
import { TenantService } from "../../../core/tenant/tenant.service";
import { Organization } from "../../organizations/entities/organization.entity";
import {
  AutomationTrigger,
  TriggerStatus,
} from "../entities/automation-trigger.entity";
import {
  AutomationStatus,
  EmailAutomation,
  TriggerType,
} from "../entities/email-automation.entity";
import { Segment } from "../entities/segment.entity";
import { Subscriber } from "../entities/subscriber.entity";
import { AutomationQueueService } from "./automation-queue.service";
import {
  TriggerEvaluatorService,
  TriggerEvent,
} from "./trigger-evaluator.service";

const TENANT = "tenant-a";

function automation(
  triggerType: TriggerType,
  triggerConfig: object,
  overrides: Partial<EmailAutomation> = {},
) {
  return {
    id: "a1",
    tenantId: TENANT,
    status: AutomationStatus.ACTIVE,
    isActive: true,
    triggerType,
    triggerConfig,
    ...overrides,
  } as unknown as EmailAutomation;
}

function queryBuilder(rows: unknown[]) {
  const qb: Record<string, jest.Mock> = {};
  for (const method of ["where", "andWhere", "leftJoin"])
    qb[method] = jest.fn(() => qb);
  qb.getMany = jest.fn(async () => rows);
  return qb;
}

function setup(
  options: {
    tenant?: string | null;
    subscriber?: Partial<Subscriber> | null;
    automations?: EmailAutomation[];
  } = {},
) {
  const subscriber =
    options.subscriber === undefined
      ? { id: "sub-1", email: "ada@example.com", segments: ["seg-1"], opens: 0 }
      : options.subscriber;
  const qb = queryBuilder([{ id: "sub-1" }]);
  const automations = {
    find: jest.fn<Promise<EmailAutomation[]>, [unknown]>(
      async () => options.automations ?? [],
    ),
  };
  const triggers = {
    findOne: jest.fn(async () => null),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: "trg-1", ...value })),
  };
  const subscribers = {
    findOne: jest.fn(async () => subscriber),
    createQueryBuilder: jest.fn(() => qb),
    find: jest.fn(async () => []),
  };
  const organizations = { find: jest.fn(async () => [{ slug: TENANT }]) };
  const queue = { addProcessTriggerJob: jest.fn(async () => undefined) };
  const tenants = {
    getTenantId: () => (options.tenant === undefined ? TENANT : options.tenant),
    runWithTenant: jest.fn(
      async (_context: unknown, run: () => Promise<void>) => run(),
    ),
  };
  const service = new TriggerEvaluatorService(
    automations as unknown as Repository<EmailAutomation>,
    triggers as unknown as Repository<AutomationTrigger>,
    subscribers as unknown as Repository<Subscriber>,
    {} as Repository<Segment>,
    organizations as unknown as Repository<Organization>,
    queue as unknown as AutomationQueueService,
    tenants as unknown as TenantService,
  );
  return { service, automations, triggers, subscribers, queue, qb };
}

describe("TriggerEvaluatorService", () => {
  describe("event triggers", () => {
    it("creates and queues a trigger for a matching tenant subscriber", async () => {
      const { service, triggers, queue } = setup({
        automations: [
          automation(TriggerType.EVENT, {
            events: [TriggerEvent.SUBSCRIBER_CREATED],
          }),
        ],
      });
      await service.evaluateEventTrigger(
        TriggerEvent.SUBSCRIBER_CREATED,
        "sub-1",
      );
      expect(triggers.save).toHaveBeenCalledWith(
        expect.objectContaining({
          automationId: "a1",
          subscriberId: "sub-1",
          status: TriggerStatus.PENDING,
          tenantId: TENANT,
        }),
      );
      expect(queue.addProcessTriggerJob).toHaveBeenCalledWith(
        expect.objectContaining({ triggerId: "trg-1", tenantId: TENANT }),
        expect.anything(),
      );
    });

    it("ignores a subscriber that is not in the tenant", async () => {
      const { service, automations, triggers } = setup({
        subscriber: null,
        automations: [
          automation(TriggerType.EVENT, {
            events: [TriggerEvent.SUBSCRIBER_CREATED],
          }),
        ],
      });
      await service.evaluateEventTrigger(
        TriggerEvent.SUBSCRIBER_CREATED,
        "foreign-sub",
      );
      expect(automations.find).not.toHaveBeenCalled();
      expect(triggers.save).not.toHaveBeenCalled();
    });

    it("skips other events, other segments and existing pending triggers", async () => {
      const otherEvent = automation(TriggerType.EVENT, {
        events: [TriggerEvent.EMAIL_OPENED],
      });
      const otherSegment = automation(
        TriggerType.EVENT,
        { events: [TriggerEvent.SUBSCRIBER_CREATED] },
        { segmentId: "seg-2" },
      );
      const { service, triggers } = setup({
        automations: [otherEvent, otherSegment],
      });
      await service.evaluateEventTrigger(
        TriggerEvent.SUBSCRIBER_CREATED,
        "sub-1",
      );
      expect(triggers.save).not.toHaveBeenCalled();

      const pending = setup({
        automations: [
          automation(TriggerType.EVENT, {
            events: [TriggerEvent.SUBSCRIBER_CREATED],
          }),
        ],
      });
      pending.triggers.findOne.mockResolvedValueOnce({
        id: "existing",
      } as never);
      await pending.service.evaluateEventTrigger(
        TriggerEvent.SUBSCRIBER_CREATED,
        "sub-1",
      );
      expect(pending.triggers.save).not.toHaveBeenCalled();
    });

    it("uses a falsy event value instead of falling back to the subscriber", async () => {
      const conditional = automation(TriggerType.EVENT, {
        events: [TriggerEvent.PURCHASE_MADE],
        conditions: [{ field: "amount", operator: "equals", value: 0 }],
      });
      const { service, triggers } = setup({
        subscriber: { id: "sub-1", amount: 99 } as never,
        automations: [conditional],
      });
      await service.evaluateEventTrigger(TriggerEvent.PURCHASE_MADE, "sub-1", {
        amount: 0,
      });
      expect(triggers.save).toHaveBeenCalledTimes(1);
    });

    it("requires a tenant context", async () => {
      await expect(
        setup({ tenant: null }).service.evaluateEventTrigger(
          TriggerEvent.SUBSCRIBER_CREATED,
          "sub-1",
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("attribute triggers", () => {
    it.each([
      ["any", { changeType: "any" }, 1, 2, true],
      ["any without a change", { changeType: "any" }, 2, 2, false],
      [
        "specific",
        { changeType: "specific", oldValue: "a", newValue: "b" },
        "a",
        "b",
        true,
      ],
      ["increased", { changeType: "increased" }, 1, 3, true],
      ["decreased on an increase", { changeType: "decreased" }, 1, 3, false],
    ])("%s", async (_label, config, oldValue, newValue, fires) => {
      const { service, triggers } = setup({
        automations: [
          automation(TriggerType.ATTRIBUTE, { attribute: "score", ...config }),
        ],
      });
      await service.evaluateAttributeTrigger(
        "sub-1",
        "score",
        oldValue,
        newValue,
      );
      expect(triggers.save).toHaveBeenCalledTimes(fires ? 1 : 0);
    });
  });

  describe("scheduled triggers", () => {
    it("never puts a configured date field into SQL", async () => {
      const { service, qb, automations } = setup();
      automations.find.mockImplementation(async (query) =>
        (query as { where: { triggerType: TriggerType } }).where.triggerType ===
        TriggerType.TIME_BASED
          ? [
              automation(TriggerType.TIME_BASED, {
                schedule: "anniversary",
                dateField: "id) = 1 OR (1",
              }),
            ]
          : [],
      );
      await service.evaluateTimeBasedTriggers();
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it("reads a whitelisted anniversary column", async () => {
      const { service, qb, automations, triggers } = setup();
      automations.find.mockResolvedValue([
        automation(TriggerType.TIME_BASED, {
          schedule: "anniversary",
          dateField: "createdAt",
        }),
      ]);
      await service.evaluateTimeBasedTriggers();
      expect(qb.andWhere).toHaveBeenCalledWith(
        "EXTRACT(MONTH FROM subscriber.subscribedAt) = :month",
        expect.anything(),
      );
      expect(triggers.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TriggerStatus.SCHEDULED,
          tenantId: TENANT,
        }),
      );
    });

    it("queues an inactive subscriber once and reads opens by recipient email", async () => {
      const { service, qb, automations, triggers } = setup();
      automations.find.mockImplementation(async (query) =>
        (query as { where: { triggerType: TriggerType } }).where.triggerType ===
        TriggerType.BEHAVIOR
          ? [
              automation(TriggerType.BEHAVIOR, {
                behaviorType: "inactive_subscriber",
                timeWindow: 60 * 24 * 30,
              }),
            ]
          : [],
      );
      await service.evaluateBehaviorTriggers();
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining("log.recipient_email = subscriber.email"),
        expect.anything(),
      );
      expect(triggers.save).toHaveBeenCalledTimes(1);

      triggers.findOne.mockResolvedValueOnce({ id: "pending" } as never);
      await service.evaluateBehaviorTriggers();
      expect(triggers.save).toHaveBeenCalledTimes(1);
    });
  });
});
