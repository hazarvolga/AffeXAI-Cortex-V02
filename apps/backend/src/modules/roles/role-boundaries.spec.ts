import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Repository } from "typeorm";
import { RolesService } from "./roles.service";
import { Role } from "./entities/role.entity";
import { RoleTemplate } from "./entities/role-template.entity";
import { TenantService } from "../../core/tenant/tenant.service";
import { UserRolesService } from "../users/user-roles.service";
import { User } from "../users/entities/user.entity";
import { UserRole } from "../users/entities/user-role.entity";
import { RolesGuard } from "../../core/auth/guards/roles.guard";
import { TEMPLATE_ROLES } from "../../core/database/seeds/1723456789001-TemplateRoles";
import { isValidPermission } from "../../core/auth/permissions";
import {
  PermissionsGuard,
  PermissionsGuardOr,
} from "../../core/auth/guards/permissions.guard";
function roleSetup() {
  const existing = {
    id: "r",
    tenantId: "a",
    name: "editor",
    isCustom: true,
    permissions: ["cms.read"],
  };
  const repo = {
    findOne: jest.fn(async () => null as typeof existing | null),
    find: jest.fn(
      async () => [] as Array<typeof existing & { userRoles?: unknown[] }>,
    ),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => x),
    remove: jest.fn(async (x) => x),
    softRemove: jest.fn(async (x) => x),
  };
  const manager = {
    withRepository: jest.fn(() => repo),
    query: jest.fn(async () => []),
  };
  Object.assign(repo, {
    manager: {
      query: manager.query,
      transaction: jest.fn(async (callback) => callback(manager)),
    },
  });
  const service = new RolesService(
    repo as unknown as Repository<Role>,
    {} as Repository<RoleTemplate>,
    { getTenantId: () => "a" } as TenantService,
  );
  return { service, repo, manager, existing };
}
function setup() {
  const user = { id: "u", tenantId: "a" };
  const role = {
    id: "r",
    tenantId: "a",
    name: "editor",
    permissions: ["cms.read"],
    isActive: true,
  };
  const users = { findOne: jest.fn(async () => user), update: jest.fn() };
  const queryBuilder = {
    innerJoin: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    getCount: jest.fn(async () => 1),
  };
  queryBuilder.innerJoin.mockReturnValue(queryBuilder);
  queryBuilder.where.mockReturnValue(queryBuilder);
  queryBuilder.andWhere.mockReturnValue(queryBuilder);
  const joins = {
    manager: { transaction: jest.fn(), query: jest.fn() },
    find: jest.fn(async () => []),
    delete: jest.fn(async () => ({ affected: 1 })),
    update: jest.fn(async () => ({ affected: 1 })),
    save: jest.fn(async (x) => x),
    createQueryBuilder: jest.fn(() => queryBuilder),
    findOne: jest.fn(async () => ({
      id: "j",
      userId: "u",
      tenantId: "a",
      isPrimary: false,
    })),
  };
  const roles = {
    findByIds: jest.fn(async () => [role]),
    findOne: jest.fn(async () => role),
  };
  joins.manager.transaction.mockImplementation(async (callback) =>
    callback({ withRepository: (repository: unknown) => repository }),
  );
  const service = new UserRolesService(
    joins as unknown as Repository<UserRole>,
    users as unknown as Repository<User>,
    roles as unknown as RolesService,
  );
  return { service, users, joins, roles, user, role, queryBuilder };
}
function context(user: object): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}
describe("Tenant role privilege boundaries", () => {
  it("returns persisted assignment counts without mutating role entities", async () => {
    const { service, repo, existing } = roleSetup();
    const persistedRole = {
      ...existing,
      userRoles: [{ id: "assignment", userId: "user-1" }],
      users: [{ id: "user-1" }, { id: "legacy-user" }],
    };
    repo.find.mockResolvedValue([persistedRole]);

    const result = await service.findAll();

    expect(result[0]).toEqual(
      expect.objectContaining({ id: "r", isSystem: false, userCount: 2 }),
    );
    expect(result[0]).not.toBe(persistedRole);
    expect(persistedRole).not.toHaveProperty("userCount");
    expect(result[0]).not.toHaveProperty("userRoles");
    expect(result[0]).not.toHaveProperty("users");
  });

  it("deletes an unassigned custom role inside a pessimistic transaction", async () => {
    const { service, repo, existing } = roleSetup();
    repo.findOne.mockResolvedValue({ ...existing } as never);

    await service.remove("r");

    expect((repo as any).manager.transaction).toHaveBeenCalledTimes(1);
    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "r", tenantId: "a" },
        lock: { mode: "pessimistic_write" },
      }),
    );
    expect(repo.softRemove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "r" }),
    );
  });

  it("rejects deleting custom roles assigned through either role model", async () => {
    const { service, repo, existing } = roleSetup();
    repo.findOne.mockResolvedValue({
      ...existing,
      displayName: "Editor",
    } as never);
    (repo as any).manager.transaction.mockImplementation(
      async (callback: (manager: any) => unknown) =>
        callback({
          withRepository: () => repo,
          query: jest.fn(async () => [{ assignment_count: 2 }]),
        }),
    );

    await expect(service.remove("r")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it("rejects deleting template roles even when they have no assignments", async () => {
    const { service, repo, existing } = roleSetup();
    repo.findOne.mockResolvedValue({
      ...existing,
      isCustom: false,
    } as never);

    await expect(service.remove("r")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it("exposes only explicit tenant permissions for role editors", () => {
    const { service } = roleSetup();
    const resources = service.getResources();
    expect(resources.map((resource) => resource.id)).toContain("users.view");
    expect(resources.map((resource) => resource.id)).not.toContain("*");
    expect(resources.map((resource) => resource.id)).not.toContain(
      "system.admin",
    );
    expect(new Set(resources.map((resource) => resource.id)).size).toBe(
      resources.length,
    );
  });
  it.each(["super_admin", "SUPERADMIN", " Super_Admin "])(
    "rejects reserved create %s",
    async (name) => {
      const { service, repo } = roleSetup();
      await expect(
        service.create({ name, displayName: "role" }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.save).not.toHaveBeenCalled();
    },
  );
  it("rejects reserved rename and permission grants", async () => {
    const { service, repo, existing } = roleSetup();
    repo.findOne.mockResolvedValue(existing);
    await expect(
      service.update("r", { name: "superadmin" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.update("r", { permissions: ["system.admin"] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.updatePermissions("r", ["system.admin"]),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.save).not.toHaveBeenCalled();
  });
  it("updates permissions through the same locked role transaction", async () => {
    const { service, repo, existing } = roleSetup();
    repo.findOne.mockResolvedValue(existing);

    await service.updatePermissions("r", ["cms.write"]);

    expect((repo as any).manager.transaction).toHaveBeenCalledTimes(1);
    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "r", tenantId: "a" },
        lock: { mode: "pessimistic_write" },
      }),
    );
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "r",
        permissions: ["cms.write"],
      }),
    );
  });
  it("rejects reserved create permissions", async () => {
    const { service, repo } = roleSetup();
    await expect(
      service.create({
        name: "editor",
        displayName: "role",
        permissions: ["system.admin"],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.save).not.toHaveBeenCalled();
  });
  it.each(["*", " system.admin "])(
    "rejects privileged tenant permission %s",
    async (permission) => {
      const { service, repo } = roleSetup();
      await expect(
        service.create({
          name: "editor",
          displayName: "role",
          permissions: [permission],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.save).not.toHaveBeenCalled();
    },
  );
  it("rejects permission identifiers outside the canonical catalog", async () => {
    const { service, repo } = roleSetup();
    await expect(
      service.create({
        name: "editor",
        displayName: "role",
        permissions: ["unknown.permission"],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });
  it("allows ordinary custom tenant roles", async () => {
    const { service, repo } = roleSetup();
    await service.create({
      name: "content_manager",
      displayName: "Content",
      permissions: ["cms.write"],
    });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "a", isCustom: true }),
    );
  });
  it("canonicalizes tenant role names before uniqueness checks and persistence", async () => {
    const { service, repo } = roleSetup();
    await service.create({
      name: "  Content_Manager  ",
      displayName: "Content",
    });
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { name: "content_manager", tenantId: "a" },
    });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: "content_manager" }),
    );
  });
  it("counts distinct users across junction and legacy role assignments", async () => {
    const { service, repo } = roleSetup();
    (repo as any).manager.query.mockResolvedValueOnce([
      { assignment_count: 2 },
    ]);
    await expect(service.getUserCount("r")).resolves.toBe(2);
    expect((repo as any).manager.query).toHaveBeenCalledWith(
      expect.stringContaining("UNION"),
      ["r", "a"],
    );
  });
  it.each([
    { update: { isActive: false }, label: "deactivation" },
    { update: { name: "editor" }, label: "rename" },
  ])("rejects last administrator role $label", async ({ update }) => {
    const { service, repo, existing } = roleSetup();
    Object.assign(existing, { name: "admin", isActive: true });
    repo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(null);
    const transactionManager = (repo as any).manager.transaction;
    transactionManager.mockImplementation(
      async (callback: (manager: any) => unknown) =>
        callback({
          withRepository: () => repo,
          query: jest
            .fn()
            .mockResolvedValueOnce([{ id: "org-a" }])
            .mockResolvedValueOnce([
              { affected_admins: true, other_admin_count: 0 },
            ]),
        }),
    );

    await expect(service.update("r", update as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });
  it("recognizes every permission shipped by the role template seed", () => {
    const seeded = TEMPLATE_ROLES.flatMap((role) => role.defaultPermissions);
    expect(
      seeded.filter((permission) => !isValidPermission(permission)),
    ).toEqual([]);
  });
  it("rejects absent tenant rather than deriving authority from target user", async () => {
    const { service, joins, users } = setup();
    await expect(service.assignRoles("u", "r")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(joins.save).not.toHaveBeenCalled();
    expect(users.update).not.toHaveBeenCalled();
  });
  it.each(["assign", "remove"])(
    "rejects foreign target before %s writes",
    async (op) => {
      const { service, joins, users, user } = setup();
      user.tenantId = "b";
      await expect(
        op === "assign"
          ? service.assignRoles("u", "r", [], true, undefined, "a")
          : service.removeRole("u", "r", "a"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(joins.save).not.toHaveBeenCalled();
      expect(joins.delete).not.toHaveBeenCalled();
      expect(users.update).not.toHaveBeenCalled();
    },
  );
  it.each(["foreign", "platform-name", "platform-permission"])(
    "rejects %s role assignment",
    async (kind) => {
      const { service, joins, users, role } = setup();
      if (kind === "foreign") role.tenantId = "b";
      if (kind === "platform-name") role.name = "super_admin";
      if (kind === "platform-permission") role.permissions = ["system.admin"];
      await expect(
        service.assignRoles("u", "r", [], true, undefined, "a"),
      ).rejects.toThrow();
      expect(joins.save).not.toHaveBeenCalled();
      expect(joins.delete).not.toHaveBeenCalled();
      expect(users.update).not.toHaveBeenCalled();
    },
  );
  it("rejects inactive role assignment before replacing existing roles", async () => {
    const { service, joins, users, role } = setup();
    role.name = "admin";
    role.isActive = false;
    await expect(
      service.assignRoles("u", "r", [], true, undefined, "a"),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(joins.delete).not.toHaveBeenCalled();
    expect(users.update).not.toHaveBeenCalled();
  });
  it("makes additive assignment replace only the primary designation", async () => {
    const { service, joins } = setup();
    await service.assignRoles("u", "r", [], false, undefined, "a");
    expect(joins.update).toHaveBeenCalledWith(
      { userId: "u", tenantId: "a", isPrimary: true },
      { isPrimary: false },
    );
    expect(joins.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u",
        tenantId: "a",
      }),
    );
  });
  it("preserves ordinary assignment and scoped token invalidation", async () => {
    const { service, users, joins } = setup();
    await service.assignRoles("u", "r", [], true, "admin", "a");
    expect(joins.save).toHaveBeenCalledWith([
      expect.objectContaining({ tenantId: "a", roleId: "r", userId: "u" }),
    ]);
    expect(users.update).toHaveBeenCalledWith(
      { id: "u", tenantId: "a" },
      expect.objectContaining({
        roleId: "r",
        tokenVersion: expect.any(Function),
      }),
    );
    expect(joins.manager.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM users"),
      ["u", "a"],
    );
  });
  it.each([
    "userHasRole",
    "userHasAnyRole",
    "getUsersByRole",
    "countUsersByRole",
  ] as const)(
    "rejects omitted tenant on %s before repository access",
    async (method) => {
      const { service, joins } = setup();
      const args =
        method === "userHasAnyRole"
          ? ["u", ["admin"]]
          : method === "userHasRole"
            ? ["u", "admin"]
            : ["r"];
      await expect(
        (service[method] as (...values: any[]) => Promise<unknown>)(...args),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(joins.find).not.toHaveBeenCalled();
    },
  );
  it.each(["userHasRole", "userHasAnyRole"] as const)(
    "ignores inactive assignments in %s",
    async (method) => {
      const { service, queryBuilder } = setup();
      const args =
        method === "userHasAnyRole"
          ? ["u", ["admin"], "a"]
          : ["u", "admin", "a"];
      await (service[method] as (...values: any[]) => Promise<boolean>)(
        ...args,
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        "role.isActive = true",
      );
    },
  );
  it.each(["admin", "super_admin"])(
    "does not grant %s from untrusted superadmin name",
    async (required) => {
      const reflector = {
        getAllAndOverride: () => [required],
      } as unknown as Reflector;
      await expect(
        new RolesGuard(reflector).canActivate(
          context({ roleNames: ["super_admin"] }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
  it.each([PermissionsGuard, PermissionsGuardOr])(
    "does not grant wildcard or explicit platform permission: %p",
    async (Guard) => {
      for (const required of ["users.delete", "system.admin"]) {
        const reflector = {
          getAllAndOverride: () => [required],
        } as unknown as Reflector;
        await expect(
          new Guard(reflector).canActivate(
            context({
              roleNames: ["super_admin"],
              roles: [{ permissions: ["system.admin"] }],
            }),
          ),
        ).rejects.toBeInstanceOf(ForbiddenException);
      }
    },
  );
  it("allows server-verified platform authority without relying on tenant roles", async () => {
    const reflector = {
      getAllAndOverride: () => ["super_admin"],
    } as unknown as Reflector;
    await expect(
      new RolesGuard(reflector).canActivate(context({ isPlatformAdmin: true })),
    ).resolves.toBe(true);
  });
  it.each(["missing-tenant", "foreign-role", "reserved-role"])(
    "rejects role removal %s before writes",
    async (kind) => {
      const { service, joins, users, role } = setup();
      if (kind === "foreign-role") role.tenantId = "b";
      if (kind === "reserved-role") role.name = "superadmin";
      await expect(
        service.removeRole(
          "u",
          "r",
          kind === "missing-tenant" ? undefined : "a",
        ),
      ).rejects.toThrow();
      expect(joins.delete).not.toHaveBeenCalled();
      expect(users.update).not.toHaveBeenCalled();
    },
  );
  it("allows same-tenant secondary role removal", async () => {
    const { service, joins, users } = setup();
    await service.removeRole("u", "r", "a");
    expect(joins.delete).toHaveBeenCalledWith({ id: "j", tenantId: "a" });
    expect(users.update).toHaveBeenCalledWith(
      { id: "u", tenantId: "a" },
      expect.objectContaining({ tokenVersion: expect.any(Function) }),
    );
    expect(joins.manager.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM users"),
      ["u", "a"],
    );
    expect(joins.manager.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM roles"),
      ["r", "a"],
    );
  });
  it("rejects a raced role removal when no assignment row was deleted", async () => {
    const { service, joins, users } = setup();
    joins.delete.mockResolvedValueOnce({ affected: 0 });
    await expect(service.removeRole("u", "r", "a")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(users.update).not.toHaveBeenCalled();
  });
  it.each([PermissionsGuard, PermissionsGuardOr])(
    "preserves ordinary permissions and server platform authority: %p",
    async (Guard) => {
      const reflector = {
        getAllAndOverride: () => ["cms.read"],
      } as unknown as Reflector;
      await expect(
        new Guard(reflector).canActivate(
          context({ roles: [{ permissions: ["cms.read"] }] }),
        ),
      ).resolves.toBe(true);
      await expect(
        new Guard(reflector).canActivate(context({ isPlatformAdmin: true })),
      ).resolves.toBe(true);
    },
  );
  it("preserves ordinary admin role access", async () => {
    const reflector = {
      getAllAndOverride: () => ["admin"],
    } as unknown as Reflector;
    await expect(
      new RolesGuard(reflector).canActivate(context({ roleNames: ["admin"] })),
    ).resolves.toBe(true);
  });
  it.each(["organization_owner", "organization_admin"])(
    "treats %s as a tenant administrator without granting platform authority",
    async (roleName) => {
      const adminReflector = {
        getAllAndOverride: () => ["admin"],
      } as unknown as Reflector;
      const platformReflector = {
        getAllAndOverride: () => ["super_admin"],
      } as unknown as Reflector;
      await expect(
        new RolesGuard(adminReflector).canActivate(
          context({ roleNames: [roleName] }),
        ),
      ).resolves.toBe(true);
      await expect(
        new RolesGuard(platformReflector).canActivate(
          context({ roleNames: [roleName] }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
  it("validates standalone permission body and protects existing platform roles", async () => {
    const { service, repo, existing } = roleSetup();
    repo.findOne.mockResolvedValue(existing);
    await expect(
      service.updatePermissions("r", null as unknown as string[]),
    ).rejects.toBeInstanceOf(BadRequestException);
    existing.name = "super_admin";
    await expect(
      service.update("r", { displayName: "Changed" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.save).not.toHaveBeenCalled();
  });
  it.each(["getUserRoles", "getPrimaryRole"] as const)(
    "rejects omitted tenant on %s before repository access",
    async (method) => {
      const { service, joins } = setup();
      await expect(service[method]("u")).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(joins.findOne).not.toHaveBeenCalled();
      expect(joins.find).not.toHaveBeenCalled();
    },
  );
  it("role replacement and token invalidation share a transaction", async () => {
    const { service, users, joins } = setup();
    users.update.mockRejectedValue(new Error("version write failed"));
    await expect(
      service.assignRoles("u", "r", [], true, undefined, "a"),
    ).rejects.toThrow("version write failed");
    expect(joins.manager.transaction).toHaveBeenCalledTimes(1);
  });
  it("cannot demote the last active organization administrator", async () => {
    const { service, joins, user } = setup();
    Object.assign(user, { organizationId: "org-a", isActive: true });
    joins.manager.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ is_admin: true, admin_count: 1 }]);
    await expect(
      service.assignRoles("u", "r", [], true, undefined, "a"),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(joins.delete).not.toHaveBeenCalled();
    expect(joins.save).not.toHaveBeenCalled();
  });
});
