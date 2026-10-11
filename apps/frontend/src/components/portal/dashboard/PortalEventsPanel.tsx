"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Loader2, RotateCcw } from "lucide-react";
import type { UpcomingEventSummaryDto } from "@affexai/shared-types";
import { eventsService } from "@/lib/api";
import { CortexSurface } from "@/components/brand/editorial";

const eventDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

export function eventDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Tarih bilgisi yok"
    : eventDateFormatter.format(date);
}

export function PortalEventsPanel() {
  const [events, setEvents] = useState<UpcomingEventSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await eventsService.getUpcomingEvents(3);
        if (active) setEvents(result);
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
      eyebrow="Forward calendar"
      title="Yaklaşan etkinlikler"
      description="Katılabileceğiniz güncel etkinlikler ve programlar."
      action={
        <Link
          href="/portal/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--cortex-accent-ink)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cortex-focus)]"
        >
          Tümünü aç <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      }
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
          <span className="sr-only">Etkinlikler yükleniyor</span>
        </div>
      ) : failed ? (
        <div
          className="px-6 py-10 text-sm leading-6 text-[var(--cortex-text-muted)]"
          role="status"
        >
          <p>Etkinlik takvimi şu anda görüntülenemiyor.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 inline-flex items-center gap-2 border border-[var(--cortex-line-strong)] px-3 py-2 font-semibold text-[var(--cortex-text)] hover:border-[var(--cortex-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cortex-focus)]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Yeniden dene
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
          <CalendarDays
            className="h-6 w-6 text-[var(--cortex-text-faint)]"
            aria-hidden="true"
          />
          <p className="mt-4 text-sm font-medium">
            Planlanmış etkinlik bulunmuyor
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--cortex-text-muted)]">
            Yeni bir program yayınlandığında burada görünür.
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-[var(--cortex-line)]">
          {events.map((event, index) => (
            <li key={event.id}>
              <Link
                href={`/portal/events/${event.id}`}
                className="group grid grid-cols-[3rem_1fr_auto] items-center gap-4 px-5 py-4 hover:bg-[var(--cortex-surface-quiet)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--cortex-focus)] sm:px-6"
              >
                <span className="font-mono text-xs text-[var(--cortex-text-faint)]">
                  0{index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium group-hover:text-[var(--cortex-accent-ink)]">
                    {event.title}
                  </span>
                  <time
                    dateTime={event.startDate}
                    className="mt-1 block text-xs text-[var(--cortex-text-muted)]"
                  >
                    {eventDate(event.startDate)}
                  </time>
                </span>
                <ArrowUpRight
                  className="h-4 w-4 text-[var(--cortex-text-faint)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--cortex-accent-ink)]"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </CortexSurface>
  );
}
