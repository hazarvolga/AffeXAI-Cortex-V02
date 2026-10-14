"use client";

import { useQuery } from "@tanstack/react-query";
import { MailCheck, UserCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usersService } from "@/lib/api/usersService";

interface StatItem {
  label: string;
  value: number;
  icon?: LucideIcon;
}

/** Tenant user counts from `/users/stats` (totals and per-role). */
export function SystemStatsCard() {
  const stats = useQuery({
    queryKey: ["users", "stats"],
    queryFn: () => usersService.getStats(),
  });

  if (stats.isPending) {
    return (
      <Card className="col-span-full">
        <CardContent className="py-6">
          <p role="status" className="text-center text-muted-foreground">
            Kullanıcı sayıları yükleniyor…
          </p>
        </CardContent>
      </Card>
    );
  }

  if (stats.isError) {
    return (
      <Card className="col-span-full">
        <CardContent
          className="flex flex-wrap items-center justify-between gap-3 py-4"
          role="alert"
        >
          <p className="text-sm text-muted-foreground">
            Kullanıcı sayıları alınamadı.
          </p>
          <Button size="sm" variant="outline" onClick={() => stats.refetch()}>
            Tekrar dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  const items: StatItem[] = [
    { label: "Toplam kullanıcı", value: stats.data.total, icon: Users },
    { label: "Aktif", value: stats.data.active, icon: UserCheck },
    {
      label: "E-postası doğrulanmış",
      value: stats.data.verified,
      icon: MailCheck,
    },
    ...stats.data.byRole.map((entry) => ({
      label: entry.role === "No Role" ? "Rolü atanmamış" : entry.role,
      value: entry.count,
    })),
  ];

  return (
    <Card className="col-span-full">
      <CardContent className="py-4">
        <dl className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {items.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="mt-0.5 flex items-center gap-1.5 text-xs leading-tight text-muted-foreground">
                {Icon && (
                  <Icon aria-hidden className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                {label}
              </dt>
              <dd className="text-sm font-semibold leading-none tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
