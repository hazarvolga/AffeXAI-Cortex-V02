import { CircleCheck, CircleDashed, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPublicCopy,
  type PublicLocale,
  type PublicModuleStatus,
} from "@/lib/i18n/public-copy";
import {
  publicStatusOf,
  type MarketedModule,
} from "@/lib/marketing/module-status";

interface ModuleStatusBadgeProps {
  locale: PublicLocale;
  module: MarketedModule;
}

const STATUS_STYLE: Readonly<Record<PublicModuleStatus, string>> = {
  "early-access": "border-foreground/40 text-foreground",
  "in-development": "border-border text-muted-foreground",
  roadmap: "border-dashed border-border text-muted-foreground",
};

const STATUS_ICON = {
  "early-access": CircleCheck,
  "in-development": CircleDot,
  roadmap: CircleDashed,
} as const;

/**
 * Matrix-backed module status. Text and icon carry the meaning; colour stays
 * neutral so the amber signal remains reserved for the primary action.
 */
export function ModuleStatusBadge({ locale, module }: ModuleStatusBadgeProps) {
  const status = publicStatusOf(module);
  const Icon = STATUS_ICON[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
        STATUS_STYLE[status],
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {getPublicCopy(locale).moduleStatus[status]}
    </span>
  );
}
