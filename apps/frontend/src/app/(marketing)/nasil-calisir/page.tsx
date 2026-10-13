import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { HowItWorksView } from "@/components/marketing/views/HowItWorksView";
import { marketingMetadata } from "@/lib/marketing/metadata";

export const metadata: Metadata = marketingMetadata("tr", "howItWorks");

export default function TrHowItWorksPage() {
  return (
    <MarketingShell locale="tr" page="howItWorks">
      <HowItWorksView locale="tr" />
    </MarketingShell>
  );
}
