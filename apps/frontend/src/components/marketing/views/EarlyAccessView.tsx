import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPublicCopy, type PublicLocale } from "@/lib/i18n/public-copy";
import { CONTACT_EMAIL, earlyAccessMailto } from "@/lib/marketing/contact";
import { EARLY_ACCESS_FORM_TARGET } from "@/lib/marketing/early-access";
import { EARLY_ACCESS_FORM_ANCHOR } from "@/lib/marketing/routes";
import {
  BODY,
  CONTAINER,
  EYEBROW,
  FOCUS_RING,
  H1,
  H2,
  LEAD,
  SECTION,
  TEXT_LINK,
} from "../marketing-styles";
import { EarlyAccessForm } from "../EarlyAccessForm";

interface EarlyAccessViewProps {
  locale: PublicLocale;
}

/**
 * Early access instead of a price list (D5). The form posts to the published
 * platform form (D2); without that configuration the page offers email only.
 */
export function EarlyAccessView({ locale }: EarlyAccessViewProps) {
  const { earlyAccess } = getPublicCopy(locale);

  return (
    <>
      <section aria-labelledby="early-title" className="py-16 md:py-24">
        <div className={CONTAINER}>
          <p className={EYEBROW}>{earlyAccess.eyebrow}</p>
          <h1 id="early-title" className={cn(H1, "mt-4 max-w-4xl")}>
            {earlyAccess.title}
          </h1>
          <p className={cn(LEAD, "mt-6 max-w-3xl")}>{earlyAccess.lead}</p>
          <p className={cn(BODY, "mt-4 max-w-3xl")}>
            {earlyAccess.pricingNote}
          </p>
        </div>
      </section>

      <section aria-labelledby="early-steps" className={SECTION}>
        <div className={CONTAINER}>
          <h2 id="early-steps" className={H2}>
            {earlyAccess.stepsTitle}
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {earlyAccess.steps.map((step, index) => (
              <li key={step} className="rounded-md border border-border p-6">
                <span
                  aria-hidden="true"
                  className="font-mono text-sm tabular-nums text-muted-foreground"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className={cn(BODY, "mt-3 text-foreground")}>{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id={EARLY_ACCESS_FORM_ANCHOR}
        aria-labelledby="early-form"
        className={cn(SECTION, "scroll-mt-8")}
      >
        <div className={cn(CONTAINER, "grid gap-12 lg:grid-cols-[2fr_1fr]")}>
          <div className="max-w-2xl">
            <h2 id="early-form" className={H2}>
              {earlyAccess.form.title}
            </h2>
            <div className="mt-8">
              {EARLY_ACCESS_FORM_TARGET ? (
                <EarlyAccessForm
                  locale={locale}
                  target={EARLY_ACCESS_FORM_TARGET}
                />
              ) : (
                <p className={BODY}>{earlyAccess.form.unavailable}</p>
              )}
            </div>
          </div>
          <aside className="self-start rounded-md border border-border bg-card p-6">
            <p className={BODY}>{earlyAccess.ctaHint}</p>
            <a
              href={earlyAccessMailto()}
              className={cn(TEXT_LINK, "mt-3 inline-block break-all")}
            >
              {CONTACT_EMAIL}
            </a>
            <a
              href={earlyAccessMailto()}
              className={cn(
                "mt-6 inline-flex h-11 items-center gap-2 rounded-md border border-input px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent",
                FOCUS_RING,
              )}
            >
              <Mail aria-hidden="true" className="h-4 w-4" />
              {earlyAccess.cta}
            </a>
          </aside>
        </div>
      </section>
    </>
  );
}
