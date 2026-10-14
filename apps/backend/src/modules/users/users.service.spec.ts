import { BadRequestException, NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";

jest.mock("../commerce/services/commerce.service", () => ({
  CommerceService: class {},
}));
jest.mock("../crm/crm.service", () => ({ CrmService: class {} }));
jest.mock("./services/user-email.service", () => ({
  UserEmailService: class {},
}));
jest.mock("../../core/shared/services/cache.service", () => ({
  CacheService: class {},
}));

const TENANT = "acme";

function setup(tenant: string | null = TENANT) {
  const stored = {
    id: "u-1",
    tenantId: TENANT,
    email: "kisi@acme.test",
    firstName: "Eski",
    lastName: "Ad",
    phone: "1",
    city: "",
    country: "",
    address: "",
    bio: "",
    roleId: "r-1",
    isActive: true,
    metadata: { isCustomer: true },
    userRoles: [],
  };
  const repo = {
    findOne: jest.fn(async () => ({ ...stored })),
    update: jest.fn(),
    count: jest.fn(async () => 3),
    createQueryBuilder: jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(async () => [
        { role: "Yönetici", count: "2" },
        { role: null, count: "1" },
      ]),
    })),
  };
  const cache = { del: jest.fn() };
  const service = new UsersService(
    repo as never,
    {} as never,
    cache as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { getTenantId: () => tenant } as never,
    { emit: jest.fn() } as never,
    {} as never,
  );
  return { service, repo, cache, stored };
}

describe("UsersService", () => {
  beforeEach(() =>
    jest.spyOn(console, "log").mockImplementation(() => undefined),
  );
  afterEach(() => jest.restoreAllMocks());

  describe("findOne", () => {
    it("looks the user up inside the current tenant only", async () => {
      const { service, repo } = setup();
      await service.findOne("u-1");
      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "u-1", tenantId: TENANT } }),
      );
    });

    it("answers a missing user with 404", async () => {
      const { service, repo } = setup();
      repo.findOne.mockResolvedValueOnce(null as never);
      await expect(service.findOne("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("treats a user from another tenant as missing", async () => {
      const { service, repo, stored } = setup();
      repo.findOne.mockResolvedValueOnce({
        ...stored,
        tenantId: "other",
      } as never);
      await expect(service.findOne("u-1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("getStats", () => {
    it("refuses to count users without a tenant context", async () => {
      const { service } = setup(null);
      await expect(service.getStats()).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("reports tenant totals and per-role counts", async () => {
      const { service, repo } = setup();
      const stats = await service.getStats();
      expect(repo.count).toHaveBeenCalledWith({ where: { tenantId: TENANT } });
      expect(stats.byRole).toEqual([
        { role: "Yönetici", count: 2 },
        { role: "No Role", count: 1 },
      ]);
    });
  });

  describe("updateOwnProfile", () => {
    it("writes only self-editable columns, keeps other metadata and clears caches", async () => {
      const { service, repo, cache } = setup();
      await service.updateOwnProfile("u-1", TENANT, {
        city: "İzmir",
        metadata: { notificationPreferences: { email: false } },
      });
      expect(repo.update).toHaveBeenCalledWith(
        { id: "u-1", tenantId: TENANT },
        expect.objectContaining({
          city: "İzmir",
          firstName: "Eski",
          metadata: {
            isCustomer: true,
            notificationPreferences: { email: false },
          },
        }),
      );
      const written = repo.update.mock.calls[0][1] as Record<string, unknown>;
      expect(Object.keys(written)).not.toEqual(
        expect.arrayContaining(["email", "roleId", "isActive", "tenantId"]),
      );
      expect(cache.del).toHaveBeenCalledWith("users:u-1");
      expect(cache.del).toHaveBeenCalledWith("users:email:kisi@acme.test");
    });
  });
});
