import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { getPublicCopy } from "@/lib/i18n/public-copy";

/** Draft legal pages stay out of search results until the binding text exists (decision D3). */
export const LEGAL_DRAFT_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
};

export function LegalDraftNotice() {
  const { legalDraft } = getPublicCopy();
  return (
    <div
      role="note"
      className="border-b border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      <div className="container mx-auto flex items-start gap-3 px-4 py-4">
        <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-sm leading-relaxed">
          <strong className="font-semibold">{legalDraft.title}.</strong>{" "}
          {legalDraft.body}
        </p>
      </div>
    </div>
  );
}
