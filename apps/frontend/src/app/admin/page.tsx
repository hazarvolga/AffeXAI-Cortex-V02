
'use client'

import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions/constants";
import { SystemStatsCard } from "@/components/admin/dashboard/system-stats-card";
import { EventsTrendChart } from "@/components/admin/dashboard/charts/events-trend-chart";
import { CertificatesDonutChart } from "@/components/admin/dashboard/charts/certificates-donut-chart";
import { CampaignsBarChart } from "@/components/admin/dashboard/charts/campaigns-bar-chart";
import { SocialMediaAreaChart } from "@/components/admin/dashboard/charts/social-media-area-chart";
import { CmsStatsChart } from "@/components/admin/dashboard/charts/cms-stats-chart";
import { SupportGaugeChart } from "@/components/admin/dashboard/charts/support-gauge-chart";

export default function DashboardPage() {
  const { hasPermission, isSuperAdmin } = usePermissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Genel Bakış</h1>
        <p className="text-muted-foreground">Sistemin genel durumunu buradan takip edebilirsiniz</p>
      </div>

      {/* Sistem Durumu - Full width at top (Admin only) */}
      {(isSuperAdmin || hasPermission(Permission.USERS_VIEW)) && (
        <div>
          <SystemStatsCard />
        </div>
      )}

      {/* İzin bazlı grafik kartları - 2 sütunlu grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Etkinlikler Trend - EVENTS_VIEW */}
        {(isSuperAdmin || hasPermission(Permission.EVENTS_VIEW)) && <EventsTrendChart />}

        {/* Sertifika Dağılımı - CERTIFICATES_VIEW */}
        {(isSuperAdmin || hasPermission(Permission.CERTIFICATES_VIEW)) && <CertificatesDonutChart />}

        {/* Email Kampanya Performansı - EMAIL_VIEW */}
        {(isSuperAdmin || hasPermission(Permission.EMAIL_VIEW)) && <CampaignsBarChart />}

        {/* Sosyal Medya Engagement - SOCIAL_MEDIA_VIEW */}
        {(isSuperAdmin || hasPermission(Permission.SOCIAL_MEDIA_VIEW)) && <SocialMediaAreaChart />}

        {/* CMS İçerik Performansı - CMS_VIEW */}
        {(isSuperAdmin || hasPermission(Permission.CMS_VIEW)) && <CmsStatsChart />}

        {/* Destek Performansı - TICKETS_VIEW_ALL */}
        {(isSuperAdmin || hasPermission(Permission.TICKETS_VIEW_ALL)) && <SupportGaugeChart />}
      </div>
    </div>
  );
}
