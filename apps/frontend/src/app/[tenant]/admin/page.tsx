'use client';

import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { SystemStatsCard } from "@/components/admin/dashboard/system-stats-card";
import { EventsTrendChart } from "@/components/admin/dashboard/charts/events-trend-chart";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions/constants";
import { NeuralInsightsCard } from "@/components/admin/dashboard/neural-insights-card";
import { QuotaUsageCard } from "@/components/admin/dashboard/quota-usage-card";
import { PerformanceTimelineChart } from "@/components/admin/dashboard/charts/performance-timeline-chart";
import { SocketProvider } from "@/providers/SocketProvider";

export default async function TenantDashboardPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = await params;
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
                            <h1 className="text-3xl font-bold tracking-tight mb-2">Genel Bakış</h1>
                            <p className="text-muted-foreground">Sistemin genel durumunu buradan takip edebilirsiniz</p>
                        </div>
                    </div>

                    {/* System Stats */}
                    {(isSuperAdmin || hasPermission(Permission.USERS_VIEW)) && (
                        <div>
                            <SystemStatsCard />
                        </div>
                    )}

                    {/* Phase 11 & 12: Neural & Performance Grid */}
                    <div className="grid gap-6 md:grid-cols-4">
                        <div className="col-span-2">
                            <NeuralInsightsCard />
                        </div>
                        <div className="col-span-1">
                            <QuotaUsageCard />
                        </div>
                        <div className="col-span-1">
                            {/* Placeholder for future small widget or another stat */}
                            <div className="h-full rounded-xl border bg-card text-card-foreground shadow opacity-50 flex items-center justify-center p-6 border-dashed">
                                <p className="text-sm text-muted-foreground">Reserve Module</p>
                            </div>
                        </div>
                    </div>

                    {/* Performance Timeline (Full Width) */}
                    <PerformanceTimelineChart />

                    {/* Operational Grid */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {(isSuperAdmin || hasPermission(Permission.EVENTS_VIEW)) && <EventsTrendChart />}
                    </div>
                </div>
            </BccEditorialWrapper>
        </SocketProvider>
    );
}
