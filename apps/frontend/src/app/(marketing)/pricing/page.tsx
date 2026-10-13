import { Mail } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getPublicCopy } from "@/lib/i18n/public-copy";
import { CONTACT_EMAIL, earlyAccessMailto } from "@/lib/marketing/contact";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f9f906]";

/**
 * Early access instead of a price list (decision D5): commerce is not accepted
 * yet, so the page explains the invitation flow and offers one clear action.
 */
export default function PricingPage() {
  const { earlyAccess } = getPublicCopy();
  const mailto = earlyAccessMailto();

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#050505] text-white">
      <MarketingHeader active="pricing" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:px-6 md:py-24">
        <section
          aria-labelledby="erken-erisim-baslik"
          className="border-l border-[#f9f906]/40 pl-6 md:pl-10"
        >
          <p className="mb-4 text-sm tracking-wide text-[#f9f906]">
            {earlyAccess.eyebrow}
          </p>
          <h1
            id="erken-erisim-baslik"
            className="max-w-3xl text-4xl font-light leading-tight tracking-tight md:text-6xl"
          >
            {earlyAccess.title}
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#d4d4d4]">
            {earlyAccess.lead}
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#a3a3a3]">
            {earlyAccess.pricingNote}
          </p>
        </section>

        <section
          id="erken-erisim"
          aria-labelledby="erken-erisim-adimlar"
          className="mt-20 scroll-mt-8 border-t border-[#1a1a1a] pt-12"
        >
          <h2
            id="erken-erisim-adimlar"
            className="text-2xl font-light tracking-tight"
          >
            {earlyAccess.stepsTitle}
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {earlyAccess.steps.map((step, index) => (
              <li key={step} className="border border-[#1a1a1a] p-6">
                <span
                  aria-hidden="true"
                  className="font-mono text-sm text-[#a3a3a3]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 text-base leading-relaxed text-[#d4d4d4]">
                  {step}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <a
              href={mailto}
              className={`inline-flex h-12 shrink-0 items-center justify-center gap-3 whitespace-nowrap bg-[#f9f906] px-8 text-sm font-bold uppercase tracking-widest text-black transition-all hover:brightness-110 ${FOCUS_RING}`}
            >
              <Mail aria-hidden="true" className="h-4 w-4" />
              {earlyAccess.cta}
            </a>
            <p className="text-sm leading-relaxed text-[#a3a3a3]">
              {earlyAccess.ctaHint}{" "}
              <a
                href={mailto}
                className={`text-white underline underline-offset-4 ${FOCUS_RING}`}
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
