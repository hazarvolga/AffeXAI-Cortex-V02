import { NotFoundException } from "@nestjs/common";
import { PageStatus } from "@affexai/shared-types";
import { PageService } from "./page.service";

jest.mock("../../platform-integration/services/event-bus.service", () => ({
  EventBusService: class {},
}));
jest.mock("../../../core/tenant/tenant.service", () => ({
  TenantService: class {},
}));

const TENANT = "acme";

function setup() {
  const stored = () => ({
    id: "page-1",
    tenantId: TENANT,
    name: "Hakkımızda",
    title: "Hakkımızda",
    slug: "hakkimizda",
    description: "Biz kimiz",
    status: PageStatus.DRAFT,
    publishedAt: null as Date | null,
    categoryId: null,
    layoutOptions: { showHeader: true },
    components: [
      {
        id: "c-1",
        pageId: "page-1",
        type: "block",
        props: { title: "x" },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });
  const updateBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn(async () => ({
      raw: [{ id: "page-1", slug: "hakkimizda" }],
    })),
  };
  const repository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: "new-page", ...value })),
    findOne: jest.fn(async () => stored()),
    update: jest.fn<
      Promise<{ affected: number }>,
      [unknown, Record<string, unknown>]
    >(async () => ({ affected: 1 })),
    delete: jest.fn(async () => ({ affected: 2 })),
    createQueryBuilder: jest.fn(() => updateBuilder),
    manager: {
      create: jest.fn((_entity, value) => value),
      save: jest.fn(async () => []),
      createQueryBuilder: jest.fn(),
    },
  };
  const eventBus = { publishPagePublished: jest.fn(async () => undefined) };
  const service = new PageService(
    repository as never,
    eventBus as never,
    { getTenantId: () => TENANT } as never,
  );
  return { service, repository, eventBus, stored, updateBuilder };
}

describe("PageService", () => {
  describe("create", () => {
    it("stores the title in both title and name for the tenant", async () => {
      const { service, repository } = setup();
      await service.create({
        title: "Kabul Sayfası",
        slug: "kabul",
        status: "draft",
      } as never);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Kabul Sayfası",
          name: "Kabul Sayfası",
          slug: "kabul",
          tenantId: TENANT,
        }),
      );
    });
  });

  describe("update", () => {
    it("keeps title and name in step and scopes the write to the tenant", async () => {
      const { service, repository } = setup();
      await service.update("page-1", {
        title: "Yeni Başlık",
        slug: "yeni",
      } as never);
      expect(repository.update).toHaveBeenCalledWith(
        { id: "page-1", tenantId: TENANT },
        expect.objectContaining({
          title: "Yeni Başlık",
          name: "Yeni Başlık",
          slug: "yeni",
        }),
      );
    });

    it("leaves the title alone when the update does not carry one", async () => {
      const { service, repository } = setup();
      await service.update("page-1", { slug: "yeni" } as never);
      const written = repository.update.mock.calls[0][1];
      expect(written).not.toHaveProperty("title");
      expect(written).not.toHaveProperty("name");
    });

    it("answers a page from another tenant with 404", async () => {
      const { service, repository } = setup();
      repository.findOne.mockResolvedValueOnce(null as never);
      await expect(
        service.update("foreign", { slug: "x" } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("publish / unpublish", () => {
    it("publishes, stamps the time and emits the tenant event", async () => {
      const { service, repository, eventBus } = setup();
      const page = await service.publish("page-1");
      expect(page.status).toBe(PageStatus.PUBLISHED);
      expect(page.publishedAt).toBeInstanceOf(Date);
      expect(repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "page-1", tenantId: TENANT } }),
      );
      expect(eventBus.publishPagePublished).toHaveBeenCalledWith(
        "page-1",
        "hakkimizda",
        TENANT,
      );
    });

    it("returns a published page to draft and clears the publish time", async () => {
      const { service, repository, stored } = setup();
      repository.findOne.mockResolvedValueOnce({
        ...stored(),
        status: PageStatus.PUBLISHED,
        publishedAt: new Date(),
      } as never);
      const page = await service.unpublish("page-1");
      expect(page.status).toBe(PageStatus.DRAFT);
      expect(page.publishedAt).toBeNull();
    });

    it("answers a missing page with 404 instead of a server error", async () => {
      const { service, repository } = setup();
      repository.findOne.mockResolvedValue(null as never);
      await expect(service.publish("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.unpublish("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("clone", () => {
    it("creates a draft copy with a title, a new slug and copied components", async () => {
      const { service, repository } = setup();
      await service.clone("page-1");
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Hakkımızda (Kopya)",
          name: "Hakkımızda (Kopya)",
          status: PageStatus.DRAFT,
          tenantId: TENANT,
          slug: expect.stringMatching(/^hakkimizda-copy-\d+$/),
        }),
      );
      expect(repository.manager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ pageId: "new-page", type: "block" }),
      );
    });
  });

  describe("bulk operations", () => {
    it("publishes only rows that changed and reports the rest as failed", async () => {
      const { service, updateBuilder, eventBus } = setup();
      await expect(
        service.bulkPublish(["page-1", "page-1", "foreign"]),
      ).resolves.toEqual({ successCount: 1, failedCount: 1 });
      expect(updateBuilder.andWhere).toHaveBeenCalledWith(
        "tenantId = :tenantId",
        { tenantId: TENANT },
      );
      expect(eventBus.publishPagePublished).toHaveBeenCalledTimes(1);
    });

    it("deletes within the tenant and counts what was removed", async () => {
      const { service, repository } = setup();
      await expect(service.bulkDelete(["a", "b", "c"])).resolves.toEqual({
        successCount: 2,
        failedCount: 1,
      });
      expect(repository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT }),
      );
    });
  });
});
