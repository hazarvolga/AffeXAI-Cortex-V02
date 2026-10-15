import { UnauthorizedException } from "@nestjs/common";
import { Repository } from "typeorm";
import { TenantService } from "../../../core/tenant/tenant.service";
import { EmailOpenHistory } from "../entities/email-open-history.entity";
import { Subscriber } from "../entities/subscriber.entity";
import { SendTimeOptimizationService } from "./send-time-optimization.service";

const TENANT = "tenant-a";

const open = (
  hourOfDay: number,
  dayOfWeek: number,
  timezone = "Europe/Istanbul",
) => ({ hourOfDay, dayOfWeek, timezone }) as EmailOpenHistory;

function setup(
  options: {
    history?: EmailOpenHistory[];
    top?: { hour: string; day: string } | null;
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
    "addGroupBy",
    "orderBy",
    "limit",
  ]) {
    qb[method] = jest.fn(() => qb);
  }
  qb.getRawOne = jest.fn(async () =>
    options.top === undefined ? null : options.top,
  );
  const history = {
    find: jest.fn(async () => options.history ?? []),
    createQueryBuilder: jest.fn(() => qb),
    count: jest.fn(async () => 42),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
  const service = new SendTimeOptimizationService(
    history as unknown as Repository<EmailOpenHistory>,
    {} as Repository<Subscriber>,
    {
      getTenantId: () =>
        options.tenant === undefined ? TENANT : options.tenant,
    } as unknown as TenantService,
  );
  return { service, history, qb };
}

describe("SendTimeOptimizationService", () => {
  it("picks the most frequent hour and day from the subscriber history", async () => {
    const history = [
      open(9, 2),
      open(9, 2),
      open(9, 3),
      open(20, 2),
      open(9, 2),
      open(14, 5),
    ];
    const { service, history: repo } = setup({ history });
    const result = await service.calculateOptimalTimeForSubscriber("sub-1");
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { subscriberId: "sub-1", tenantId: TENANT },
      }),
    );
    expect(result).toMatchObject({
      optimalHour: 9,
      optimalDayOfWeek: 2,
      basedOnDataPoints: 6,
      timezone: "Europe/Istanbul",
    });
    expect(result.confidence).toBeCloseTo(6 / 30);
  });

  it("falls back to the tenant pattern with low confidence when history is thin", async () => {
    const { service } = setup({
      history: [open(9, 2)],
      top: { hour: "18", day: "4" },
    });
    await expect(
      service.calculateOptimalTimeForSubscriber("sub-1"),
    ).resolves.toMatchObject({
      optimalHour: 18,
      optimalDayOfWeek: 4,
      confidence: 0.3,
      basedOnDataPoints: 1,
    });
  });

  it("reports the busiest slot without inventing an open rate", async () => {
    const { service, qb } = setup({ top: { hour: "10", day: "1" } });
    await expect(service.calculateGlobalOptimalTime()).resolves.toEqual({
      hour: 10,
      dayOfWeek: 1,
      averageOpenRate: null,
      basedOnOpens: 42,
    });
    expect(qb.where).toHaveBeenCalledWith("history.tenantId = :tenantId", {
      tenantId: TENANT,
    });
  });

  it("marks the default slot as based on no opens", async () => {
    const { service } = setup();
    await expect(service.calculateGlobalOptimalTime()).resolves.toEqual({
      hour: 10,
      dayOfWeek: 2,
      averageOpenRate: null,
      basedOnOpens: 0,
    });
  });

  it("says a segment recommendation is tenant-wide and claims no open rate", async () => {
    const { service } = setup({ top: { hour: "10", day: "1" } });
    const result = await service.getSegmentOptimalTimes("seg-1");
    expect(result).toMatchObject({
      segmentId: "seg-1",
      scope: "tenant",
      basedOnOpens: 42,
    });
    expect(result.recommendations).toEqual([
      {
        time: "Pazartesi 10:00",
        expectedOpenRate: null,
        reason: expect.stringContaining("segment bazında analiz henüz yok"),
      },
    ]);
  });

  it("records an open in the active tenant with its hour and weekday", async () => {
    const { service, history } = setup();
    await service.recordEmailOpen("sub-1", "camp-1", { deviceType: "mobile" });
    expect(history.save).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriberId: "sub-1",
        campaignId: "camp-1",
        tenantId: TENANT,
        deviceType: "mobile",
        hourOfDay: expect.any(Number),
      }),
    );
  });

  it("never falls back to a shared default tenant", async () => {
    const { service, history } = setup({ tenant: null });
    await expect(service.recordEmailOpen("sub-1", "camp-1")).rejects.toThrow(
      UnauthorizedException,
    );
    expect(history.save).not.toHaveBeenCalled();
  });

  it("schedules a campaign in the future for every subscriber", async () => {
    const { service } = setup({
      history: [open(9, 2), open(9, 2), open(9, 2), open(9, 2), open(9, 2)],
    });
    const { globalTime, individualTimes } =
      await service.calculateOptimalTimeForCampaign(["sub-1", "sub-2"]);
    expect(individualTimes.size).toBe(2);
    expect(globalTime.getTime()).toBeGreaterThan(Date.now());
    expect(globalTime.getDay()).toBe(2);
    expect(globalTime.getHours()).toBe(9);
  });
});
