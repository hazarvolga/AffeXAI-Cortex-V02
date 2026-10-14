import type { LoginResponse } from "@affexai/shared-types";
import { requireTenantSlug } from "./tenant-selection";

export interface WorkspaceChoice {
  slug: string;
  name: string;
}

/** Several workspaces accepted the password; the user picks one, no token yet. */
export interface TenantSelectionRequired {
  requiresTenantSelection: true;
  tenants: WorkspaceChoice[];
}

export type LoginOutcome = LoginResponse | TenantSelectionRequired;

export function isTenantSelection(
  value: unknown,
): value is TenantSelectionRequired {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<TenantSelectionRequired>;
  return (
    candidate.requiresTenantSelection === true &&
    Array.isArray(candidate.tenants) &&
    candidate.tenants.every(
      (tenant) =>
        typeof tenant?.slug === "string" && typeof tenant?.name === "string",
    )
  );
}

/** Carries the HTTP status so the UI can explain the failure in plain language. */
export class LoginError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "LoginError";
    this.status = status;
  }
}

export type LoginTarget =
  | { path: "/auth/login"; headers: Record<"x-tenant-id", string> }
  | { path: "/auth/login/discover"; headers: Record<string, never> };

/**
 * Backend endpoint for a login request. A workspace code selects the tenant
 * login; without one the backend discovers the workspace from the credentials.
 * Throws for a malformed code so it never reaches the backend.
 */
export function resolveLoginTarget(
  tenantHeader: string | null | undefined,
): LoginTarget {
  if (
    tenantHeader === null ||
    tenantHeader === undefined ||
    tenantHeader.trim() === ""
  ) {
    return { path: "/auth/login/discover", headers: {} };
  }
  return {
    path: "/auth/login",
    headers: { "x-tenant-id": requireTenantSlug(tenantHeader.trim()) },
  };
}
