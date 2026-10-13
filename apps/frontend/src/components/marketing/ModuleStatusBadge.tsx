import { cn } from "@/lib/utils";
import { getPublicCopy } from "@/lib/i18n/public-copy";
import {
  publicStatusOf,
  type MarketedModule,
} from "@/lib/marketing/module-status";

interface ModuleStatusBadgeProps {
  module: MarketedModule;
}

/** Honest, matrix-backed module status; only accepted modules get the amber signal. */
export function ModuleStatusBadge({ module }: ModuleStatusBadgeProps) {
  const status = publicStatusOf(module);
  return (
    <span
      lang="tr"
      className={cn(
        "border px-2 py-1 text-xs tracking-wide",
        status === "early-access"
          ? "border-[#f9f906]/40 text-[#f9f906]"
          : "border-[#333] text-[#a3a3a3]",
      )}
    >
      {getPublicCopy().moduleStatus[status]}
    </span>
  );
}

/** States the product's real phase instead of a blanket system status. */
export function ProductPhaseLine() {
  return (
    <p lang="tr" className="mt-8 text-xs tracking-wide text-[#a3a3a3]">
      {getPublicCopy().productPhase}
    </p>
  );
}
