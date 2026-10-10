import { CategorizationInsights } from '@/components/admin/support/categorization-insights';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
export default function AIInsightsPage() {
  return <BccEditorialWrapper headerTitle="KATEGORİZASYON" headerSubtitle="Anahtar kelime kuralları ve gözlenen kayıt sayıları." headerBadge="KEYWORD RULES" telemetryData={[]}><CategorizationInsights /></BccEditorialWrapper>;
}
