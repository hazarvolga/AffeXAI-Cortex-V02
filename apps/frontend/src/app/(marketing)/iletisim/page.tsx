import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ContactView } from "@/components/marketing/views/ContactView";
import { marketingMetadata } from "@/lib/marketing/metadata";

export const metadata: Metadata = marketingMetadata("tr", "contact");

export default function TrContactPage() {
  return (
    <MarketingShell locale="tr" page="contact">
      <ContactView locale="tr" />
    </MarketingShell>
  );
}
