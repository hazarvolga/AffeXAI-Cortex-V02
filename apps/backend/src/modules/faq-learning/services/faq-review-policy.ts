import { ForbiddenException } from "@nestjs/common";
import { EntityManager, IsNull } from "typeorm";
import { TenantService } from "../../../core/tenant/tenant.service";
import { User } from "../../users/entities/user.entity";
import { isConfiguredPlatformAdmin } from "../../../core/auth/platform-admin.policy";

export function requireFaqTenant(tenants: TenantService): string {
  const context = tenants.getTenantContext();
  if (
    !context?.tenantId ||
    !["authenticated", "system"].includes(context.source || "")
  ) {
    throw new ForbiddenException("Verified FAQ tenant context required");
  }
  return context.tenantId;
}

export async function requireFaqReviewer(
  manager: EntityManager,
  reviewerId: string,
  tenantId: string,
): Promise<User> {
  if (!reviewerId) throw new ForbiddenException("Verified reviewer required");
  const user = await manager.getRepository(User).findOne({
    where: { id: reviewerId, tenantId, isActive: true, deletedAt: IsNull() },
    relations: ["roleEntity", "userRoles", "userRoles.role"],
  });
  const roles = [
    user?.roleEntity,
    ...(user?.userRoles?.map((assignment) => assignment.role) || []),
  ];
  if (
    !user ||
    (!isConfiguredPlatformAdmin(user.id) &&
      !roles.some(
        (role) =>
          role?.tenantId === tenantId &&
          role.isActive === true &&
          ["admin", "support_manager", "support_agent"].includes(role.name),
      ))
  ) {
    throw new ForbiddenException("Active same-tenant FAQ reviewer required");
  }
  return user;
}

/** Public selectors authorize published projections only, never review authority. */
export function requireFaqReadTenant(
  tenants: TenantService,
  hint?: string,
): string {
  const context = tenants.getTenantContext();
  if (
    !context?.tenantId ||
    !["public", "authenticated", "system"].includes(context.source || "") ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(context.tenantId) ||
    (hint !== undefined && hint !== context.tenantId)
  ) {
    throw new ForbiddenException("Explicit valid FAQ tenant context required");
  }
  return context.tenantId;
}
