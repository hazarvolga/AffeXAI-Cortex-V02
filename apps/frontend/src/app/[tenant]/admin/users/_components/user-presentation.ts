import type { User } from "@/services/user-management.service";

export function userDisplayName(
  user: Pick<User, "firstName" | "lastName" | "email">,
): string {
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return name || user.email;
}

export function userRoleId(
  user: Pick<User, "primaryRole" | "roleEntity">,
): string | undefined {
  return user.primaryRole?.id ?? user.roleEntity?.id;
}

export function userRoleLabel(
  user: Pick<User, "primaryRole" | "roleEntity" | "role">,
): string {
  const role = user.primaryRole ?? user.roleEntity;
  return role?.displayName || role?.name || user.role || "Rol atanmamış";
}

export const USER_STATUS_LABEL: Record<User["status"], string> = {
  active: "Aktif",
  invited: "Doğrulama bekliyor",
  disabled: "Pasif",
};
