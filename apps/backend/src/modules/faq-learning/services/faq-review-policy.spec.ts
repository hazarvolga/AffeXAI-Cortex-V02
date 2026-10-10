import { TenantService } from "../../../core/tenant/tenant.service";
import { IsNull } from "typeorm";
import { requireFaqTenant, requireFaqReviewer } from "./faq-review-policy";
describe("FAQ review tenant and reviewer boundaries", () => {
  const tenants = new TenantService();
  it.each([
    undefined,
    { tenantId: "ta", source: "public" },
    { source: "authenticated" },
  ])("rejects absent or public review scope %j", (context) =>
    expect(() =>
      tenants.runWithTenant(context || {}, () => requireFaqTenant(tenants)),
    ).toThrow(),
  );
  it("accepts authenticated and explicit system scopes", () => {
    for (const source of ["authenticated", "system"] as const)
      expect(
        tenants.runWithTenant({ tenantId: "ta", source }, () =>
          requireFaqTenant(tenants),
        ),
      ).toBe("ta");
  });
  const repo = { findOne: jest.fn() };
  const manager = { getRepository: () => repo };
  it.each([
    null,
    {
      id: "user",
      roleEntity: { name: "customer", tenantId: "ta", isActive: true },
    },
    {
      id: "user",
      roleEntity: { name: "admin", tenantId: "tb", isActive: true },
    },
    {
      id: "user",
      roleEntity: { name: "admin", tenantId: "ta", isActive: false },
    },
  ])("rejects untrusted reviewer %j", async (user) => {
    repo.findOne.mockResolvedValue(user);
    await expect(
      requireFaqReviewer(manager as never, "user", "ta"),
    ).rejects.toThrow();
    expect(repo.findOne).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          id: "user",
          tenantId: "ta",
          isActive: true,
          deletedAt: IsNull(),
        },
      }),
    );
  });
  it.each(["admin", "support_manager", "support_agent"])(
    "accepts active same tenant %s",
    async (name) => {
      const user = {
        id: "user",
        roleEntity: { name, tenantId: "ta", isActive: true },
      };
      repo.findOne.mockResolvedValue(user);
      expect(await requireFaqReviewer(manager as never, "user", "ta")).toBe(
        user,
      );
    },
  );
});
