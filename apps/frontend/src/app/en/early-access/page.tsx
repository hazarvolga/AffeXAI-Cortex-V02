import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { EarlyAccessView } from "@/components/marketing/views/EarlyAccessView";
import { marketingMetadata } from "@/lib/marketing/metadata";

export const metadata: Metadata = marketingMetadata("en", "earlyAccess");

export default function EnEarlyAccessPage() {
  return (
    <MarketingShell locale="en" page="earlyAccess">
      <EarlyAccessView locale="en" />
    </MarketingShell>
  );
}
