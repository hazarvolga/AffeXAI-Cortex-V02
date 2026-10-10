import { ComingSoon } from "@/components/portal/coming-soon";
import { ShoppingCart } from "lucide-react";

export default function OrdersPage() {
  return (
    <ComingSoon
      icon={ShoppingCart}
      title="Siparişlerim"
      description="E-ticaret modülümüz şu anda geliştirme aşamasındadır. Yakında siparişlerinizi buradan takip edebileceksiniz."
      expectedDate="2025 Q1"
    />
  );
}
