import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { TenantService } from "../../../core/tenant/tenant.service";
import { Organization } from "../../organizations/entities/organization.entity";
import { EmailCampaign } from "../entities/email-campaign.entity";
import {
  EmailCampaignVariant,
  VariantStatus,
} from "../entities/email-campaign-variant.entity";
import { Subscriber } from "../entities/subscriber.entity";
import { AbTestService } from "./ab-test.service";
import { AbTestStatisticsService } from "./ab-test-statistics.service";

const TENANT = "tenant-a";

function variant(
  label: string,
  overrides: Partial<EmailCampaignVariant> = {},
): EmailCampaignVariant {
  return Object.assign(new EmailCampaignVariant(), {
    id: `v-${label}`,
    variantLabel: label,
    splitPercentage: 50,
    status: VariantStatus.DRAFT,
    sentCount: 0,
    openedCount: 0,
    clickedCount: 0,
    conversionCount: 0,
    tenantId: TENANT,
    ...overrides,
  });
}

function campaign(overrides: Partial<EmailCampaign> = {}): EmailCampaign {
  return Object.assign(new EmailCampaign(), {
    id: "c1",
    name: "Launch",
    subject: "Base subject",
    content: "<p>Base</p>",
    tenantId: TENANT,
    isAbTest: true,
    testStatus: "draft",
    winnerCriteria: "open_rate",
    minSampleSize: 100,
    confidenceLevel: 95,
    testDuration: 24,
    variants: [variant("A"), variant("B")],
    ...overrides,
  });
}

function setup(
  stored: EmailCampaign | null = campaign(),
  tenant: string | null = TENANT,
) {
  const campaigns = {
    findOne: jest.fn(async () => stored),
    save: jest.fn(async (value) => value),
    find: jest.fn(async () => []),
  };
  const variants = {
    create: jest.fn((value) =>
      Object.assign(new EmailCampaignVariant(), value),
    ),
    save: jest.fn(async (value) => value),
    findOne: jest.fn(async () => variant("A")),
    find: jest.fn(async () => [variant("A"), variant("B")]),
    remove: jest.fn(async () => undefined),
  };
  const subscribers = {
    find: jest.fn(async () =>
      Array.from(
        { length: 10 },
        (_, index) => ({ id: `s${index}` }) as Subscriber,
      ),
    ),
  };
  const service = new AbTestService(
    campaigns as unknown as Repository<EmailCampaign>,
    variants as unknown as Repository<EmailCampaignVariant>,
    subscribers as unknown as Repository<Subscriber>,
    {} as Repository<Organization>,
    new AbTestStatisticsService(),
    { getTenantId: () => tenant } as unknown as TenantService,
  );
  return { service, campaigns, variants };
}

const createDto = (
  variants: Array<{ label: string; splitPercentage: number; subject?: string }>,
) =>
  ({
    campaignId: "c1",
    testType: "subject",
    winnerCriteria: "open_rate",
    autoSelectWinner: true,
    testDuration: 24,
    confidenceLevel: 95,
    minSampleSize: 100,
    variants,
  }) as never;

describe("AbTestService", () => {
  describe("createAbTest", () => {
    it("creates tenant variants that inherit the campaign content", async () => {
      const { service, variants } = setup(
        campaign({ isAbTest: false, variants: [] }),
      );
      await service.createAbTest(
        createDto([
          { label: "A", splitPercentage: 50, subject: "Hi" },
          { label: "B", splitPercentage: 50 },
        ]),
      );
      const created = variants.save.mock.calls[0][0] as EmailCampaignVariant[];
      expect(
        created.map((v) => [v.variantLabel, v.subject, v.tenantId]),
      ).toEqual([
        ["A", "Hi", TENANT],
        ["B", "Base subject", TENANT],
      ]);
    });

    it.each([
      [
        "splits not summing to 100",
        [
          { label: "A", splitPercentage: 50 },
          { label: "B", splitPercentage: 40 },
        ],
      ],
      [
        "duplicate labels",
        [
          { label: "A", splitPercentage: 50 },
          { label: "A", splitPercentage: 50 },
        ],
      ],
      [
        "labels outside A-E",
        [
          { label: "A", splitPercentage: 50 },
          { label: "Z", splitPercentage: 50 },
        ],
      ],
    ])("rejects %s", async (_label, variants) => {
      const { service, campaigns } = setup(
        campaign({ isAbTest: false, variants: [] }),
      );
      await expect(service.createAbTest(createDto(variants))).rejects.toThrow(
        BadRequestException,
      );
      expect(campaigns.save).not.toHaveBeenCalled();
    });

    it("refuses a campaign that already has a test or belongs elsewhere", async () => {
      await expect(setup().service.createAbTest(createDto([]))).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        setup(null).service.createAbTest(createDto([])),
      ).rejects.toThrow(NotFoundException);
    });
  });

  it("keeps the split at 100% when a variant changes", async () => {
    const { service, variants } = setup();
    await expect(
      service.updateVariant("c1", "v-A", { splitPercentage: 60 } as never),
    ).rejects.toThrow(BadRequestException);
    expect(variants.findOne).toHaveBeenCalledWith({
      where: { id: "v-A", campaignId: "c1", tenantId: TENANT },
    });
    await expect(
      service.updateVariant("c1", "v-A", { subject: "New" } as never),
    ).resolves.toMatchObject({ subject: "New" });
  });

  it("plans the distribution without claiming a send or locking the test", async () => {
    const { service, campaigns, variants } = setup();
    const plan = await service.sendAbTest({ campaignId: "c1" } as never);
    expect(plan).toMatchObject({ sent: false, totalRecipients: 10 });
    expect(plan.distributions.map((d) => d.recipientCount)).toEqual([5, 5]);
    expect(campaigns.save).not.toHaveBeenCalled();
    expect(variants.save).not.toHaveBeenCalled();
  });

  it("declares a winner only with significance, sample size and elapsed duration", async () => {
    const sentAt = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const strong = campaign({
      sentAt,
      variants: [
        variant("A", { sentCount: 1000, openedCount: 400 }),
        variant("B", { sentCount: 1000, openedCount: 200 }),
      ],
    });
    const results = await setup(strong).service.getAbTestResults("c1");
    expect(results.statistics).toMatchObject({
      isSignificant: true,
      winner: "A",
      hasMinimumSample: true,
      canDeclareWinner: true,
    });

    const early = campaign({ sentAt: new Date(), variants: strong.variants });
    expect(
      (await setup(early).service.getAbTestResults("c1")).statistics
        .canDeclareWinner,
    ).toBe(false);
  });

  it("applies the winner content and marks the others as losers", async () => {
    const stored = campaign({
      variants: [
        variant("A", { subject: "Winner", content: "<p>W</p>" }),
        variant("B"),
      ],
    });
    const result = await setup(stored).service.selectWinner("c1", "v-A");
    expect(result).toMatchObject({
      selectedWinnerId: "v-A",
      testStatus: "completed",
      subject: "Winner",
      content: "<p>W</p>",
    });
    expect(stored.variants.map((v) => v.status)).toEqual([
      VariantStatus.WINNER,
      VariantStatus.LOSER,
    ]);
  });

  it("resets the campaign when a draft test is deleted and refuses a running one", async () => {
    const draft = campaign();
    await setup(draft).service.deleteAbTest("c1");
    expect(draft).toMatchObject({
      isAbTest: false,
      winnerSelectionDate: null,
      testStatus: "draft",
    });
    await expect(
      setup(campaign({ testStatus: "testing" })).service.deleteAbTest("c1"),
    ).rejects.toThrow(BadRequestException);
  });

  it("requires a tenant context", async () => {
    await expect(
      setup(campaign(), null).service.getAbTestSummary("c1"),
    ).rejects.toThrow(UnauthorizedException);
  });
});
