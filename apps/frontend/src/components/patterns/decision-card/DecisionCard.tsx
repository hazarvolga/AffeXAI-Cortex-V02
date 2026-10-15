"use client";

import { useId } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DemoDataBadge } from "@/components/patterns/demo-data-badge";
import { cn } from "@/lib/utils";
import {
  decisionView,
  type Decision,
  type DecisionViewer,
} from "./decision-model";

export interface DecisionCardProps {
  decision: Decision;
  viewer: DecisionViewer;
  /** Called when the viewer approves the recommended action. */
  onApprove?: (decisionId: string) => void;
  /** Marks a card built from sample data (until G4 provides real decisions). */
  isDemo?: boolean;
  className?: string;
}

/**
 * Recommendation (one sentence) → evidence (source records, date, tenant) →
 * permission-checked action → status → measured result.
 */
export function DecisionCard({
  decision,
  viewer,
  onApprove,
  isDemo = false,
  className,
}: DecisionCardProps) {
  const view = decisionView(decision, viewer);
  const id = useId();
  const titleId = `${id}-title`;
  const reasonId = `${id}-reason`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-card p-5 text-card-foreground",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium">
          {view.statusLabel}
        </span>
        {isDemo && (
          <DemoDataBadge
            label="Önizleme"
            reason="Bu karar kartı örnek veriyle gösteriliyor; öneri gerçek kayıtlardan üretilmedi."
          />
        )}
      </div>

      <h3 id={titleId} className="text-base font-semibold leading-snug">
        {view.recommendation}
      </h3>

      <section aria-label="Kanıt">
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Kanıt
        </h4>
        {view.evidence.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Bu çalışma alanına ait kanıt yok.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {view.evidence.map((item) => (
              <li
                key={`${item.label}-${item.date}`}
                className="flex flex-wrap items-baseline gap-x-2"
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
                <time
                  dateTime={item.date}
                  className="text-xs text-muted-foreground"
                >
                  {item.dateLabel}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={!view.canApprove || !onApprove}
          aria-describedby={view.blockedReason ? reasonId : undefined}
          onClick={() => onApprove?.(decision.id)}
        >
          {view.actionLabel}
        </Button>
        {view.blockedReason && (
          <p id={reasonId} className="text-xs text-muted-foreground">
            {view.blockedReason}
          </p>
        )}
      </div>

      <p className="border-t border-border pt-3 text-sm">
        <span className="font-medium">Ölçülen sonuç: </span>
        {view.outcomeLabel}
      </p>
    </article>
  );
}
