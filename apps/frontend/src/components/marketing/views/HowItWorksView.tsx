import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPublicCopy, type PublicLocale } from "@/lib/i18n/public-copy";
import { marketingPath } from "@/lib/marketing/routes";
import {
  BODY,
  CONTAINER,
  H1,
  H2,
  H3,
  LEAD,
  SECTION,
  TEXT_LINK,
} from "../marketing-styles";
import { CtaSection, LoopSteps } from "../sections";

interface HowItWorksViewProps {
  locale: PublicLocale;
}

export function HowItWorksView({ locale }: HowItWorksViewProps) {
  const copy = getPublicCopy(locale);
  const page = copy.howItWorks;

  return (
    <>
      <section aria-labelledby="how-title" className="py-16 md:py-24">
        <div className={CONTAINER}>
          <h1 id="how-title" className={H1}>
            {page.title}
          </h1>
          <p className={cn(LEAD, "mt-6 max-w-3xl")}>{page.lead}</p>
        </div>
      </section>

      <section aria-labelledby="how-layers" className={SECTION}>
        <div className={CONTAINER}>
          <h2 id="how-layers" className={H2}>
            {page.layersTitle}
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {page.layers.map((layer, index) => (
              <li key={layer.title} className="border-t-2 border-border pt-6">
                <span
                  aria-hidden="true"
                  className="font-mono text-sm tabular-nums text-muted-foreground"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className={cn(H3, "mt-2")}>{layer.title}</h3>
                <p className={cn(BODY, "mt-2")}>{layer.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="how-loop" className={SECTION}>
        <div className={CONTAINER}>
          <h2 id="how-loop" className={H2}>
            {page.loopTitle}
          </h2>
          <p className={cn(BODY, "mt-3 max-w-2xl text-lg")}>
            {copy.home.loop.intro}
          </p>
          <div className="mt-10">
            <LoopSteps steps={copy.home.loop.steps} />
          </div>
        </div>
      </section>

      <section aria-labelledby="how-safeguards" className={SECTION}>
        <div className={cn(CONTAINER, "grid gap-12 lg:grid-cols-2")}>
          <div>
            <h2 id="how-safeguards" className={H2}>
              {page.safeguards.title}
            </h2>
            <ul className="mt-8 space-y-4">
              {page.safeguards.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check
                    aria-hidden="true"
                    className="mt-1 h-5 w-5 shrink-0 text-muted-foreground"
                  />
                  <span className={BODY}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside
            aria-labelledby="how-not-yet"
            className="self-start rounded-md border border-border bg-card p-6 md:p-8"
          >
            <h2 id="how-not-yet" className={H3}>
              {page.notYet.title}
            </h2>
            <p className={cn(BODY, "mt-3")}>{page.notYet.body}</p>
            <p className="mt-6">
              <Link
                href={marketingPath(locale, "modules")}
                className={TEXT_LINK}
              >
                {page.notYet.link}
              </Link>
            </p>
          </aside>
        </div>
      </section>

      <CtaSection locale={locale} content={page.cta} headingId="how-cta" />
    </>
  );
}
