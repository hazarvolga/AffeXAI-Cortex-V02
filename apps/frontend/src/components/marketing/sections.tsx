import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  getPublicCopy,
  type PublicLocale,
  type PublicModuleStatus,
  type TitledText,
} from "@/lib/i18n/public-copy";
import type { StatusTally } from "@/lib/marketing/module-status";
import { earlyAccessFormPath } from "@/lib/marketing/routes";
import { BODY, CONTAINER, H2, H3, SECTION } from "./marketing-styles";

interface LoopStepsProps {
  steps: readonly TitledText[];
}

/** The closed learning loop as an ordered list; numbers are decorative. */
export function LoopSteps({ steps }: LoopStepsProps) {
  return (
    <ol className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((step, index) => (
        <li key={step.title} className="bg-background p-6">
          <span
            aria-hidden="true"
            className="font-mono text-sm tabular-nums text-muted-foreground"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className={cn(H3, "mt-3")}>{step.title}</h3>
          <p className={cn(BODY, "mt-2")}>{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

const TALLY_ORDER: readonly PublicModuleStatus[] = [
  "early-access",
  "in-development",
  "roadmap",
];

interface StatusTallyListProps {
  locale: PublicLocale;
  tally: StatusTally;
}

export function StatusTallyList({ locale, tally }: StatusTallyListProps) {
  const labels = getPublicCopy(locale).moduleStatus;
  return (
    <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border">
      {TALLY_ORDER.map((status) => (
        <div
          key={status}
          className="flex flex-col-reverse gap-1 bg-background p-4 sm:p-6"
        >
          <dt className="text-sm text-muted-foreground">{labels[status]}</dt>
          <dd className="text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
            {tally[status]}
          </dd>
        </div>
      ))}
    </dl>
  );
}

interface CtaSectionProps {
  locale: PublicLocale;
  content: TitledText;
  headingId: string;
}

/** Closing call to action; the one amber button on the section. */
export function CtaSection({ locale, content, headingId }: CtaSectionProps) {
  return (
    <section aria-labelledby={headingId} className={SECTION}>
      <div
        className={cn(
          CONTAINER,
          "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        )}
      >
        <div className="max-w-2xl">
          <h2 id={headingId} className={H2}>
            {content.title}
          </h2>
          <p className={cn(BODY, "mt-3 text-lg")}>{content.body}</p>
        </div>
        <Button asChild size="lg" className="text-base">
          <Link href={earlyAccessFormPath(locale)}>
            {getPublicCopy(locale).requestAccess}
          </Link>
        </Button>
      </div>
    </section>
  );
}
