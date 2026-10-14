"use client";

import { useParams } from "next/navigation";
import { tenantAdminHref } from "@/lib/navigation/tenant-admin-href";

/** Builds `/<tenant>/admin<path>` for the workspace in the current route. */
export function useTenantAdminHref(): (path: string) => string {
  const params = useParams<{ tenant?: string }>();
  return (path) => tenantAdminHref(params?.tenant, path);
}
