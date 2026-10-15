"use client";

import React, { useState } from "react";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import {
  cmsMetricsService,
  type CmsMetrics,
} from "@/lib/api/cmsMetricsService";
import { Skeleton } from "@/components/ui/skeleton";
import { BccHudTile } from "@/components/brand/BccHudTile";
import { TrendingUp, Activity, Map, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

type Period = "day" | "week" | "month";

const PERIOD_OPTIONS: ReadonlyArray<{ value: Period; label: string }> = [
  { value: "day", label: "24 saat" },
  { value: "week", label: "7 gün" },
  { value: "month", label: "30 gün" },
];

export function AnalyticsCards() {
  const [metrics, setMetrics] = useState<CmsMetrics | null>(null);
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useAsyncEffect(
    async (run) => {
      setLoading(true);
      setError(null);
      try {
        const data = await cmsMetricsService.getMetrics(period);
        if (!run.cancelled) setMetrics(data);
      } catch (err) {
        console.error("Analytics load error:", err);
        if (!run.cancelled) setError("İçerik metrikleri yüklenemedi");
      } finally {
        if (!run.cancelled) setLoading(false);
      }
    },
    [period],
  );

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white/5 border border-white/5"></div>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-mono uppercase tracking-widest">
        {error || "Metrik verisi yok"}
      </div>
    );
  }

  const statsCards = [
    {
      title: "Resonance Index",
      subtitle: "Total_Views",
      value: metrics.summary.totalViews.toLocaleString(),
      description: "Unique Nodes",
      subValue: metrics.summary.uniqueVisitors.toLocaleString(),
      color: "#9df425",
    },
    {
      title: "Signal Coupling",
      subtitle: "Link_Clicks",
      value: metrics.summary.totalClicks.toLocaleString(),
      description: "Unique Links",
      subValue: metrics.summary.uniqueLinks.toLocaleString(),
      color: "#ff8c00",
    },
    {
      title: "Calibration Log",
      subtitle: "Edit_Events",
      value: metrics.summary.edits.toLocaleString(),
      description: "Total Ops",
      subValue: `${metrics.summary.edits} calc`,
      color: "#ffffff",
    },
    {
      title: "Propagation",
      subtitle: "Publish_Nodes",
      value: metrics.summary.publishes.toLocaleString(),
      description: "Live Deployments",
      subValue: `${metrics.summary.publishes} units`,
      color: "#9df425",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Period Selector (Sub-Nav Style) */}
      <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-2 mb-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-4">
          Temporal Range:
        </div>
        <div role="group" aria-label="Dönem" className="flex h-8 gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={period === option.value}
              onClick={() => setPeriod(option.value)}
              className={cn(
                "h-full border px-4 text-xs font-bold uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                period === option.value
                  ? "border-white/20 bg-white/5 text-white"
                  : "border-transparent text-white/70 hover:text-white",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          return (
            <BccHudTile
              key={stat.title}
              title={stat.title}
              subtitle={stat.subtitle}
            >
              <div className="space-y-1">
                <div
                  className="text-3xl font-light tracking-tighter text-white"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </div>
                <div className="text-[9px] text-white/40 font-mono uppercase tracking-widest">
                  {stat.description}: {stat.subValue}
                </div>
              </div>
            </BccHudTile>
          );
        })}
      </div>

      {/* Detailed Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Pages */}
        <BccHudTile
          title="Node Frequency"
          subtitle="Top_Content_Performance"
          icon="trending_up"
        >
          <div className="space-y-4 pt-2">
            {metrics.topPages.length === 0 ? (
              <p className="text-[10px] font-mono text-white/20 uppercase">
                Registry Empty
              </p>
            ) : (
              metrics.topPages.slice(0, 5).map((page, index) => (
                <div
                  key={page.pageId}
                  className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-6 w-6 items-center justify-center bg-white/5 font-mono text-[9px] text-white/40 group-hover:text-amber-500 transition-colors">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-tight text-white/80 group-hover:text-white transition-colors">
                        {page.pageTitle}
                      </p>
                      <p className="text-[9px] font-mono text-white/30 mt-0.5">
                        {page.uniqueVisitors} unique_nodes_identified
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-mono font-bold text-amber-500">
                      {page.viewCount}
                    </p>
                    <p className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">
                      Resonance_Count
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </BccHudTile>

        {/* Top Links */}
        <BccHudTile
          title="Signal Coupling"
          subtitle="Interaction_Vector_Analysis"
          icon="bolt"
        >
          <div className="space-y-4 pt-2">
            {metrics.topLinks.length === 0 ? (
              <p className="text-[10px] font-mono text-white/20 uppercase">
                Registry Empty
              </p>
            ) : (
              metrics.topLinks.slice(0, 5).map((link, index) => (
                <div
                  key={link.linkUrl}
                  className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-6 w-6 items-center justify-center bg-white/5 font-mono text-[9px] text-white/40 group-hover:text-[#9df425] transition-colors">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="max-w-[180px]">
                      <p className="text-[11px] font-bold uppercase tracking-tight text-white/80 group-hover:text-white transition-colors truncate">
                        {link.linkText || "Unnamed_Vector"}
                      </p>
                      <p className="text-[9px] font-mono text-white/30 mt-0.5 truncate">
                        {link.linkUrl}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[12px] font-mono font-bold text-[#9df425]">
                      {link.clickCount}
                    </p>
                    <p className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">
                      Coupling_Events
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </BccHudTile>
      </div>

      {/* Category Engagement */}
      <BccHudTile
        title="Spectrum Analysis"
        subtitle="Category_Resonance_Distribution"
      >
        <div className="space-y-5 pt-2">
          {metrics.categoryEngagement.length === 0 ? (
            <p className="text-[10px] font-mono text-white/20 uppercase">
              Registry Empty
            </p>
          ) : (
            metrics.categoryEngagement.map((cat) => {
              const totalInteractions = cat.views + cat.clicks;
              const viewPercentage =
                totalInteractions > 0
                  ? (cat.views / totalInteractions) * 100
                  : 0;

              return (
                <div key={cat.category} className="space-y-2 group">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">
                      {cat.category}
                    </p>
                    <div className="text-[9px] font-mono text-white/40 uppercase tracking-tighter">
                      {cat.views} reso · {cat.clicks} coup
                    </div>
                  </div>
                  <div className="h-1 bg-white/5 overflow-hidden rounded-none">
                    <div
                      className="h-full bg-amber-500/40 group-hover:bg-amber-500 transition-all duration-1000"
                      style={{ width: `${viewPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </BccHudTile>
    </div>
  );
}
