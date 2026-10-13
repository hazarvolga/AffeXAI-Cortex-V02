import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  fillTemplate,
  getPublicCopy,
  type PublicLocale,
} from "@/lib/i18n/public-copy";
import {
  MODULE_COUNT,
  tallyPublicStatuses,
} from "@/lib/marketing/module-status";
import { earlyAccessFormPath, marketingPath } from "@/lib/marketing/routes";
import {
  BODY,
  CONTAINER,
  EYEBROW,
  H1,
  H2,
  H3,
  LEAD,
  SECTION,
  TEXT_LINK,
} from "../marketing-styles";
import { CtaSection, LoopSteps, StatusTallyList } from "../sections";

interface HomeViewProps {
  locale: PublicLocale;
}

export function HomeView({ locale }: HomeViewProps) {
  const copy = getPublicCopy(locale);
  const { home } = copy;

  return (
    <>
      <section aria-labelledby="home-title" className="py-16 md:py-28">
        <div className={CONTAINER}>
          <p className={EYEBROW}>{copy.productPhase}</p>
          <h1 id="home-title" className={cn(H1, "mt-4 max-w-4xl")}>
            {home.title}
          </h1>
          <p className={cn(LEAD, "mt-6 max-w-3xl")}>{home.lead}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="text-base">
              <Link href={earlyAccessFormPath(locale)}>
                {copy.requestAccess}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link href={marketingPath(locale, "howItWorks")}>
                {home.secondaryCta}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="home-problem" className={SECTION}>
        <div className={CONTAINER}>
          <h2 id="home-problem" className={cn(H2, "max-w-3xl")}>
            {home.problem.title}
          </h2>
          <ul className="mt-10 grid gap-8 md:grid-cols-3">
            {home.problem.items.map((item) => (
              <li key={item.title} className="border-t border-border pt-6">
                <h3 className={H3}>{item.title}</h3>
                <p className={cn(BODY, "mt-2")}>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="home-loop" className={SECTION}>
        <div className={CONTAINER}>
          <h2 id="home-loop" className={H2}>
            {home.loop.title}
          </h2>
          <p className={cn(BODY, "mt-3 max-w-2xl text-lg")}>
            {home.loop.intro}
          </p>
          <div className="mt-10">
            <LoopSteps steps={home.loop.steps} />
          </div>
          <p className="mt-8">
            <Link
              href={marketingPath(locale, "howItWorks")}
              className={TEXT_LINK}
            >
              {home.loop.link}
            </Link>
          </p>
        </div>
      </section>

      <section aria-labelledby="home-status" className={SECTION}>
        <div
          className={cn(
            CONTAINER,
            "grid gap-10 lg:grid-cols-2 lg:items-center",
          )}
        >
          <div>
            <h2 id="home-status" className={H2}>
              {home.status.title}
            </h2>
            <p className={cn(BODY, "mt-3 text-lg")}>
              {fillTemplate(home.status.body, { count: MODULE_COUNT })}
            </p>
            <p className="mt-6">
              <Link
                href={marketingPath(locale, "modules")}
                className={TEXT_LINK}
              >
                {home.status.link}
              </Link>
            </p>
          </div>
          <StatusTallyList locale={locale} tally={tallyPublicStatuses()} />
        </div>
      </section>

      <section aria-labelledby="home-principles" className={SECTION}>
        <div className={CONTAINER}>
          <h2 id="home-principles" className={H2}>
            {home.principles.title}
          </h2>
          <ul className="mt-10 grid gap-8 md:grid-cols-3">
            {home.principles.items.map((item) => (
              <li key={item.title} className="border-t border-border pt-6">
                <h3 className={H3}>{item.title}</h3>
                <p className={cn(BODY, "mt-2")}>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaSection
        locale={locale}
        content={home.finalCta}
        headingId="home-cta"
      />
    </>
  );
}
