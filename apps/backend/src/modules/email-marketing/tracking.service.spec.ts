import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import { TenantService } from "../../core/tenant/tenant.service";
import { EmailCampaign } from "./entities/email-campaign.entity";
import { EmailLog } from "./entities/email-log.entity";
import { EmailOpenHistory } from "./entities/email-open-history.entity";
import { Subscriber } from "./entities/subscriber.entity";
import { TrackingService } from "./tracking.service";

const TENANT = "tenant-a";

function setup(
  options: {
    log?: Partial<EmailLog> | null;
    tenant?: string | null;
    secret?: string;
  } = {},
) {
  const log =
    options.log === undefined
      ? ({
          id: "log-1",
          campaignId: "c1",
          recipientEmail: "ada@example.com",
          tenantId: TENANT,
          metadata: {},
        } as EmailLog)
      : options.log;
  const logs = {
    findOne: jest.fn(async () => log),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    find: jest.fn(async () => []),
  };
  const campaign = { id: "c1", openedCount: 0, clickedCount: 0 };
  const campaigns = {
    findOne: jest.fn(async () => campaign),
    save: jest.fn(async (value) => value),
  };
  const subscriber = { id: "sub-1", opens: 0, clicks: 0 };
  const subscribers = {
    findOne: jest.fn(async () => subscriber),
    save: jest.fn(async (value) => value),
  };
  const history = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
  const events = { emit: jest.fn() };
  const config = {
    get: jest.fn((key: string, fallback?: string) =>
      key === "JWT_SECRET"
        ? (options.secret ?? "test-secret")
        : key === "BASE_URL"
          ? "https://api.example.test"
          : fallback,
    ),
  };
  const service = new TrackingService(
    logs as unknown as Repository<EmailLog>,
    campaigns as unknown as Repository<EmailCampaign>,
    subscribers as unknown as Repository<Subscriber>,
    history as unknown as Repository<EmailOpenHistory>,
    {
      getTenantId: () =>
        options.tenant === undefined ? TENANT : options.tenant,
    } as unknown as TenantService,
    config as unknown as ConfigService,
    events as unknown as EventEmitter2,
  );
  return { service, logs, campaign, subscriber, history, events };
}

const clickParams = (wrapped: string) => {
  const url = new URL(wrapped);
  return {
    url: url.searchParams.get("url") ?? undefined,
    sig: url.searchParams.get("sig") ?? undefined,
  };
};

describe("TrackingService", () => {
  describe("link signing and redirects", () => {
    it("wraps links with a signature that resolves back to the same target", async () => {
      const { service } = setup();
      const { linkWrapper, pixelUrl } = await service.generateTrackingData(
        "c1",
        "ada@example.com",
      );
      expect(pixelUrl).toBe(
        "https://api.example.test/api/email-marketing/track/open/log-1",
      );
      const { url, sig } = clickParams(
        linkWrapper("https://shop.example.com/sale?a=1&b=2"),
      );
      expect(url).toBe("https://shop.example.com/sale?a=1&b=2");
      await expect(service.resolveClickTarget("log-1", url, sig)).resolves.toBe(
        "https://shop.example.com/sale?a=1&b=2",
      );
    });

    it("refuses a target that was not signed for this email", async () => {
      const { service } = setup();
      const { linkWrapper } = await service.generateTrackingData(
        "c1",
        "ada@example.com",
      );
      const { sig } = clickParams(linkWrapper("https://shop.example.com/"));
      await expect(
        service.resolveClickTarget("log-1", "https://evil.example.net/", sig),
      ).resolves.toBeNull();
      await expect(
        service.resolveClickTarget("log-2", "https://shop.example.com/", sig),
      ).resolves.toBeNull();
      await expect(
        service.resolveClickTarget(
          "log-1",
          "https://shop.example.com/",
          "forged",
        ),
      ).resolves.toBeNull();
    });

    it("only follows http(s) targets", async () => {
      const { service } = setup();
      for (const url of [
        "javascript:alert(1)",
        "data:text/html,hi",
        "//evil.example.net",
        "not a url",
      ]) {
        await expect(
          service.resolveClickTarget("log-1", url),
        ).resolves.toBeNull();
      }
    });

    it("lets unsigned links from older emails through only for a real tracking id", async () => {
      await expect(
        setup().service.resolveClickTarget(
          "log-1",
          "https://shop.example.com/",
        ),
      ).resolves.toBe("https://shop.example.com/");
      await expect(
        setup({ log: null }).service.resolveClickTarget(
          "nope",
          "https://evil.example.net/",
        ),
      ).resolves.toBeNull();
    });
  });

  it("counts the first open once and records it for send-time analysis in the tenant", async () => {
    const { service, logs, campaign, subscriber, history, events } = setup();
    const openedAt = new Date("2026-10-15T09:30:00");
    await service.trackEmailOpen("log-1", {
      timestamp: openedAt,
      userAgent: "Mozilla/5.0 (iPhone) Mail",
    });
    expect(campaign.openedCount).toBe(1);
    expect(subscriber.opens).toBe(1);
    expect(history.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT,
        subscriberId: "sub-1",
        hourOfDay: 9,
        deviceType: "mobile",
      }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      "neural.signal",
      expect.objectContaining({ type: "email.opened", tenantId: TENANT }),
    );

    logs.findOne.mockResolvedValueOnce({
      id: "log-1",
      openedAt,
      tenantId: TENANT,
    } as EmailLog);
    await service.trackEmailOpen("log-1", { timestamp: new Date() });
    expect(campaign.openedCount).toBe(1);
  });

  it("counts a unique click once but keeps every click", async () => {
    const { service, logs, campaign, subscriber } = setup();
    await service.trackEmailClick("log-1", {
      timestamp: new Date(),
      originalUrl: "https://shop.example.com/",
    });
    const stored = logs.save.mock.calls[0][0] as EmailLog;
    logs.findOne.mockResolvedValueOnce({
      ...stored,
      clickedAt: new Date(stored.clickedAt as Date),
    } as EmailLog);
    await service.trackEmailClick("log-1", {
      timestamp: new Date(),
      originalUrl: "https://shop.example.com/",
    });
    expect(campaign.clickedCount).toBe(1);
    expect(subscriber.clicks).toBe(2);
    expect(
      (logs.save.mock.calls[1][0] as EmailLog).metadata?.clicks,
    ).toHaveLength(2);
  });

  it("adds a pixel and wraps links except mailto and anchors", async () => {
    const { service } = setup();
    const html = await service.processEmailContent(
      '<body><a href="https://shop.example.com/">Shop</a><a href="mailto:a@b.co">Mail</a><a href="#top">Top</a></body>',
      "c1",
      "ada@example.com",
    );
    expect(html).toContain(
      "/track/click/log-1?url=https%3A%2F%2Fshop.example.com%2F&sig=",
    );
    expect(html).toContain('href="mailto:a@b.co"');
    expect(html).toContain('href="#top"');
    expect(html).toMatch(
      /<img src="https:\/\/api\.example\.test\/api\/email-marketing\/track\/open\/log-1"[^>]*><\/body>$/,
    );
  });

  it("computes campaign rates inside the tenant", async () => {
    const { service, logs } = setup();
    logs.find.mockResolvedValueOnce([
      {
        recipientEmail: "a@x.co",
        openedAt: new Date(),
        clickedAt: new Date(),
        metadata: { clicks: [{ originalUrl: "https://s/" }] },
      },
      { recipientEmail: "b@x.co", openedAt: new Date(), metadata: {} },
      { recipientEmail: "c@x.co", metadata: {} },
      { recipientEmail: "d@x.co", metadata: {} },
    ] as never);
    await expect(service.getTrackingStats("c1")).resolves.toMatchObject({
      totalSent: 4,
      totalOpened: 2,
      totalClicked: 1,
      openRate: 50,
      clickRate: 25,
    });
    expect(logs.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { campaignId: "c1", tenantId: TENANT },
      }),
    );
    await expect(
      setup({ tenant: null }).service.getTrackingStats("c1"),
    ).rejects.toThrow(UnauthorizedException);
  });
});
