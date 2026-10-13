import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ContactView } from "@/components/marketing/views/ContactView";
import { marketingMetadata } from "@/lib/marketing/metadata";

export const metadata: Metadata = marketingMetadata("en", "contact");

export default function EnContactPage() {
  return (
    <MarketingShell locale="en" page="contact">
      <ContactView locale="en" />
    </MarketingShell>
  );
}
