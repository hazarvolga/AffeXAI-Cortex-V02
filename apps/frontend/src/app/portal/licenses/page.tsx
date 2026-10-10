import { ComingSoon } from "@/components/portal/coming-soon";
import { KeyRound } from "lucide-react";

export default function LicensesPage() {
  return (
    <ComingSoon
      icon={KeyRound}
      title="Lisanslarım"
      description="Lisans yönetim sistemi geliştirme aşamasındadır. Yakında tüm lisanslarınızı ve aboneliklerinizi buradan yönetebileceksiniz."
      expectedDate="2025 Q1"
    />
  );
}
