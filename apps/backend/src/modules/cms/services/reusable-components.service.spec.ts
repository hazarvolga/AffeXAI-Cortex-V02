import { BadRequestException, NotFoundException } from "@nestjs/common";
import { FindOperator } from "typeorm";
import { ReusableComponentsService } from "./reusable-components.service";

jest.mock("../../../core/tenant/tenant.service", () => ({
  TenantService: class {},
}));

const TENANT = "tenant-1";

type Row = {
  id: string;
  slug: string;
  name: string;
  tenantId: string;
  usageCount: number;
};

function matchesId(rowId: string, id: unknown): boolean {
  if (id === undefined) return true;
  return id instanceof FindOperator ? rowId !== id.value : rowId === id;
}

function setup(rows: Row[] = []) {
  const componentRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: value.id ?? "saved", ...value })),
    findOne: jest.fn(
      async ({
        where,
      }: {
        where: { id?: unknown; slug?: string; tenantId: string };
      }) =>
        rows.find(
          (row) =>
            row.tenantId === where.tenantId &&
            (where.slug === undefined || row.slug === where.slug) &&
            matchesId(row.id, where.id),
        ) ?? null,
    ),
  };
  const usageHistoryRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(),
  };
  const favoriteRepository = {
    findOne: jest.fn(async () => null as unknown),
    create: jest.fn((value) => value),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const service = new ReusableComponentsService(
    componentRepository as never,
    usageHistoryRepository as never,
    favoriteRepository as never,
    { getTenantId: () => TENANT } as never,
  );
  return {
    service,
    componentRepository,
    usageHistoryRepository,
    favoriteRepository,
  };
}

const card = (overrides: Partial<Row> = {}): Row => ({
  id: "c-1",
  slug: "kart",
  name: "Kart",
  tenantId: TENANT,
  usageCount: 0,
  ...overrides,
});

describe("ReusableComponentsService", () => {
  describe("slugs", () => {
    it("creates with a Turkish-aware slug and the next free counter", async () => {
      const { service, componentRepository } = setup([
        card({ slug: "urun-karti" }),
      ]);
      await service.create({ name: "Ürün Kartı" } as never, "u-1");
      expect(componentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: "urun-karti-1",
          tenantId: TENANT,
          authorId: "u-1",
        }),
      );
    });

    it("does not reuse a slug another component holds when renaming", async () => {
      const { service, componentRepository } = setup([
        card(),
        card({ id: "c-2", slug: "banner", name: "Banner" }),
      ]);
      await service.update("c-1", { name: "Banner" } as never);
      expect(componentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: "c-1", slug: "banner-1" }),
      );
    });
  });

  it("counts usage and records where the component was used", async () => {
    const { service, componentRepository, usageHistoryRepository } = setup([
      card({ usageCount: 4 }),
    ]);
    await service.trackUsage("c-1", "page", "p-1", "u-1");
    expect(componentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ usageCount: 5 }),
    );
    expect(usageHistoryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        usableType: "reusable_component",
        usableId: "c-1",
        usedInId: "p-1",
        tenantId: TENANT,
      }),
    );
  });

  describe("favorites", () => {
    it("adds a favorite once per user and component", async () => {
      const { service, favoriteRepository } = setup([card()]);
      await service.addToFavorites("c-1", "u-1");
      expect(favoriteRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "u-1",
          favoritableId: "c-1",
          tenantId: TENANT,
        }),
      );
      favoriteRepository.findOne.mockResolvedValueOnce({ id: "fav-1" });
      await expect(service.addToFavorites("c-1", "u-1")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("refuses to favorite a component from another tenant", async () => {
      const { service } = setup([card({ tenantId: "other" })]);
      await expect(service.addToFavorites("c-1", "u-1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("removes an existing favorite and reports a missing one", async () => {
      const { service, favoriteRepository } = setup([card()]);
      favoriteRepository.findOne.mockResolvedValueOnce({ id: "fav-1" });
      await service.removeFromFavorites("c-1", "u-1");
      expect(favoriteRepository.remove).toHaveBeenCalledWith({ id: "fav-1" });
      await expect(
        service.removeFromFavorites("c-1", "u-1"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("import", () => {
    it("creates new components and skips names the tenant already has", async () => {
      const { service, componentRepository } = setup([card()]);
      const result = await service.import(
        [{ name: "Kart" }, { name: "Yeni Blok" }] as never,
        "u-1",
      );
      expect(result).toMatchObject({ success: 1, failed: 1 });
      expect(componentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "yeni-blok" }),
      );
    });

    it("overwrites the existing component instead of duplicating it", async () => {
      const { service, componentRepository } = setup([card()]);
      const result = await service.import(
        [{ name: "Kart", description: "Güncel" }] as never,
        "u-1",
        true,
      );
      expect(result).toMatchObject({ success: 1, failed: 0 });
      expect(componentRepository.create).not.toHaveBeenCalled();
      expect(componentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: "c-1", description: "Güncel" }),
      );
    });
  });
});
