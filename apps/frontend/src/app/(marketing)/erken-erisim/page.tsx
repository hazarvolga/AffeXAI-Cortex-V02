import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { EarlyAccessView } from "@/components/marketing/views/EarlyAccessView";
import { marketingMetadata } from "@/lib/marketing/metadata";

export const metadata: Metadata = marketingMetadata("tr", "earlyAccess");

export default function TrEarlyAccessPage() {
  return (
    <MarketingShell locale="tr" page="earlyAccess">
      <EarlyAccessView locale="tr" />
    </MarketingShell>
  );
}
