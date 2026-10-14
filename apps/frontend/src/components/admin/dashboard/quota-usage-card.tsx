"use client";

import { useQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { commerceService } from "@/lib/api/commerceService";
import { describeQuota } from "./quota-usage.logic";

const REFRESH_MS = 60_000;
const numberFormat = new Intl.NumberFormat("tr-TR");

/** AI token usage for the current billing period, read from `/commerce/usage`. */
export function QuotaUsageCard() {
  const usage = useQuery({
    queryKey: ["commerce", "usage"],
    queryFn: commerceService.getUsageStats,
    refetchInterval: REFRESH_MS,
  });

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          AI kredi kullanımı
        </CardTitle>
        <Zap aria-hidden className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {usage.isPending && (
          <p className="text-sm text-muted-foreground" role="status">
            Kullanım yükleniyor…
          </p>
        )}
        {usage.isError && (
          <div className="space-y-2" role="alert">
            <p className="text-sm text-muted-foreground">
              Kullanım bilgisi alınamadı.
            </p>
            <Button size="sm" variant="outline" onClick={() => usage.refetch()}>
              Tekrar dene
            </Button>
          </div>
        )}
        {usage.data && <QuotaDetails stats={usage.data} />}
      </CardContent>
    </Card>
  );
}

function QuotaDetails({
  stats,
}: {
  stats: Parameters<typeof describeQuota>[0];
}) {
  const view = describeQuota(stats);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Bu dönem</span>
        <span className="font-medium tabular-nums">
          {numberFormat.format(stats.used)} / {numberFormat.format(stats.limit)}
        </span>
      </div>
      <Progress
        value={view.usedPercent}
        aria-label={`AI kredisinin yüzde ${view.usedPercent} kullanıldı`}
        className="h-2"
      />
      <p className="text-xs text-muted-foreground">
        {view.level === "critical"
          ? "Kota dolmak üzere. "
          : view.level === "warning"
            ? "Kotanın büyük kısmı kullanıldı. "
            : ""}
        {view.daysToReset} gün sonra sıfırlanır.
      </p>
    </div>
  );
}
