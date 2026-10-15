import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { isConfiguredPlatformAdmin } from "../../core/auth/platform-admin.policy";
import { isValidPermission } from "../../core/auth/permissions";

export function isPlatformRoleName(name: unknown): boolean {
  return (
    typeof name === "string" &&
    ["super_admin", "superadmin"].includes(name.trim().toLowerCase())
  );
}

export function normalizeTenantRoleName(name: string): string {
  return name.trim().toLowerCase();
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item): item is string => typeof item === "string")
  );
}

export function assertTenantRoleDefinition(role: {
  name?: unknown;
  permissions?: unknown;
}): void {
  if (isPlatformRoleName(role.name)) {
    throw new ForbiddenException(
      "Platform roles cannot be managed through tenant role APIs",
    );
  }
  if (role.permissions !== undefined) {
    const permissions = role.permissions;
    if (!isStringArray(permissions)) {
      throw new BadRequestException("Permissions must be an array of strings");
    }
    if (
      permissions.some((permission) => {
        const normalized = permission.trim().toLowerCase();
        return normalized === "system.admin" || normalized === "*";
      })
    ) {
      throw new ForbiddenException(
        "Platform permissions cannot be granted through tenant role APIs",
      );
    }
    if (
      permissions.some(
        (permission) =>
          permission !== permission.trim() || !isValidPermission(permission),
      )
    ) {
      throw new BadRequestException("Unknown or malformed tenant permission");
    }
  }
}

export interface VerifiedPlatformActor {
  isPlatformAdmin?: boolean;
}

export function assertPlatformAccountMutation(
  userId: string,
  actor?: VerifiedPlatformActor,
): void {
  if (isConfiguredPlatformAdmin(userId) && actor?.isPlatformAdmin !== true) {
    throw new ForbiddenException(
      "Platform accounts require verified platform authority",
    );
  }
}
