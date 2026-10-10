import { ComingSoon } from "@/components/portal/coming-soon";
import { Award } from "lucide-react";

export default function CertificatesPage() {
  return (
    <ComingSoon
      icon={Award}
      title="Sertifikalarım"
      description="Sertifika yönetim sistemi geliştiriliyor. Yakında kazandığınız tüm sertifikaları buradan görüntüleyebilecek ve indirebileceksiniz."
      expectedDate="2025 Q2"
    />
  );
}
