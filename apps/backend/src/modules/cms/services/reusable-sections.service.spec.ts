import { FindOperator } from "typeorm";
import { ReusableSectionsService } from "./reusable-sections.service";

jest.mock("../../../core/tenant/tenant.service", () => ({
  TenantService: class {},
}));
jest.mock("./reusable-components.service", () => ({
  ReusableComponentsService: class {},
}));

const TENANT = "tenant-1";

type Row = {
  id: string;
  slug: string;
  name: string;
  tenantId: string;
  usageCount: number;
  components: unknown[];
  version: number;
};

function matchesId(rowId: string, id: unknown): boolean {
  if (id === undefined) return true;
  return id instanceof FindOperator ? rowId !== id.value : rowId === id;
}

function setup(rows: Row[]) {
  const sectionRepository = {
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
  const sectionComponentRepository = {
    create: jest.fn((value) => value),
    find: jest.fn(async () => [
      { id: "sc-1", reusableComponentId: "rc-1" },
      { id: "sc-2", reusableComponentId: null },
    ]),
  };
  const usageHistoryRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(),
  };
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(async (value) =>
        Array.isArray(value) ? value : { ...value, id: "copy" },
      ),
    },
  };
  const components = { trackUsage: jest.fn() };
  const service = new ReusableSectionsService(
    sectionRepository as never,
    sectionComponentRepository as never,
    usageHistoryRepository as never,
    {} as never,
    components as never,
    { createQueryRunner: () => queryRunner } as never,
    { getTenantId: () => TENANT } as never,
  );
  return {
    service,
    sectionRepository,
    sectionComponentRepository,
    usageHistoryRepository,
    queryRunner,
    components,
  };
}

const hero = (overrides: Partial<Row> = {}): Row => ({
  id: "s-1",
  slug: "giris",
  name: "Giriş",
  tenantId: TENANT,
  usageCount: 2,
  version: 1,
  components: [
    {
      id: "sc-1",
      reusableComponentId: "rc-1",
      componentType: "block",
      props: { title: "x" },
      orderIndex: 0,
    },
  ],
  ...overrides,
});

describe("ReusableSectionsService", () => {
  it("creates a section with a Turkish-aware slug under the tenant", async () => {
    const { service, sectionRepository } = setup([hero({ id: "saved" })]);
    await service.create(
      { name: "Ürün Vitrini", sectionType: "hero" } as never,
      "u-1",
    );
    expect(sectionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "urun-vitrini",
        tenantId: TENANT,
        authorId: "u-1",
      }),
    );
  });

  it("gives a renamed section a free slug when another section already uses it", async () => {
    const { service, sectionRepository } = setup([
      hero(),
      hero({ id: "s-2", slug: "vitrin", name: "Vitrin" }),
    ]);
    await service.update("s-1", { name: "Vitrin" } as never);
    expect(sectionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "s-1", slug: "vitrin-1" }),
    );
  });

  it("duplicates the section and its components in one transaction", async () => {
    const { service, queryRunner, sectionRepository } = setup([
      hero(),
      hero({ id: "copy", slug: "kopya" }),
    ]);
    await service.duplicate("s-1", { name: "Giriş kopyası" } as never, "u-1");
    expect(sectionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Giriş kopyası",
        isPublic: false,
        tenantId: TENANT,
      }),
    );
    expect(queryRunner.manager.save).toHaveBeenLastCalledWith([
      expect.objectContaining({
        sectionId: "copy",
        reusableComponentId: "rc-1",
        tenantId: TENANT,
      }),
    ]);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it("rolls the duplicate back when copying fails", async () => {
    const { service, queryRunner } = setup([hero()]);
    queryRunner.manager.save.mockRejectedValueOnce(
      new Error("disk full") as never,
    );
    await expect(
      service.duplicate("s-1", { name: "Kopya" } as never, "u-1"),
    ).rejects.toThrow("disk full");
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it("records usage for the section and the reusable components inside it", async () => {
    const { service, sectionRepository, usageHistoryRepository, components } =
      setup([hero()]);
    await service.trackUsage("s-1", "page", "p-1", "u-1");
    expect(sectionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ usageCount: 3 }),
    );
    expect(usageHistoryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        usableType: "reusable_section",
        usableId: "s-1",
        tenantId: TENANT,
      }),
    );
    expect(components.trackUsage).toHaveBeenCalledTimes(1);
    expect(components.trackUsage).toHaveBeenCalledWith(
      "rc-1",
      "page",
      "p-1",
      "u-1",
    );
  });
});
