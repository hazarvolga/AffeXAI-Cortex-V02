import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_REASON = "Bu alandaki değerler gerçek kayıtlardan gelmiyor.";

export interface DemoDataBadgeProps {
  /** Visible text; "Demo veri" by default, "Önizleme" for preview surfaces. */
  label?: string;
  /** Why the values are not real; exposed as tooltip and accessible description. */
  reason?: string;
  className?: string;
}

/**
 * UX-CONTRACT: demo values never pass as production results. Every surface
 * that shows sample or simulated numbers carries this badge next to its title.
 */
export function DemoDataBadge({
  label = "Demo veri",
  reason = DEFAULT_REASON,
  className,
}: DemoDataBadgeProps) {
  return (
    <span
      title={reason}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/60 px-2 py-0.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <FlaskConical aria-hidden className="h-3 w-3" />
      {label}
      <span className="sr-only">: {reason}</span>
    </span>
  );
}
