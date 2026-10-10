import { ComingSoon } from "@/components/portal/coming-soon";
import { GraduationCap } from "lucide-react";

export default function CoursesPage() {
  return (
    <ComingSoon
      icon={GraduationCap}
      title="Eğitimlerim"
      description="Eğitim platformumuz hazırlanıyor. Yakında tüm eğitim içeriklerine, kurslarınıza ve ilerlemenize buradan ulaşabileceksiniz."
      expectedDate="2025 Q2"
    />
  );
}
