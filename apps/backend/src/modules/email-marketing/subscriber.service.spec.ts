import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { FindOperator, Repository } from "typeorm";
import { TenantService } from "../../core/tenant/tenant.service";
import { Group } from "./entities/group.entity";
import { Segment } from "./entities/segment.entity";
import { Subscriber } from "./entities/subscriber.entity";
import { AdvancedEmailValidationService } from "./services/advanced-email-validation.service";
import { EmailValidationService } from "./services/email-validation.service";
import { OptInOutService } from "./services/opt-in-out.service";
import { SubscriberService } from "./subscriber.service";

// The validation and opt-in collaborators pull in DNS, mail and settings; none run here.
jest.mock("./services/advanced-email-validation.service", () => ({
  AdvancedEmailValidationService: class {},
}));
jest.mock("./services/opt-in-out.service", () => ({
  OptInOutService: class {},
}));

const TENANT = "tenant-a";

function setup(
  options: {
    tenant?: string | null;
    stored?: Partial<Subscriber> | null;
    groups?: Partial<Group>[];
  } = {},
) {
  const stored =
    options.stored === undefined
      ? ({
          id: "sub-1",
          email: "ada@example.com",
          tenantId: TENANT,
          status: "active",
        } as Subscriber)
      : options.stored;
  const subscribers = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: "sub-new", ...value })),
    find: jest.fn(async () => [stored]),
    findOne: jest.fn(async () => stored),
    update: jest.fn(async () => ({ affected: 1 })),
    remove: jest.fn(async () => undefined),
  };
  const groups = { find: jest.fn(async () => options.groups ?? []) };
  const validation = {
    validateEmail: jest.fn(async () => ({ status: "valid" })),
  };
  const optIn = { subscribeWithDoubleOptIn: jest.fn(async () => undefined) };
  const service = new SubscriberService(
    subscribers as unknown as Repository<Subscriber>,
    {} as EmailValidationService,
    validation as unknown as AdvancedEmailValidationService,
    {
      getTenantId: () =>
        options.tenant === undefined ? TENANT : options.tenant,
    } as unknown as TenantService,
    groups as unknown as Repository<Group>,
    { find: jest.fn(async () => []) } as unknown as Repository<Segment>,
    optIn as unknown as OptInOutService,
  );
  return { service, subscribers, groups, validation, optIn };
}

/** The email condition is a LOWER() comparison against the normalised address. */
function emailCondition(where: { email: FindOperator<unknown> }) {
  const operator = where.email as unknown as {
    _type: string;
    _objectLiteralParameters: Record<string, string>;
    _getSql: (c: string) => string;
  };
  return {
    sql: operator._getSql("email"),
    params: operator._objectLiteralParameters,
  };
}

describe("SubscriberService", () => {
  it("creates a pending subscriber with a normalised email and checks deliverability", async () => {
    const { service, subscribers, validation } = setup();
    await service.create(
      { email: "  Ada@Example.COM " } as never,
      "203.0.113.5",
    );
    expect(validation.validateEmail).toHaveBeenCalledWith(
      "  Ada@Example.COM ",
      "203.0.113.5",
    );
    expect(subscribers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ada@example.com",
        status: "pending",
        mailerCheckResult: "valid",
        groups: [],
        segments: [],
        tenantId: TENANT,
      }),
    );
  });

  it("refuses fields outside the writable list and groups of another tenant", async () => {
    const { service, subscribers, groups } = setup();
    await expect(
      service.create({ email: "a@b.co", tenantId: "tenant-b" } as never),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.create({ email: "a@b.co", groups: ["foreign"] } as never),
    ).rejects.toThrow("Recipient relation not found in this tenant");
    expect(groups.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT }),
      }),
    );
    expect(subscribers.save).not.toHaveBeenCalled();
  });

  it("finds by email case-insensitively inside the tenant", async () => {
    const { service, subscribers } = setup();
    await service.findByEmail("ADA@example.com ");
    const [[{ where }]] = subscribers.findOne.mock.calls as unknown as [
      [{ where: { email: FindOperator<unknown>; tenantId: string } }],
    ];
    expect(where.tenantId).toBe(TENANT);
    expect(emailCondition(where)).toEqual({
      sql: "LOWER(email) = :normalizedEmail",
      params: { normalizedEmail: "ada@example.com" },
    });
  });

  it("reports a suppressed address whatever its casing", async () => {
    const { service } = setup({
      stored: {
        id: "sub-1",
        email: "Ada@Example.com",
        tenantId: TENANT,
        status: "unsubscribed",
      },
    });
    await expect(service.isEmailSuppressed("ada@example.com")).resolves.toBe(
      true,
    );
    await expect(
      setup({ stored: null }).service.isEmailSuppressed("new@example.com"),
    ).resolves.toBe(false);
  });

  it("refuses to change the email of an existing subscription", async () => {
    const { service, subscribers } = setup();
    await expect(
      service.update("sub-1", { email: "other@example.com" } as never),
    ).rejects.toThrow(BadRequestException);
    expect(subscribers.update).not.toHaveBeenCalled();
  });

  it("unsubscribes without overwriting a bounce or complaint", async () => {
    const { service, subscribers } = setup();
    await service.unsubscribe("ada@example.com");
    const [[where, changes]] = subscribers.update.mock.calls as unknown as [
      [object, { status: () => string; marketingEmails: boolean }],
    ];
    expect(where).toEqual({ id: "sub-1", tenantId: TENANT });
    expect(changes.status()).toContain(
      "WHEN status IN ('bounced', 'complained') THEN status",
    );
    expect(changes.marketingEmails).toBe(false);
  });

  it("ignores a webhook event without a tenant", async () => {
    const { service, subscribers } = setup({ tenant: null });
    await expect(
      service.updateStatusFromWebhook("ada@example.com", "bounced"),
    ).resolves.toBeNull();
    expect(subscribers.update).not.toHaveBeenCalled();
  });

  it("records a webhook bounce with its detail for the tenant", async () => {
    const { service, subscribers } = setup();
    await service.updateStatusFromWebhook(
      "ada@example.com",
      "bounced",
      { bounceType: "hard" },
      TENANT,
    );
    expect(subscribers.update).toHaveBeenCalledWith(
      { id: "sub-1", tenantId: TENANT },
      expect.objectContaining({
        status: "bounced",
        mailerCheckResult: "hard",
        marketingEmails: false,
      }),
    );
  });

  it("subscribes through double opt-in and returns the normalised record", async () => {
    const { service, optIn } = setup();
    await service.subscribe(" Ada@Example.com ", "203.0.113.5");
    expect(optIn.subscribeWithDoubleOptIn).toHaveBeenCalledWith(
      " Ada@Example.com ",
      {},
      "203.0.113.5",
    );
  });

  it("requires a tenant context and reports a missing subscriber", async () => {
    await expect(setup({ tenant: null }).service.findAll()).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(
      setup({ stored: null }).service.findOne("missing"),
    ).rejects.toThrow(NotFoundException);
  });
});
