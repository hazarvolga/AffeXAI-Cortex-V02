"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPublicCopy } from "@/lib/i18n/public-copy";
import { EARLY_ACCESS_ANCHOR } from "@/lib/marketing/contact";

export type MarketingNavKey =
  "modules" | "architecture" | "features" | "pricing";

interface MarketingHeaderProps {
  active?: MarketingNavKey;
  /** Keeps the header pinned while the page scrolls. */
  sticky?: boolean;
}

interface NavItem {
  key: MarketingNavKey;
  href: string;
  label: string;
}

function navItems(): readonly NavItem[] {
  const { nav } = getPublicCopy();
  return [
    { key: "modules", href: "/modules", label: nav.modules },
    { key: "architecture", href: "/architecture", label: nav.architecture },
    { key: "features", href: "/features", label: nav.features },
    { key: "pricing", href: "/pricing", label: nav.earlyAccess },
  ];
}

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f9f906]";

export function MarketingHeader({
  active,
  sticky = false,
}: MarketingHeaderProps) {
  const copy = getPublicCopy();
  const items = navItems();

  return (
    <header
      className={cn(
        "z-40 border-b border-[#1a1a1a] bg-[#050505] px-4 py-5 sm:px-6 lg:px-20 lg:py-8",
        sticky && "sticky top-0",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 whitespace-nowrap text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:text-[#f9f906]",
            FOCUS_RING,
          )}
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 bg-[#f9f906]" />
          {copy.brand}
        </Link>

        <div className="flex items-center gap-3 lg:gap-10">
          <nav
            aria-label={copy.nav.label}
            className="hidden items-center gap-8 lg:flex"
          >
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                aria-current={item.key === active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap text-xs uppercase tracking-widest transition-colors",
                  item.key === active
                    ? "text-[#f9f906]"
                    : "text-[#a3a3a3] hover:text-white",
                  FOCUS_RING,
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/login"
            className={cn(
              "hidden h-10 items-center justify-center whitespace-nowrap border border-[#2a2a2a] bg-[#1a1a1a] px-5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:border-[#f9f906]/50 lg:flex",
              FOCUS_RING,
            )}
          >
            {copy.nav.login}
          </Link>
          <Link
            href={EARLY_ACCESS_ANCHOR}
            className={cn(
              "hidden h-10 items-center justify-center whitespace-nowrap bg-[#f9f906] px-5 text-xs font-bold uppercase tracking-widest text-black transition-all hover:brightness-110 sm:flex",
              FOCUS_RING,
            )}
          >
            {copy.requestAccess}
          </Link>
          <MobileMenu items={items} active={active} />
        </div>
      </div>
    </header>
  );
}

interface MobileMenuProps {
  items: readonly NavItem[];
  active?: MarketingNavKey;
}

function MobileMenu({ items, active }: MobileMenuProps) {
  const copy = getPublicCopy();
  const linkClass = cn(
    "flex min-h-11 items-center border-b border-[#1a1a1a] text-base text-[#d4d4d4] transition-colors hover:text-white",
    FOCUS_RING,
  );

  return (
    <Dialog.Root>
      <Dialog.Trigger
        className={cn(
          "flex h-11 w-11 items-center justify-center border border-[#2a2a2a] text-white lg:hidden",
          FOCUS_RING,
        )}
        aria-label={copy.nav.openMenu}
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col gap-6 border-l border-[#1a1a1a] bg-[#050505] p-6 text-white shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right motion-reduce:animate-none">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-xs font-bold uppercase tracking-[0.2em]">
              {copy.nav.menuTitle}
            </Dialog.Title>
            <Dialog.Close
              className={cn(
                "flex h-11 w-11 items-center justify-center text-[#d4d4d4] hover:text-white",
                FOCUS_RING,
              )}
              aria-label={copy.nav.closeMenu}
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {copy.nav.label}
          </Dialog.Description>
          <nav aria-label={copy.nav.label} className="flex flex-col">
            {items.map((item) => (
              <Dialog.Close asChild key={item.key}>
                <Link
                  href={item.href}
                  aria-current={item.key === active ? "page" : undefined}
                  className={cn(
                    linkClass,
                    item.key === active && "text-[#f9f906]",
                  )}
                >
                  {item.label}
                </Link>
              </Dialog.Close>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            <Dialog.Close asChild>
              <Link
                href="/login"
                className={cn(
                  "flex h-11 items-center justify-center border border-[#2a2a2a] text-sm font-bold uppercase tracking-widest",
                  FOCUS_RING,
                )}
              >
                {copy.nav.login}
              </Link>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Link
                href={EARLY_ACCESS_ANCHOR}
                className={cn(
                  "flex h-11 items-center justify-center bg-[#f9f906] text-sm font-bold uppercase tracking-widest text-black",
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
