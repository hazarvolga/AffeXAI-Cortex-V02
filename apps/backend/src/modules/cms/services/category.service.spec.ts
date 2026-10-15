import { BadRequestException, ConflictException } from "@nestjs/common";
import { CategoryService } from "./category.service";

jest.mock("../../../core/tenant/tenant.service", () => ({
  TenantService: class {},
}));

const TENANT = "tenant-1";

type Row = {
  id: string;
  parentId: string | null;
  slug?: string;
  name?: string;
  tenantId?: string;
};

function setup(rows: Row[] = []) {
  const byId = (id: string) => rows.find((row) => row.id === id) ?? null;
  const transactionManager = { update: jest.fn() };
  const repository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: "new", ...value })),
    find: jest.fn(async () => rows),
    findOne: jest.fn(
      async ({ where }: { where: { id?: string; slug?: string } }) =>
        where.id
          ? byId(where.id)
          : (rows.find((row) => row.slug === where.slug) ?? null),
    ),
    update: jest.fn(),
    manager: {
      transaction: jest.fn(
        async (work: (m: typeof transactionManager) => Promise<void>) =>
          work(transactionManager),
      ),
    },
  };
  const service = new CategoryService(
    repository as never,
    { getTenantId: () => TENANT } as never,
  );
  return { service, repository, transactionManager };
}

describe("CategoryService", () => {
  describe("create", () => {
    it("derives a slug from the name and stores the category under the tenant", async () => {
      const { service, repository } = setup();
      await service.create({ name: "New Cat" } as never);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { slug: "new-cat", tenantId: TENANT },
      });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "new-cat", tenantId: TENANT }),
      );
    });

    it("refuses a slug the tenant already uses", async () => {
      const { service } = setup([{ id: "a", parentId: null, slug: "tech" }]);
      await expect(
        service.create({ name: "Tech" } as never),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("getTree", () => {
    it("nests children under their parent", async () => {
      const { service } = setup([
        { id: "1", parentId: null, name: "Kök" },
        { id: "2", parentId: "1", name: "Alt" },
      ]);
      const tree = await service.getTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].children.map((child) => child.id)).toEqual(["2"]);
      expect(tree[0].children[0].level).toBe(1);
    });
  });

  describe("update", () => {
    const chain: Row[] = [
      { id: "1", parentId: null, slug: "one", tenantId: TENANT },
      { id: "2", parentId: "1", slug: "two", tenantId: TENANT },
      { id: "3", parentId: "2", slug: "three", tenantId: TENANT },
    ];

    it("rejects a parent that would create a cycle", async () => {
      const { service, repository } = setup(chain);
      await expect(
        service.update("1", { parentId: "3" } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it("rejects a category as its own parent", async () => {
      const { service } = setup(chain);
      await expect(
        service.update("2", { parentId: "2" } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("moves a category under a valid parent within the tenant", async () => {
      const { service, repository } = setup(chain);
      await service.update("3", { parentId: "1" } as never);
      expect(repository.update).toHaveBeenCalledWith(
        { id: "3", tenantId: TENANT },
        { parentId: "1" },
      );
    });
  });

  describe("batchUpdateCategories", () => {
    it("writes every move in one transaction", async () => {
      const { service, transactionManager } = setup([
        { id: "1", parentId: null },
      ]);
      await service.batchUpdateCategories([
        { id: "1", parentId: null, orderIndex: 0 },
      ]);
      expect(transactionManager.update).toHaveBeenCalledWith(
        expect.anything(),
        "1",
        { parentId: null, orderIndex: 0 },
      );
    });

    it("refuses the batch when any category is missing or foreign", async () => {
      const { service, repository, transactionManager } = setup([
        { id: "1", parentId: null },
      ]);
      repository.find.mockResolvedValueOnce([]);
      await expect(
        service.batchUpdateCategories([
          { id: "foreign", parentId: null, orderIndex: 0 },
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(transactionManager.update).not.toHaveBeenCalled();
    });
  });
});
