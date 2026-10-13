import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPublicCopy } from "@/lib/i18n/public-copy";

const LINK_CLASS = cn(
  "text-sm text-[#a3a3a3] transition-colors hover:text-white",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f9f906]",
);

export function MarketingFooter() {
  const copy = getPublicCopy();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-[#1a1a1a] bg-[#050505] px-4 py-14 sm:px-6 lg:px-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-sm space-y-3">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white">
            <span aria-hidden="true" className="h-2 w-2 bg-[#f9f906]" />
            {copy.brand}
          </p>
          <p className="text-sm leading-relaxed text-[#a3a3a3]">
            {copy.footer.tagline}
          </p>
          <p className="text-xs text-[#a3a3a3]">{copy.productPhase}</p>
        </div>
        <div className="flex flex-col gap-6 md:items-end">
          <nav
            aria-label={copy.nav.label}
            className="flex flex-wrap gap-x-8 gap-y-3"
          >
            <Link href="/modules" className={LINK_CLASS}>
              {copy.nav.modules}
            </Link>
            <Link href="/architecture" className={LINK_CLASS}>
              {copy.nav.architecture}
            </Link>
            <Link href="/features" className={LINK_CLASS}>
              {copy.nav.features}
            </Link>
            <Link href="/pricing" className={LINK_CLASS}>
              {copy.nav.earlyAccess}
            </Link>
          </nav>
          <nav
            aria-label={copy.footer.legalLabel}
            className="flex flex-wrap gap-x-8 gap-y-3"
          >
            <Link href="/privacy" className={LINK_CLASS}>
              {copy.footer.privacy}
            </Link>
            <Link href="/terms" className={LINK_CLASS}>
              {copy.footer.terms}
            </Link>
          </nav>
          <p className="text-xs text-[#a3a3a3]">
            © {year} AffeXAI. {copy.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
