import type { UsageStats } from "@/lib/api/commerceService";

const DAY_MS = 24 * 60 * 60 * 1000;
const WARNING_PERCENT = 75;
const CRITICAL_PERCENT = 90;

export type QuotaLevel = "ok" | "warning" | "critical";

export interface QuotaView {
  usedPercent: number;
  daysToReset: number;
  level: QuotaLevel;
}

/** Derives what the AI credit card shows from `/commerce/usage`; no invented values. */
export function describeQuota(
  stats: UsageStats,
  now: Date = new Date(),
): QuotaView {
  const usedPercent =
    stats.limit > 0
      ? Math.min(100, Math.round((stats.used / stats.limit) * 100))
      : 0;
  const msLeft = new Date(stats.periodEnd).getTime() - now.getTime();
  const daysToReset = Number.isFinite(msLeft)
    ? Math.max(0, Math.ceil(msLeft / DAY_MS))
    : 0;
  const level: QuotaLevel =
    usedPercent >= CRITICAL_PERCENT
      ? "critical"
      : usedPercent >= WARNING_PERCENT
        ? "warning"
        : "ok";
  return { usedPercent, daysToReset, level };
}
