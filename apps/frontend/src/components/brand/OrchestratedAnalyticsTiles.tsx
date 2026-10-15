"use client";

import React, { useState } from "react";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { DemoDataBadge } from "@/components/patterns/demo-data-badge";
import type { EventDashboardStats } from "@affexai/shared-types";
import type { TicketStats } from "@/lib/api/ticketsService";
import {
  Calendar,
  TrendingUp,
  ShieldCheck,
  Mail,
  Share2,
  FileText,
  LifeBuoy,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import {
  eventsService,
  emailCampaignsService as campaignsService,
  ticketsService,
} from "@/lib/api";

import { cmsMetricsService } from "@/lib/api/cmsMetricsService";

// --- HELPERS ---
const CustomBccTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B0F19]/90 backdrop-blur-md border border-[#13ecec]/20 rounded-xl p-3 shadow-[0_0_20px_rgba(19,236,236,0.1)]">
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 font-mono">
          {label}
        </p>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 mb-1">
            <div
              className="size-1.5 rounded-full"
              style={{ backgroundColor: item.color || item.fill }}
            ></div>
            <p className="text-xs text-white/90 font-medium">
              {item.name}:{" "}
              <span className="font-mono text-[#13ecec]">
                {item.value.toLocaleString()}
              </span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- COMPONENTS ---

/**
 * BCC Events Trend Tile - Adapted from EventsTrendChart
 */
export const BccEventsTrendTile = () => {
  // Real totals only: there is no daily participant series, so no trend line is drawn.
  const [stats, setStats] = useState<EventDashboardStats | null>(null);
  const [failed, setFailed] = useState(false);

  useAsyncEffect(async (run) => {
    try {
      const dashStats = await eventsService.getStats();
      if (!run.cancelled) setStats(dashStats);
    } catch (error) {
      console.error("Event stats failed:", error);
      if (!run.cancelled) setFailed(true);
    }
  }, []);

  const items = stats
    ? [
        { label: "Yaklaşan etkinlik", value: stats.upcomingEvents },
        { label: "Katılımcı", value: stats.totalParticipants },
        { label: "Bilet satışı", value: stats.totalTicketSales },
      ]
    : [];

  return (
    <div className="md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col group relative overflow-hidden">
      <div className="mb-8 relative z-10">
        <p className="text-[#13ecec] text-[10px] font-bold tracking-[0.2em] uppercase mb-1 font-mono">
          Etkinlikler
        </p>
        <h3 className="text-xl font-bold text-white tracking-tight">
          Etkinlik özeti
        </h3>
      </div>
      {failed ? (
        <p className="text-sm text-white/70">
          Veri alınamadı. Etkinlik istatistikleri şu an okunamıyor.
        </p>
      ) : !stats ? (
        <p className="text-sm text-white/70" role="status">
          Yükleniyor…
        </p>
      ) : (
        <dl className="grid grid-cols-3 gap-4 relative z-10">
          {items.map((item) => (
            <div
              key={item.label}
              className="bg-white/5 p-4 rounded-xl border border-white/5"
            >
              <dd className="text-2xl font-bold text-white font-mono">
                {item.value.toLocaleString("tr-TR")}
              </dd>
              <dt className="text-[10px] text-white/70 uppercase tracking-widest font-bold mt-1">
                {item.label}
              </dt>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};

/**
 * BCC Social Engagement Tile
 */
export const BccSocialEngagementTile = () => {
  // Per-platform engagement history is not collected yet; drawing a chart here would invent it.
  return (
    <div className="md:col-span-2 md:row-span-1 lg:col-span-2 lg:row-span-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between overflow-hidden">
      <div>
        <p className="text-[#a855f7] text-[10px] font-bold tracking-widest uppercase mb-1 font-mono">
          Sosyal
        </p>
        <h3 className="text-lg font-bold text-white tracking-tight">
          Platform etkileşimi
        </h3>
      </div>
      <p className="text-sm text-white/70">
        Yeterli veri yok — platform bazında etkileşim geçmişi henüz toplanmıyor.
        Sosyal hesaplarınızı bağladığınızda burada görünür.
      </p>
    </div>
  );
};

/**
 * BCC Support Performance Tile
 */
export const BccSupportPerformanceTile = () => {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [failed, setFailed] = useState(false);

  useAsyncEffect(async (run) => {
    try {
      const ticketStats = await ticketsService.getStats();
      if (!run.cancelled) setStats(ticketStats);
    } catch (error) {
      console.error("Ticket stats failed:", error);
      if (!run.cancelled) setFailed(true);
    }
  }, []);

  const sla = stats ? Math.round(stats.slaCompliance) : 0;

  return (
    <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-[#0B0F19]/40 backdrop-blur-xl border border-[#13ecec]/10 rounded-3xl p-6 flex flex-col justify-between group overflow-hidden">
      <div>
        <p className="text-[#a855f7] text-[10px] font-bold tracking-widest uppercase mb-1 font-mono">
          Service Level
        </p>
        <h3 className="text-lg font-bold text-white tracking-tight">Destek</h3>
      </div>

      {failed ? (
        <p className="text-sm text-white/70">Veri alınamadı.</p>
      ) : !stats ? (
        <p className="text-sm text-white/70" role="status">
          Yükleniyor…
        </p>
      ) : (
        <>
          <div className="relative flex items-center justify-center py-4">
            {/* The gauge repeats the percentage shown below it. */}
            <div aria-hidden="true">
              <ResponsiveContainer width={120} height={120}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="100%"
                  barSize={8}
                  data={[{ value: sla, fill: "#13ecec" }]}
                  startAngle={180}
                  endAngle={0}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    tick={false}
                  />
                  <RadialBar background dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute flex flex-col items-center justify-center pt-8">
              <p className="text-2xl font-bold text-white tracking-tighter">
                %{sla}
              </p>
              <p className="text-[8px] text-white/70 uppercase tracking-widest font-mono">
                SLA uyumu
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <p className="text-[14px] font-bold text-white font-mono">
                {stats.openTickets}
              </p>
              <p className="text-[8px] text-white/70 uppercase tracking-widest font-bold">
                Açık talep
              </p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <p className="text-[14px] font-bold text-[#13ecec] font-mono">
                {stats.slaBreaches}
              </p>
              <p className="text-[8px] text-white/70 uppercase tracking-widest font-bold">
                SLA ihlali
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * BCC Content Asset Tile
 */
export const BccContentAssetTile = () => {
  return (
    <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between group overflow-hidden relative">
      <DemoDataBadge
        label="Önizleme"
        reason="Bu karttaki değerler örnektir; bu çalışma alanının kayıtlarından hesaplanmıyor."
        className="absolute right-3 top-3 z-20 border-white/40 bg-black/60 text-white/80"
      />
      <div>
        <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1 font-mono">
          Inventory
        </p>
        <h3 className="text-lg font-bold text-white tracking-tight">
          Content Assets
        </h3>
      </div>

      <div className="space-y-4 py-4">
        <div className="group/item">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] text-white/60 font-mono uppercase">
              Certificates Issued
            </span>
            <span className="text-xs font-bold text-[#13ecec]">
              100% Complete
            </span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#13ecec] w-full shadow-[0_0_8px_#13ecec]"></div>
          </div>
        </div>

        <div className="group/item">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] text-white/60 font-mono uppercase">
              CMS Published
            </span>
            <span className="text-xs font-bold text-[#a855f7]">24 Active</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#a855f7] w-3/4"></div>
          </div>
        </div>

        <div className="group/item">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] text-white/60 font-mono uppercase">
              Avg Open Rate
            </span>
            <span className="text-xs font-bold text-blue-400">65% Target</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 w-[65%]"></div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-white/5">
        <p className="text-[8px] text-white/20 italic font-mono uppercase tracking-widest">
          BCC_Asset_Inventory_Verified_0x1A
        </p>
      </div>
    </div>
  );
};
