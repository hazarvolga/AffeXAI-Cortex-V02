import { cn } from "@/lib/utils";
import {
  fillTemplate,
  getPublicCopy,
  type PublicLocale,
  type PublicModuleStatus,
} from "@/lib/i18n/public-copy";
import { MODULE_GROUPS } from "@/lib/marketing/module-catalog";
import {
  MODULE_COUNT,
  tallyPublicStatuses,
} from "@/lib/marketing/module-status";
import {
  BODY,
  CONTAINER,
  H1,
  H2,
  H3,
  LEAD,
  SECTION,
} from "../marketing-styles";
import { ModuleStatusBadge } from "../ModuleStatusBadge";
import { CtaSection, StatusTallyList } from "../sections";

interface ModulesViewProps {
  locale: PublicLocale;
}

const LEGEND_ORDER: readonly PublicModuleStatus[] = [
  "early-access",
  "in-development",
  "roadmap",
];

export function ModulesView({ locale }: ModulesViewProps) {
  const copy = getPublicCopy(locale);
  const { modules } = copy;
  const tally = tallyPublicStatuses();

  return (
    <>
      <section aria-labelledby="modules-title" className="py-16 md:py-24">
        <div className={CONTAINER}>
          <h1 id="modules-title" className={H1}>
            {modules.title}
          </h1>
          <p className={cn(LEAD, "mt-6 max-w-3xl")}>
            {fillTemplate(modules.lead, { count: MODULE_COUNT })}
          </p>
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <StatusTallyList locale={locale} tally={tally} />
            <div>
              <h2 className={H3}>{modules.legendTitle}</h2>
              <dl className="mt-4 space-y-3">
                {LEGEND_ORDER.map((status) => (
                  <div
                    key={status}
                    className="flex flex-col gap-1 sm:flex-row sm:gap-3"
                  >
                    <dt className="shrink-0 text-sm font-semibold text-foreground sm:w-36">
                      {copy.moduleStatus[status]}
                    </dt>
                    <dd className="text-sm leading-relaxed text-muted-foreground">
                      {modules.legend[status]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {MODULE_GROUPS.map((group) => {
        const groupTally = tallyPublicStatuses(
          group.modules.map((entry) => entry.key),
        );
        return (
          <section
            key={group.key}
            aria-labelledby={`group-${group.key}`}
            className={SECTION}
          >
            <div className={CONTAINER}>
              <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                <h2 id={`group-${group.key}`} className={H2}>
                  {group.title[locale]}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {fillTemplate(modules.summary, {
                    early: groupTally["early-access"],
                    development: groupTally["in-development"],
                    roadmap: groupTally.roadmap,
                  })}
                </p>
              </div>
              <p className={cn(BODY, "mt-3 max-w-2xl")}>
                {group.intro[locale]}
              </p>
              <ul className="mt-8 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2">
                {group.modules.map((entry) => (
                  <li
                    key={entry.key}
                    className="flex flex-col gap-3 bg-background p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className={H3}>{entry.name[locale]}</h3>
                      <ModuleStatusBadge locale={locale} module={entry.key} />
                    </div>
                    <p className={BODY}>{entry.summary[locale]}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <CtaSection
        locale={locale}
        content={modules.cta}
        headingId="modules-cta"
      />
    </>
  );
}
