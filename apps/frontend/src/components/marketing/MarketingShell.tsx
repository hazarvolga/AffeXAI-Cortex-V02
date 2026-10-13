import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getPublicCopy, type PublicLocale } from "@/lib/i18n/public-copy";
import type { MarketingPage } from "@/lib/marketing/routes";
import { MarketingHeader } from "./MarketingHeader";
import { MarketingFooter } from "./MarketingFooter";

interface MarketingShellProps {
  locale: PublicLocale;
  page: MarketingPage;
  children: ReactNode;
}

const MAIN_ID = "main-content";

/** Public site frame: skip link, header, one main landmark, footer. */
export function MarketingShell({
  locale,
  page,
  children,
}: MarketingShellProps) {
  const copy = getPublicCopy(locale);
  return (
    <div
      lang={locale}
      className="theme-marketing flex min-h-screen flex-col bg-background font-sans text-foreground antialiased"
    >
      <a
        href={`#${MAIN_ID}`}
        className={cn(
          "sr-only z-50 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground",
          "focus:not-sr-only focus:fixed focus:left-4 focus:top-4",
        )}
      >
        {copy.nav.skipToContent}
      </a>
      <MarketingHeader locale={locale} active={page} />
      <main id={MAIN_ID} tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <MarketingFooter locale={locale} page={page} />
    </div>
  );
}
