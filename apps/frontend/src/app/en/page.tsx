import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { HomeView } from "@/components/marketing/views/HomeView";
import { marketingMetadata } from "@/lib/marketing/metadata";

export const metadata: Metadata = marketingMetadata("en", "home");

export default function EnHomePage() {
  return (
    <MarketingShell locale="en" page="home">
      <HomeView locale="en" />
    </MarketingShell>
  );
}
