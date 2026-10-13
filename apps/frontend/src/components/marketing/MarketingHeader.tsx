"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPublicCopy, type PublicLocale } from "@/lib/i18n/public-copy";
import {
  earlyAccessFormPath,
  marketingPath,
  type MarketingPage,
} from "@/lib/marketing/routes";
import { CONTAINER, FOCUS_RING } from "./marketing-styles";

interface MarketingHeaderProps {
  locale: PublicLocale;
  active: MarketingPage;
}

interface NavItem {
  page: MarketingPage;
  label: string;
}

const NAV_PAGES: readonly MarketingPage[] = [
  "modules",
  "howItWorks",
  "earlyAccess",
  "contact",
];

function navItems(locale: PublicLocale): readonly NavItem[] {
  const { nav } = getPublicCopy(locale);
  const labels: Record<MarketingPage, string> = {
    home: nav.label,
    modules: nav.modules,
    howItWorks: nav.howItWorks,
    earlyAccess: nav.earlyAccess,
    contact: nav.contact,
  };
  return NAV_PAGES.map((page) => ({ page, label: labels[page] }));
}

function otherLocale(locale: PublicLocale): PublicLocale {
  return locale === "tr" ? "en" : "tr";
}

export function MarketingHeader({ locale, active }: MarketingHeaderProps) {
  const copy = getPublicCopy(locale);
  const items = navItems(locale);
  const alternate = otherLocale(locale);

  return (
    <header className="border-b border-border bg-background">
      <div
        className={cn(
          CONTAINER,
          "flex h-16 items-center justify-between gap-4 lg:h-20",
        )}
      >
        <Link
          href={marketingPath(locale, "home")}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap text-base font-semibold tracking-tight text-foreground",
            FOCUS_RING,
          )}
        >
          <span aria-hidden="true" className="h-2.5 w-2.5 bg-primary" />
          {copy.brand}
        </Link>

        <nav
          aria-label={copy.nav.label}
          className="hidden items-center gap-8 lg:flex"
        >
          {items.map((item) => (
            <Link
              key={item.page}
              href={marketingPath(locale, item.page)}
              aria-current={item.page === active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap border-b-2 py-1 text-sm transition-colors",
                item.page === active
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
                FOCUS_RING,
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href={marketingPath(alternate, active)}
            hrefLang={alternate}
            lang={alternate}
            title={copy.language.switchLabel}
            className={cn(
              "hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline",
              FOCUS_RING,
            )}
          >
            {copy.language.switchTo}
          </Link>
          <Link
            href="/login"
            className={cn(
              "hidden h-10 items-center whitespace-nowrap rounded-md border border-input px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent lg:inline-flex",
              FOCUS_RING,
            )}
          >
            {copy.nav.login}
          </Link>
          <Link
            href={earlyAccessFormPath(locale)}
            className={cn(
              "hidden h-10 items-center whitespace-nowrap rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex",
              FOCUS_RING,
            )}
          >
            {copy.requestAccess}
          </Link>
          <MobileMenu locale={locale} items={items} active={active} />
        </div>
      </div>
    </header>
  );
}

interface MobileMenuProps {
  locale: PublicLocale;
  items: readonly NavItem[];
  active: MarketingPage;
}

function MobileMenu({ locale, items, active }: MobileMenuProps) {
  const copy = getPublicCopy(locale);
  const alternate = otherLocale(locale);
  const rowClass = cn(
    "flex min-h-12 items-center border-b border-border text-base text-foreground",
    FOCUS_RING,
  );

  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label={copy.nav.openMenu}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-md border border-input text-foreground lg:hidden",
          FOCUS_RING,
        )}
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content
          lang={locale}
          className="theme-marketing fixed inset-y-0 right-0 z-50 flex w-[min(22rem,88vw)] flex-col gap-6 border-l border-border bg-background p-6 text-foreground shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right motion-reduce:animate-none"
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold">
              {copy.nav.menuTitle}
            </Dialog.Title>
            <Dialog.Close
              aria-label={copy.nav.closeMenu}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground",
                FOCUS_RING,
              )}
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {copy.nav.label}
          </Dialog.Description>
          <nav aria-label={copy.nav.label} className="flex flex-col">
            {items.map((item) => (
              <Dialog.Close asChild key={item.page}>
                <Link
                  href={marketingPath(locale, item.page)}
                  aria-current={item.page === active ? "page" : undefined}
                  className={cn(
                    rowClass,
                    item.page === active && "font-semibold text-primary",
                  )}
                >
                  {item.label}
                </Link>
              </Dialog.Close>
            ))}
            <Dialog.Close asChild>
              <Link
                href={marketingPath(alternate, active)}
                hrefLang={alternate}
                lang={alternate}
                title={copy.language.switchLabel}
                className={cn(rowClass, "text-muted-foreground")}
              >
                {copy.language.switchTo}
              </Link>
            </Dialog.Close>
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            <Dialog.Close asChild>
              <Link
                href="/login"
                className={cn(
                  "flex h-12 items-center justify-center rounded-md border border-input text-base font-medium",
                  FOCUS_RING,
                )}
              >
                {copy.nav.login}
              </Link>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Link
                href={earlyAccessFormPath(locale)}
                className={cn(
                  "flex h-12 items-center justify-center rounded-md bg-primary text-base font-semibold text-primary-foreground",
                  FOCUS_RING,
                )}
              >
                {copy.requestAccess}
              </Link>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
