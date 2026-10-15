import { BrandService } from "./brand.service";

jest.mock("../social-media/social-media.service", () => ({
  SocialMediaService: class {},
}));
jest.mock("../email-marketing/email-campaign.service", () => ({
  EmailCampaignService: class {},
}));
jest.mock("../tickets/tickets.service", () => ({ TicketsService: class {} }));

function setup(history: Array<{ value: number }>) {
  const social = {
    getGlobalEngagementStats: jest.fn(async () => ({
      engagementRate: 1.5,
      totalPosts: 10,
      totalImpressions: 900,
    })),
    getEngagementHistory: jest.fn(async () => history),
  };
  const campaigns = {
    findAll: jest.fn(async () => []),
    getCampaignStats: jest.fn(),
  };
  const tickets = {
    getStats: jest.fn(async () => ({ slaCompliance: 98, openTickets: 3 })),
  };
  return {
    service: new BrandService(
      social as never,
      campaigns as never,
      tickets as never,
    ),
    social,
    tickets,
  };
}

describe("BrandService", () => {
  beforeEach(() => jest.spyOn(Math, "random"));
  afterEach(() => jest.restoreAllMocks());

  it("builds the trajectory from real history only and labels it live", async () => {
    const { service } = setup([2, 4, 6, 8, 10, 12].map((value) => ({ value })));
    const result = await service.getBrandIntelligence("acme");
    expect(result.dataQuality.trajectory).toBe("live");
    expect([
      ...result.trajectory.historical.data,
      ...result.trajectory.current.data,
    ]).toHaveLength(6);
    expect(result.trajectory.projected.data.length).toBeGreaterThan(0);
    expect(Math.random).not.toHaveBeenCalled();
  });

  it("draws nothing when history is too short and says so", async () => {
    const { service } = setup([{ value: 3 }]);
    const result = await service.getBrandIntelligence("acme");
    expect(result.dataQuality.trajectory).toBe("insufficient");
    expect(result.trajectory.sufficientData).toBe(false);
    expect(result.trajectory.historical.data).toEqual([]);
    expect(result.trajectory.projected.data).toEqual([]);
  });

  it("returns no invented topology points", async () => {
    const { service } = setup([]);
    const result = await service.getBrandIntelligence("acme");
    expect(result.topology.points).toEqual([]);
    expect(result.dataQuality.topology).toBe("unavailable");
  });

  it("marks a failing source unavailable instead of inventing or hiding it", async () => {
    const { service, social } = setup([]);
    social.getGlobalEngagementStats.mockRejectedValueOnce(
      new Error('relation "social_posts" does not exist') as never,
    );
    social.getEngagementHistory.mockRejectedValueOnce(
      new Error('relation "social_posts" does not exist') as never,
    );
    const result = await service.getBrandIntelligence("acme");
    expect(result.resonance).toBeNull();
    expect(result.dataQuality.resonance).toBe("unavailable");
    expect(result.dataQuality.trajectory).toBe("unavailable");
    expect(result.trajectory.historical.data).toEqual([]);
    expect(result.dataQuality.friction).toBe("live");
    expect(result.friction?.openTickets).toBe(3);
  });

  it("fails when no source can be read at all", async () => {
    const { service, social, tickets } = setup([]);
    const down = new Error("db down");
    social.getGlobalEngagementStats.mockRejectedValueOnce(down as never);
    social.getEngagementHistory.mockRejectedValueOnce(down as never);
    tickets.getStats.mockRejectedValueOnce(down as never);
    const brand = service as unknown as {
      emailCampaignService: { findAll: jest.Mock };
    };
    brand.emailCampaignService.findAll.mockRejectedValueOnce(down as never);
    await expect(service.getBrandIntelligence("acme")).rejects.toThrow(
      "db down",
    );
  });
});
