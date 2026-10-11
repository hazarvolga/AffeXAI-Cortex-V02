import type { User } from "@affexai/shared-types";
import type { CurrentUser } from "@/lib/api";

export function normalizeSyncedUser(user: User): Partial<CurrentUser> {
  const createdAt = user.createdAt;

  return {
    ...user,
    createdAt:
      createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
  };
}
