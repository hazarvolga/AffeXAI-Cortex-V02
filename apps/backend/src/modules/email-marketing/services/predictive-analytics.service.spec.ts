import { UnauthorizedException } from "@nestjs/common";
import { Repository } from "typeorm";
import { TenantService } from "../../../core/tenant/tenant.service";
import { EmailCampaign } from "../entities/email-campaign.entity";
import { EmailLog } from "../entities/email-log.entity";
import { EmailOpenHistory } from "../entities/email-open-history.entity";
import { Subscriber } from "../entities/subscriber.entity";
import { PredictiveAnalyticsService } from "./predictive-analytics.service";

const TENANT = "tenant-a";
const DAY = 24 * 60 * 60 * 1000;

const campaign = (
  sentCount: number,
  openedCount: number,
  clickedCount = 0,
  bounceCount = 0,
) => ({ sentCount, openedCount, clickedCount, bounceCount }) as EmailCampaign;

function setup(
  options: {
    campaigns?: EmailCampaign[];
    subscriber?: Partial<Subscriber> | null;
    logs?: Partial<EmailLog>[];
    subscribers?: Partial<Subscriber>[];
    counts?: { total: number; active: number };
    tenant?: string | null;
  } = {},
) {
  const qb: Record<string, jest.Mock> = {};
  for (const method of [
    "select",
    "addSelect",
    "where",
    "andWhere",
    "groupBy",
    "orderBy",
    "limit",
  ])
    qb[method] = jest.fn(() => qb);
  qb.getRawMany = jest.fn(async () => [{ hour: 9 }, { hour: 20 }]);
  const counts = options.counts ?? { total: 10, active: 9 };
  const subscribers = {
    findOne: jest.fn(async () =>
      options.subscriber === undefined
        ? { id: "sub-1", email: "ada@example.com", opens: 0, clicks: 0 }
        : options.subscriber,
    ),
    find: jest.fn(async () => options.subscribers ?? []),
    count: jest.fn(async ({ where }: { where: { status?: string } }) =>
      where.status ? counts.active : counts.total,
    ),
  };
  const service = new PredictiveAnalyticsService(
    {
      find: jest.fn(async () => options.campaigns ?? []),
    } as unknown as Repository<EmailCampaign>,
    {
      find: jest.fn(async () => options.logs ?? []),
    } as unknown as Repository<EmailLog>,
    subscribers as unknown as Repository<Subscriber>,
    {
      createQueryBuilder: jest.fn(() => qb),
    } as unknown as Repository<EmailOpenHistory>,
    {
      getTenantId: () =>
        options.tenant === undefined ? TENANT : options.tenant,
    } as unknown as TenantService,
  );
  return { service, subscribers };
}

describe("PredictiveAnalyticsService", () => {
  describe("engagement score", () => {
    it("combines open rate, click rate and recency", async () => {
      const { service, subscribers } = setup({
        subscriber: {
          id: "sub-1",
          email: "ada@example.com",
          opens: 4,
          clicks: 2,
        },
        logs: [
          { openedAt: new Date(Date.now() - 2 * DAY) },
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          {},
        ],
      });
      const score = await service.calculateEngagementScore("sub-1");
      expect(subscribers.findOne).toHaveBeenCalledWith({
        where: { id: "sub-1", tenantId: TENANT },
      });
      // open 4/10 → 40, click 2/4 → 40 (capped), opened 2 days ago → 20
      expect(score).toMatchObject({
        score: 100,
        category: "highly-engaged",
        totalInteractions: 6,
      });
    });

    it("treats an unknown subscriber as inactive", async () => {
      const { service } = setup({ subscriber: null });
      await expect(
        service.calculateEngagementScore("foreign"),
      ).resolves.toMatchObject({
        score: 0,
        category: "inactive",
        lastEngagement: null,
      });
    });
  });

  it("rates a subscriber who never engaged as critical churn risk", async () => {
    const { service } = setup();
    await expect(service.calculateChurnRisk("sub-1")).resolves.toMatchObject({
      riskScore: 100,
      riskLevel: "critical",
      daysInactive: 365,
    });
  });

  describe("campaign prediction", () => {
    it("uses the tenant history and says how many campaigns it is based on", async () => {
      const campaigns = Array.from({ length: 10 }, () => campaign(100, 30, 6));
      const { service } = setup({ campaigns });
      const prediction = await service.predictCampaignPerformance("c1", []);
      expect(prediction).toMatchObject({
        expectedOpenRate: 0.3,
        expectedClickRate: 0.06,
        confidenceScore: 1,
        basedOnCampaigns: 10,
      });
      expect(prediction.riskFactors).not.toContain("Yetersiz geçmiş veri");
    });

    it("flags missing history instead of presenting defaults as measured", async () => {
      const { service } = setup();
      const prediction = await service.predictCampaignPerformance("c1", []);
      expect(prediction).toMatchObject({
        confidenceScore: 0,
        basedOnCampaigns: 0,
      });
      expect(Number.isNaN(prediction.expectedOpenRate)).toBe(false);
      expect(prediction.riskFactors).toContain("Yetersiz geçmiş veri");
    });
  });

  describe("dashboard", () => {
    it("invents no segments or growth forecast and survives an empty list", async () => {
      const { service } = setup({
        subscribers: [],
        counts: { total: 0, active: 0 },
      });
      const metrics = await service.getDashboardMetrics();
      expect(metrics).toMatchObject({
        averageEngagementScore: 0,
        atRiskSubscribers: 0,
        predictedMonthlyGrowth: null,
        topPerformingSegments: [],
        sampledSubscribers: 0,
      });
    });
  });

  describe("insights", () => {
    it("reports a falling open rate, inactive share, best hours and high bounces from tenant data", async () => {
      const { service } = setup({
        campaigns: [
          campaign(100, 5, 0, 10),
          campaign(100, 30),
          campaign(100, 30),
        ],
        counts: { total: 10, active: 5 },
      });
      const titles = (await service.generateAIInsights()).map(
        (insight) => insight.title,
      );
      expect(titles).toEqual([
        "Açılma Oranları Düşüşte",
        "İnaktif Abone Fırsatı",
        "Optimal Gönderim Zamanları",
        "Yüksek Bounce Oranı Tespit Edildi",
      ]);
    });
  });

  it("never falls back to a shared default tenant", async () => {
    await expect(
      setup({ tenant: null }).service.generateAIInsights(),
    ).rejects.toThrow(UnauthorizedException);
  });
});
