"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageFrame } from "@/components/patterns/AdminPageFrame";
import {
  activeCmsItem,
  cmsNavItems,
  isCmsOverview,
} from "@/lib/navigation/cms-workbench-nav";
import { tenantAdminHref } from "@/lib/navigation/tenant-admin-href";
import { cn } from "@/lib/utils";

/** Landmarks and section navigation for every CMS workbench route except the overview. */
export function CmsWorkbenchFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const params = useParams();
  const tenant = typeof params?.tenant === "string" ? params.tenant : "";

  if (!tenant || isCmsOverview(pathname, tenant)) return <>{children}</>;

  const items = cmsNavItems(tenant);
  const active = activeCmsItem(items, pathname);
  const header = (
    <header className="border-b border-border bg-background">
      <div className="flex items-center gap-2 px-4">
        <Link
          href={tenantAdminHref(tenant, "")}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 pr-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Yönetim
        </Link>
        <nav
          aria-label="İçerik yönetimi"
          className="min-w-0 flex-1 overflow-x-auto"
        >
          <ul className="flex w-max items-center gap-1 text-sm">
            {items.map((item) => {
              const isActive = item === active;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center border-b-2 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "border-primary font-medium text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );

  return <AdminPageFrame header={header}>{children}</AdminPageFrame>;
}
