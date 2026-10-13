import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ModulesView } from "@/components/marketing/views/ModulesView";
import { marketingMetadata } from "@/lib/marketing/metadata";

export const metadata: Metadata = marketingMetadata("tr", "modules");

export default function TrModulesPage() {
  return (
    <MarketingShell locale="tr" page="modules">
      <ModulesView locale="tr" />
    </MarketingShell>
  );
}
