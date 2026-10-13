import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getPublicCopy, type PublicLocale } from "@/lib/i18n/public-copy";
import { CONTACT_EMAIL } from "@/lib/marketing/contact";
import { earlyAccessFormPath } from "@/lib/marketing/routes";
import {
  BODY,
  CONTAINER,
  H1,
  H2,
  LEAD,
  SECTION,
  TEXT_LINK,
} from "../marketing-styles";

interface ContactViewProps {
  locale: PublicLocale;
}

export function ContactView({ locale }: ContactViewProps) {
  const { contact } = getPublicCopy(locale);

  return (
    <>
      <section aria-labelledby="contact-title" className="py-16 md:py-24">
        <div className={CONTAINER}>
          <h1 id="contact-title" className={H1}>
            {contact.title}
          </h1>
          <p className={cn(LEAD, "mt-6 max-w-3xl")}>{contact.lead}</p>
          <dl className="mt-10">
            <dt className="text-sm text-muted-foreground">
              {contact.emailLabel}
            </dt>
            <dd className="mt-1">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className={cn(TEXT_LINK, "text-2xl")}
              >
                {CONTACT_EMAIL}
              </a>
            </dd>
          </dl>
        </div>
      </section>

      <section className={SECTION}>
        <div className={cn(CONTAINER, "grid gap-6 md:grid-cols-2")}>
          <div className="rounded-md border border-border bg-card p-6 md:p-8">
            <h2 className={H2}>{contact.earlyAccess.title}</h2>
            <p className={cn(BODY, "mt-3")}>{contact.earlyAccess.body}</p>
            <Button asChild size="lg" className="mt-6 text-base">
              <Link href={earlyAccessFormPath(locale)}>
                {contact.earlyAccess.link}
              </Link>
            </Button>
          </div>
          <div className="rounded-md border border-border p-6 md:p-8">
            <h2 className={H2}>{contact.existing.title}</h2>
            <p className={cn(BODY, "mt-3")}>{contact.existing.body}</p>
            <div className="mt-6 flex flex-wrap gap-6">
              <Link href="/help" className={TEXT_LINK}>
                {contact.existing.help}
              </Link>
              <Link href="/login" className={TEXT_LINK}>
                {contact.existing.login}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
