import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPublicCopy, type PublicLocale } from "@/lib/i18n/public-copy";
import { marketingPath, type MarketingPage } from "@/lib/marketing/routes";
import { CONTAINER, FOCUS_RING } from "./marketing-styles";

interface MarketingFooterProps {
  locale: PublicLocale;
  page: MarketingPage;
}

const LINK = cn(
  "text-sm text-muted-foreground transition-colors hover:text-foreground",
  FOCUS_RING,
);

export function MarketingFooter({ locale, page }: MarketingFooterProps) {
  const copy = getPublicCopy(locale);
  const alternate: PublicLocale = locale === "tr" ? "en" : "tr";
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background py-12 md:py-16">
      <div
        className={cn(
          CONTAINER,
          "flex flex-col gap-10 md:flex-row md:justify-between",
        )}
      >
        <div className="max-w-sm space-y-3">
          <p className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span aria-hidden="true" className="h-2.5 w-2.5 bg-primary" />
            {copy.brand}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {copy.footer.tagline}
          </p>
          <p className="text-sm text-muted-foreground">{copy.productPhase}</p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:gap-16">
          <nav aria-label={copy.footer.siteLabel}>
            <ul className="space-y-3">
              <li>
                <Link href={marketingPath(locale, "modules")} className={LINK}>
                  {copy.nav.modules}
                </Link>
              </li>
              <li>
                <Link
                  href={marketingPath(locale, "howItWorks")}
                  className={LINK}
                >
                  {copy.nav.howItWorks}
                </Link>
              </li>
              <li>
                <Link
                  href={marketingPath(locale, "earlyAccess")}
                  className={LINK}
                >
                  {copy.nav.earlyAccess}
                </Link>
              </li>
              <li>
                <Link href={marketingPath(locale, "contact")} className={LINK}>
                  {copy.nav.contact}
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label={copy.footer.legalLabel}>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className={LINK}>
                  {copy.footer.privacy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className={LINK}>
                  {copy.footer.terms}
                </Link>
              </li>
              <li>
                <Link
                  href={marketingPath(alternate, page)}
                  hrefLang={alternate}
                  lang={alternate}
                  className={LINK}
                >
                  {copy.language.switchTo}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      <p className={cn(CONTAINER, "mt-10 text-sm text-muted-foreground")}>
        © {year} AffeXAI. {copy.footer.rights}
      </p>
    </footer>
  );
}
