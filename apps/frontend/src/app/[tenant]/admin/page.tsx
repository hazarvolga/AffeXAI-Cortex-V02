"use client";

import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { SystemStatsCard } from "@/components/admin/dashboard/system-stats-card";
import { EventsTrendChart } from "@/components/admin/dashboard/charts/events-trend-chart";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions/constants";
import { NeuralInsightsCard } from "@/components/admin/dashboard/neural-insights-card";
import { QuotaUsageCard } from "@/components/admin/dashboard/quota-usage-card";
import { SocketProvider } from "@/providers/SocketProvider";
import { useParams } from "next/navigation";

export default function TenantDashboardPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const { hasPermission, isSuperAdmin } = usePermissions();

  return (
    <SocketProvider tenantId={tenant}>
      <BccEditorialWrapper
        headerTitle="HQ Dashboard"
        headerSubtitle="Operational oversight and strategic command."
        headerBadge="HQ"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                Genel Bakış
              </h1>
              <p className="text-muted-foreground">
                Sistemin genel durumunu buradan takip edebilirsiniz
              </p>
            </div>
          </div>

          {/* System Stats */}
          {(isSuperAdmin || hasPermission(Permission.USERS_VIEW)) && (
            <div>
              <SystemStatsCard />
            </div>
          )}

          {/* Phase 11 & 12: Neural & Performance Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <NeuralInsightsCard />
            </div>
            <div className="md:col-span-1">
              <QuotaUsageCard />
            </div>
          </div>

          {/* Operational Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {(isSuperAdmin || hasPermission(Permission.EVENTS_VIEW)) && (
              <EventsTrendChart />
            )}
          </div>
        </div>
      </BccEditorialWrapper>
    </SocketProvider>
  );
}
