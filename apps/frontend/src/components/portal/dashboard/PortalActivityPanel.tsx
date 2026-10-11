"use client";

import { useEffect, useState } from "react";
import { Activity, Loader2, RotateCcw } from "lucide-react";
import { usersService, type UserActivity } from "@/lib/api/usersService";
import { CortexSurface } from "@/components/brand/editorial";

const activityDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
  timeZoneName: "short",
});

export function activityDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Tarih bilgisi yok"
    : activityDateFormatter.format(date);
}

export function PortalActivityPanel() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await usersService.getRecentActivity();
        if (active) setActivities(data);
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [requestKey]);

  const retry = () => {
    setLoading(true);
    setFailed(false);
    setRequestKey((key) => key + 1);
  };

  return (
    <CortexSurface
      eyebrow="Activity stream"
      title="Son hareketler"
      description="Hesabınızdaki yakın tarihli işlemler."
      className="min-h-[320px]"
    >
      {loading ? (
        <div
          className="flex min-h-52 items-center justify-center"
          role="status"
        >
          <Loader2
            className="h-5 w-5 animate-spin text-[var(--cortex-accent)]"
            aria-hidden="true"
          />
          <span className="sr-only">Hareketler yükleniyor</span>
        </div>
      ) : failed ? (
        <div
          className="px-6 py-10 text-sm leading-6 text-[var(--cortex-text-muted)]"
          role="status"
        >
          <p>
            Hareketler şu anda görüntülenemiyor. Diğer portal işlemlerinize
            devam edebilirsiniz.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 inline-flex items-center gap-2 border border-[var(--cortex-line-strong)] px-3 py-2 font-semibold text-[var(--cortex-text)] hover:border-[var(--cortex-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cortex-focus)]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Yeniden dene
          </button>
        </div>
      ) : activities.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
          <Activity
            className="h-6 w-6 text-[var(--cortex-text-faint)]"
            aria-hidden="true"
          />
          <p className="mt-4 text-sm font-medium">Henüz kayıtlı hareket yok</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--cortex-text-muted)]">
            Portalda yaptığınız işlemler burada kronolojik olarak görünür.
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-[var(--cortex-line)]">
          {activities.slice(0, 6).map((activity) => (
            <li
              key={activity.id}
              className="grid grid-cols-[auto_1fr] gap-4 px-5 py-4 sm:px-6"
            >
              <span
                className="mt-1.5 h-2 w-2 rounded-full bg-[var(--cortex-accent)]"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">{activity.title}</p>
                {activity.description && (
                  <p className="mt-1 text-sm leading-6 text-[var(--cortex-text-muted)]">
                    {activity.description}
                  </p>
                )}
                <time
                  dateTime={activity.timestamp}
                  className="mt-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--cortex-text-faint)]"
                >
                  {activityDate(activity.timestamp)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </CortexSurface>
  );
}
