import { ComingSoon } from "@/components/portal/coming-soon";
import { Mail } from "lucide-react";

export default function NewsletterPage() {
  return (
    <ComingSoon
      icon={Mail}
      title="Bülten Arşivi"
      description="Bülten arşiv sistemi hazırlanıyor. Yakında geçmiş bültenlerimize buradan ulaşabilecek ve tercihlerinizi yönetebileceksiniz."
      expectedDate="2025 Q2"
    />
  );
}
