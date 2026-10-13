import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { HowItWorksView } from "@/components/marketing/views/HowItWorksView";
import { marketingMetadata } from "@/lib/marketing/metadata";

export const metadata: Metadata = marketingMetadata("en", "howItWorks");

export default function EnHowItWorksPage() {
  return (
    <MarketingShell locale="en" page="howItWorks">
      <HowItWorksView locale="en" />
    </MarketingShell>
  );
}
