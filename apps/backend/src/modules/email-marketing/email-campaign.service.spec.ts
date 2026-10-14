import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { EmailCampaignService } from "./email-campaign.service";

jest.mock("../commerce/services/commerce.service", () => ({
  CommerceService: class {},
}));
jest.mock("../strategy/services/strategy.service", () => ({
  StrategyService: class {},
}));
jest.mock("../../core/shared/services/cache.service", () => ({
  CacheService: class {},
}));
jest.mock("../platform-integration/services/event-bus.service", () => ({
  EventBusService: class {},
}));
jest.mock("./subscriber.service", () => ({ SubscriberService: class {} }));

const TENANT = "acme";

function setup(tenant: string | null = TENANT) {
  const campaign = () => ({
    id: "c-1",
    tenantId: TENANT,
    name: "Ekim Bülteni",
    slug: "ekim-bulteni",
    subject: "Merhaba",
    content: "<p>İçerik</p>",
    status: "draft",
    totalRecipients: 0,
    sentCount: 0,
    deliveredCount: 0,
    openedCount: 0,
    clickedCount: 0,
    bounceCount: 0,
    complainedCount: 0,
  });
  const repository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    find: jest.fn(async () => [campaign()]),
    findOne: jest.fn(async () => campaign()),
    update: jest.fn(),
    delete: jest.fn(),
    increment: jest.fn(),
  };
  const queue = { add: jest.fn() };
  const cache = {
    get: jest.fn(async () => null),
    set: jest.fn(),
    del: jest.fn(),
  };
  const eventBus = { publishCampaignSent: jest.fn() };
  const subscribers = {
    findAll: jest.fn(async () => [
      { email: "a@acme.test", status: "active" },
      { email: "b@acme.test", status: "active" },
      { email: "c@acme.test", status: "unsubscribed" },
    ]),
    isEmailSuppressed: jest.fn(
      async (email: string) => email === "b@acme.test",
    ),
  };
  const tenantService = { getTenantId: () => tenant };
  const strategy = { emitSignal: jest.fn(async () => undefined) };
  const commerce = { checkLimit: jest.fn(async () => ({ allowed: true })) };
  const service = new EmailCampaignService(
    repository as never,
    queue as never,
    cache as never,
    eventBus as never,
    subscribers as never,
    tenantService as never,
    strategy as never,
    commerce as never,
  );
  return {
    service,
    repository,
    queue,
    cache,
    eventBus,
    subscribers,
    strategy,
    commerce,
    campaign,
  };
}

describe("EmailCampaignService", () => {
  it("refuses to work without a tenant context", async () => {
    const { service } = setup(null);
    await expect(service.findAll()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  describe("create", () => {
    it("stores the campaign under the tenant with a generated slug and clears the list cache", async () => {
      const { service, repository, cache } = setup();
      const created = await service.create({
        name: "Yeni Kampanya",
        subject: "S",
        content: "C",
      } as never);
      expect(created).toMatchObject({
        tenantId: TENANT,
        name: "Yeni Kampanya",
      });
      expect(created.slug).toMatch(/^yeni-kampanya-[a-z0-9]+$/);
      expect(repository.save).toHaveBeenCalled();
      expect(cache.del).toHaveBeenCalledWith(`email-campaigns:${TENANT}:all`);
    });
  });

  describe("findAll / findOne", () => {
    it("serves the cached list when present", async () => {
      const { service, repository, cache, campaign } = setup();
      cache.get.mockResolvedValueOnce([campaign()] as never);
      await service.findAll();
      expect(repository.find).not.toHaveBeenCalled();
    });

    it("loads only this tenant from the database and caches it", async () => {
      const { service, repository, cache } = setup();
      await service.findAll();
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: TENANT },
        order: { createdAt: "DESC" },
      });
      expect(cache.set).toHaveBeenCalledWith(
        `email-campaigns:${TENANT}:all`,
        expect.any(Array),
        30,
      );
    });

    it("answers a missing or foreign campaign with 404", async () => {
      const { service, repository } = setup();
      repository.findOne.mockResolvedValueOnce(null as never);
      await expect(service.findOne("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: "missing", tenantId: TENANT },
      });
    });

    it("answers an unknown slug with 404", async () => {
      const { service, repository } = setup();
      repository.findOne.mockResolvedValueOnce(null as never);
      await expect(service.findBySlug("yok")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("update / remove", () => {
    it("updates within the tenant and clears id, slug and list caches", async () => {
      const { service, repository, cache } = setup();
      await service.update("c-1", { subject: "Yeni konu" } as never);
      expect(repository.update).toHaveBeenCalledWith(
        { id: "c-1", tenantId: TENANT },
        { subject: "Yeni konu" },
      );
      expect(cache.del).toHaveBeenCalledWith(`email-campaigns:${TENANT}:c-1`);
      expect(cache.del).toHaveBeenCalledWith(
        `email-campaigns:${TENANT}:slug:ekim-bulteni`,
      );
      expect(cache.del).toHaveBeenCalledWith(`email-campaigns:${TENANT}:all`);
    });

    it("rejects an update of a campaign that does not exist", async () => {
      const { service, repository } = setup();
      repository.findOne.mockResolvedValueOnce(null as never);
      await expect(
        service.update("missing", {} as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("deletes only within the tenant", async () => {
      const { service, repository } = setup();
      await service.remove("c-1");
      expect(repository.delete).toHaveBeenCalledWith({
        id: "c-1",
        tenantId: TENANT,
      });
    });
  });

  describe("sendCampaign", () => {
    it("queues one idempotent job per active, non-suppressed subscriber", async () => {
      const { service, queue, eventBus } = setup();
      await service.sendCampaign("c-1");
      expect(queue.add).toHaveBeenCalledTimes(1);
      expect(queue.add).toHaveBeenCalledWith(
        "sendCampaignEmail",
        expect.objectContaining({
          to: "a@acme.test",
          campaignId: "c-1",
          tenantId: TENANT,
        }),
        { jobId: expect.stringMatching(/^campaign-c-1-[0-9a-f]{64}$/) },
      );
      expect(eventBus.publishCampaignSent).toHaveBeenCalledWith(
        "c-1",
        1,
        TENANT,
        "system",
      );
    });

    it("clears the tenant-scoped cache entry so the new status is visible", async () => {
      const { service, cache } = setup();
      await service.sendCampaign("c-1");
      expect(cache.del).toHaveBeenCalledWith(`email-campaigns:${TENANT}:c-1`);
    });

    it("stops before sending when the plan limit is exhausted", async () => {
      const { service, commerce, queue } = setup();
      commerce.checkLimit.mockResolvedValueOnce({ allowed: false } as never);
      await expect(service.sendCampaign("c-1")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(queue.add).not.toHaveBeenCalled();
    });

    it("completes immediately when nobody can receive it", async () => {
      const { service, subscribers, repository, queue } = setup();
      subscribers.findAll.mockResolvedValueOnce([] as never);
      await service.sendCampaign("c-1");
      expect(queue.add).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "completed" }),
      );
    });
  });

  it("increments delivery counters within the tenant", async () => {
    const { service, repository } = setup();
    await service.incrementSentCount("c-1");
    await service.incrementOpenedCount("c-1");
    await service.incrementClickedCount("c-1");
    expect(repository.increment).toHaveBeenNthCalledWith(
      1,
      { id: "c-1", tenantId: TENANT },
      "sentCount",
      1,
    );
    expect(repository.increment).toHaveBeenNthCalledWith(
      2,
      { id: "c-1", tenantId: TENANT },
      "openedCount",
      1,
    );
    expect(repository.increment).toHaveBeenNthCalledWith(
      3,
      { id: "c-1", tenantId: TENANT },
      "clickedCount",
      1,
    );
  });

  describe("getCampaignStats", () => {
    it("derives rates from stored counters", async () => {
      const { service, repository, campaign } = setup();
      repository.findOne.mockResolvedValueOnce({
        ...campaign(),
        totalRecipients: 100,
        sentCount: 100,
        deliveredCount: 80,
        openedCount: 40,
        clickedCount: 10,
      } as never);
      await expect(service.getCampaignStats("c-1")).resolves.toMatchObject({
        completionRate: 100,
        deliveryRate: 80,
        openRate: 50,
        clickRate: 25,
      });
    });

    it("reports zero rates when nothing was sent", async () => {
      const { service } = setup();
      await expect(service.getCampaignStats("c-1")).resolves.toMatchObject({
        completionRate: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
      });
    });
  });
});
