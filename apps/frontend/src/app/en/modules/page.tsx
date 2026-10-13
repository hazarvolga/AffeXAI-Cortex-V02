import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ModulesView } from "@/components/marketing/views/ModulesView";
import { marketingMetadata } from "@/lib/marketing/metadata";

export const metadata: Metadata = marketingMetadata("en", "modules");

export default function EnModulesPage() {
  return (
    <MarketingShell locale="en" page="modules">
      <ModulesView locale="en" />
    </MarketingShell>
  );
}
