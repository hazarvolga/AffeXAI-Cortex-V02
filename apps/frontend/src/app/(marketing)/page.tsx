import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { HomeView } from "@/components/marketing/views/HomeView";
import { marketingMetadata } from "@/lib/marketing/metadata";

export const metadata: Metadata = marketingMetadata("tr", "home");

export default function TrHomePage() {
  return (
    <MarketingShell locale="tr" page="home">
      <HomeView locale="tr" />
    </MarketingShell>
  );
}
