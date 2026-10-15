import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { MenuLocation } from "@affexai/shared-types";
import { MenuService } from "./menu.service";

jest.mock("../../../core/tenant/tenant.service", () => ({
  TenantService: class {},
}));

const TENANT = "tenant-1";

type Item = {
  id: string;
  menuId: string;
  parentId: string | null;
  orderIndex: number;
  label: string;
};

function setup(items: Item[] = []) {
  const menu = {
    id: "m-1",
    name: "Ana menü",
    slug: "ana-menu",
    tenantId: TENANT,
  };
  const transactionManager = { update: jest.fn() };
  const menuRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: "new", ...value })),
    findOne: jest.fn(
      async ({
        where,
      }: {
        where: { id?: string; slug?: string; tenantId: string };
      }) =>
        where.tenantId === TENANT &&
        (where.id === menu.id || where.slug === menu.slug)
          ? { ...menu }
          : null,
    ),
    find: jest.fn(async () => [menu]),
  };
  const menuItemRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: "new-item", ...value })),
    find: jest.fn(async () => items),
    findOne: jest.fn(async ({ where }: { where: { id: string } }) => {
      const item = items.find((candidate) => candidate.id === where.id);
      return item ? { ...item, menu } : null;
    }),
    update: jest.fn(),
    manager: {
      transaction: jest.fn(
        async (work: (m: typeof transactionManager) => Promise<void>) =>
          work(transactionManager),
      ),
    },
  };
  const service = new MenuService(
    menuRepository as never,
    menuItemRepository as never,
    { getTenantId: () => TENANT } as never,
  );
  return { service, menuRepository, menuItemRepository, transactionManager };
}

const tree: Item[] = [
  {
    id: "root",
    menuId: "m-1",
    parentId: null,
    orderIndex: 0,
    label: "Ana sayfa",
  },
  {
    id: "child",
    menuId: "m-1",
    parentId: "root",
    orderIndex: 0,
    label: "Ürünler",
  },
  {
    id: "grandchild",
    menuId: "m-1",
    parentId: "child",
    orderIndex: 0,
    label: "Yazılım",
  },
];

describe("MenuService", () => {
  describe("menus", () => {
    it("creates a menu with a slug under the tenant", async () => {
      const { service, menuRepository } = setup();
      await service.createMenu({
        name: "Alt Bilgi",
        location: MenuLocation.FOOTER,
      } as never);
      expect(menuRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "alt-bilgi", tenantId: TENANT }),
      );
    });

    it("refuses a slug the tenant already uses", async () => {
      const { service } = setup();
      await expect(
        service.createMenu({ name: "Ana Menü", slug: "ana-menu" } as never),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("loads a menu with its items nested, without looping", async () => {
      const { service, menuItemRepository } = setup(tree);
      const menu = await service.findOneMenu("m-1");
      expect(menu.items.map((item) => item.id)).toEqual(["root"]);
      expect(
        (
          menu.items[0] as unknown as {
            children: Array<{ id: string; children: Array<{ id: string }> }>;
          }
        ).children[0].children[0].id,
      ).toBe("grandchild");
      expect(menuItemRepository.find).toHaveBeenCalledTimes(1);
    });

    it("answers a foreign menu with 404 for the menu and for its items", async () => {
      const { service } = setup(tree);
      await expect(service.findOneMenu("foreign")).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.findMenuItems("foreign")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("lists the items of an owned menu", async () => {
      const { service } = setup(tree);
      await expect(service.findMenuItems("m-1")).resolves.toHaveLength(3);
    });
  });

  describe("menu items", () => {
    it("creates an item in an owned menu", async () => {
      const { service, menuItemRepository } = setup(tree);
      await service.createMenuItem({
        menuId: "m-1",
        label: "İletişim",
        parentId: "root",
      } as never);
      expect(menuItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ label: "İletişim", menuId: "m-1" }),
      );
    });

    it("rejects a parent that would create a cycle", async () => {
      const { service, menuItemRepository } = setup(tree);
      await expect(
        service.updateMenuItem("root", { parentId: "grandchild" } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(menuItemRepository.update).not.toHaveBeenCalled();
    });

    it("moves the batch in one transaction and refuses items from other menus", async () => {
      const { service, transactionManager } = setup(tree);
      await service.batchUpdateMenuItems("m-1", [
        { id: "child", parentId: null, orderIndex: 1 },
      ]);
      expect(transactionManager.update).toHaveBeenCalledWith(
        expect.anything(),
        "child",
        { parentId: null, orderIndex: 1 },
      );
      await expect(
        service.batchUpdateMenuItems("m-1", [
          { id: "elsewhere", parentId: null, orderIndex: 0 },
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
