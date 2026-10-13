import type { Metadata } from "next";
import { getPublicCopy } from "@/lib/i18n/public-copy";

export const metadata: Metadata = getPublicCopy().meta.home;

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="theme-marketing min-h-screen bg-[#0a0a0a] text-white selection:bg-[#f9bc06] selection:text-black font-sans">
      {children}
    </div>
  );
}
