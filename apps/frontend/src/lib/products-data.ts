import type { LucideIcon } from "lucide-react";
import {
  Layers,
  Building,
  Network,
  Construction,
  Settings,
  Users,
} from "lucide-react";

export type ProductSlide = {
  id: string;
  category: string;
  title: string;
  description: string;
  items: { title: string; href: string }[];
  imageUrl: string;
  imageHint: string;
  Icon: LucideIcon;
};

export const productsData: ProductSlide[] = [
  {
    id: "xyz-suite",
    category: "Ürün Ailesi",
    title: "XYZ Suite",
    description:
      "Tasarım, mühendislik ve inşaat için kapsamlı ve entegre BIM çözümleri sunan XYZ Suite ürün ailesini keşfedin.",
    items: [
      { title: "XYZ Suite Basic", href: "/products/xyz-suite/basic" },
      { title: "XYZ Suite Concept", href: "/products/xyz-suite/concept" },
      {
        title: "XYZ Suite Professional",
        href: "/products/xyz-suite/professional",
      },
      { title: "XYZ Suite Ultimate", href: "/products/xyz-suite/ultimate" },
      { title: "XYZ Suite Civil", href: "/products/xyz-suite/civil" },
      { title: "XYZ Suite Precast", href: "/products/xyz-suite/precast" },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1633442118043-57b686a51aa3?q=80&w=800&auto=format&fit=crop",
    imageHint: "3d architectural model software",
    Icon: Layers,
  },
  {
    id: "building-infrastructure",
    category: "Sektör Çözümleri",
    title: "BİNA VE ALTYAPI YAZILIMLARI",
    description:
      "Bina ve altyapı projelerinizin her aşaması için özel olarak geliştirilmiş güçlü yazılım çözümleri.",
    items: [
      {
        title: "XYZ Suite - AEC Endüstrisi için BIM",
        href: "/products/building-infrastructure/xyz-aec",
      },
      {
        title: "XYZ Suite Bridge - Köprü Tasarımı",
        href: "/products/building-infrastructure/xyz-bridge",
      },
      {
        title: "AX3000 - Enerji Simülasyonu",
        href: "/products/building-infrastructure/ax3000",
      },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6164a83639?q=80&w=800&auto=format&fit=crop",
    imageHint: "building and infrastructure design",
    Icon: Building,
  },
  {
    id: "construction-planning",
    category: "Sektör Çözümleri",
    title: "İNŞAAT PLANLAMA YAZILIMLARI",
    description:
      "İnşaat süreçlerinizi optimize eden, detaylandırma ve imalat süreçlerini kolaylaştıran özel planlama yazılımları.",
    items: [
      {
        title: "XYZ Suite Precast - Prekast Detaylandırma",
        href: "/products/xyz-suite/precast",
      },
      {
        title: "Tim - Prekast İş Planlaması",
        href: "/products/construction-planning/tim",
      },
      {
        title: "SDS/2 - Çelik Detaylandırma",
        href: "/products/construction-planning/sds2",
      },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1581092918056-0c9c4e57891b?q=80&w=800&auto=format&fit=crop",
    imageHint: "construction planning software",
    Icon: Construction,
  },
  {
    id: "collaboration",
    category: "Platform",
    title: "İŞBİRLİĞİ YAZILIMLARI",
    description:
      "Proje paydaşlarınızı tek bir platformda bir araya getiren, disiplinlerarası işbirliğini ve veri yönetimini kolaylaştıran bulut tabanlı çözümler.",
    items: [
      {
        title: "Bimplus - Disiplinlerarası İşbirliği",
        href: "/products/collaboration/bimplus",
      },
      {
        title: "Bimplus Hesabı Oluşturun veya Giriş Yapın",
        href: "https://www.bimplus.net/",
      },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800&auto=format&fit=crop",
    imageHint: "team collaboration platform",
    Icon: Users,
  },
];
