import type { MegaMenuCategory } from "@/lib/types";
import {
  Building,
  Network,
  Briefcase,
  GraduationCap,
  Users,
  Book,
  PenSquare,
  Construction,
  Layers3,
  Blocks,
  GitFork,
  Puzzle,
  Globe,
  MapPin,
  Building2,
  Landmark,
  Factory,
  Video,
  Download,
  HardHat,
  LifeBuoy,
  GraduationCapIcon,
  Files,
  UserCheck,
  Tv,
} from "lucide-react";
import { educationData as educationContent } from "./education-data";

export const solutionsMegaMenu: MegaMenuCategory[] = [
  {
    title: "Bina Tasarımı",
    href: "/solutions/building-design",
    items: [
      {
        title: "Mimari",
        href: "/solutions/building-design/architecture",
        description: "Yenilikçi ve sürdürülebilir mimari çözümler.",
        icon: Building,
      },
      {
        title: "Yapısal Mühendislik",
        href: "/solutions/building-design/structural-engineering",
        description: "Güvenli ve verimli taşıyıcı sistem tasarımları.",
        icon: Construction,
      },
      {
        title: "MEP",
        href: "/solutions/building-design/mep",
        description: "Mekanik, elektrik ve sıhhi tesisat.",
        icon: HardHat,
      },
    ],
  },
  {
    title: "Altyapı Tasarımı",
    href: "/solutions/infrastructure-design",
    items: [
      {
        title: "Altyapı Mühendisliği",
        href: "/solutions/infrastructure-design/infrastructure-engineering",
        description: "Modern ulaşım ağları için altyapı projeleri.",
        icon: Network,
      },
      {
        title: "Yol & Demiryolu Tasarımı",
        href: "/solutions/infrastructure-design/road-railway-design",
        description: "Yol ve demiryolu projeleri.",
        icon: Network,
      },
      {
        title: "Köprü Tasarımı",
        href: "/solutions/infrastructure-design/bridge-design",
        description: "Estetik ve dayanıklı köprü mühendisliği.",
        icon: Landmark,
      },
    ],
  },
  {
    title: "İnşaat Planlaması",
    href: "/solutions/construction-planning",
    items: [
      {
        title: "Prefabrik Üretimi",
        href: "/solutions/construction-planning/precast-production",
        description: "Endüstriyel prefabrik yapı çözümleri.",
        icon: Factory,
      },
      {
        title: "Çelik Detaylandırma",
        href: "/solutions/construction-planning/steel-detailing",
        description: "Çelik yapılar için detaylandırma.",
        icon: Construction,
      },
      {
        title: "Şantiye Planlaması",
        href: "/solutions/construction-planning/site-planning",
        description: "Şantiye yönetimi ve planlaması.",
        icon: MapPin,
      },
    ],
  },
  {
    title: "Diğer Çözümler",
    href: "/solutions",
    items: [
      {
        title: "İşbirliği",
        href: "/solutions/collaboration",
        description: "AEC projeleri için entegre yönetim araçları.",
        icon: Briefcase,
      },
      {
        title: "Eklentiler",
        href: "/solutions/plugins",
        description: "XYZ Suite işlevselliğini genişleten eklentiler.",
        icon: Puzzle,
      },
      {
        title: "Ek Modüller",
        href: "/solutions/add-on-modules",
        description: "Ekstra XYZ Suite modülleri.",
        icon: Layers3,
      },
    ],
  },
];

export const productsMegaMenu: MegaMenuCategory[] = [
  {
    title: "XYZ Suite Sürümleri",
    href: "/products/xyz-suite",
    items: [
      {
        title: "XYZ Suite Basic",
        href: "/products/xyz-suite/basic",
        description: "Temel 2B/3B modelleme araçları.",
        icon: PenSquare,
      },
      {
        title: "XYZ Suite Concept",
        href: "/products/xyz-suite/concept",
        description: "Kavramsal tasarım ve görselleştirme.",
        icon: Blocks,
      },
      {
        title: "XYZ Suite Professional",
        href: "/products/xyz-suite/professional",
        description: "Profesyoneller için kapsamlı BIM çözümü.",
        icon: Briefcase,
      },
      {
        title: "XYZ Suite Ultimate",
        href: "/products/xyz-suite/ultimate",
        description: "Tüm özelliklere sahip nihai paket.",
        icon: Layers3,
      },
    ],
  },
  {
    title: "Uzmanlık Alanları",
    href: "/products/xyz-suite",
    items: [
      {
        title: "XYZ Suite Civil",
        href: "/products/xyz-suite/civil",
        description: "İnşaat mühendisliği ve altyapı projeleri.",
        icon: Network,
      },
      {
        title: "XYZ Suite Precast",
        href: "/products/xyz-suite/precast",
        description: "Prefabrik eleman tasarımı ve üretimi.",
        icon: Factory,
      },
      {
        title: "XYZ Suite Bridge",
        href: "/products/building-infrastructure/xyz-bridge",
        description: "Köprü tasarımı ve analizi.",
        icon: Landmark,
      },
    ],
  },
  {
    title: "Platform & İşbirliği",
    href: "/products/collaboration",
    items: [
      {
        title: "XYZ Suite Connect",
        href: "https://example.com/",
        description: "Kullanıcı portalı, forumlar ve kaynaklar.",
        icon: Users,
      },
      {
        title: "Bimplus",
        href: "/products/collaboration/bimplus",
        description: "Bulut tabanlı işbirliği platformu.",
        icon: GitFork,
      },
      {
        title: "SDS/2",
        href: "/products/construction-planning/sds2",
        description: "Çelik detaylandırma ve imalat yazılımı.",
        icon: Construction,
      },
    ],
  },
  {
    title: "Partner Çözümleri",
    href: "/products",
    items: [
      {
        title: "AX3000",
        href: "/products/building-infrastructure/ax3000",
        description: "TGA ve enerji simülasyonu.",
        icon: GraduationCap,
      },
      {
        title: "Tim",
        href: "/products/construction-planning/tim",
        description: "Prekast için iş planlaması.",
        icon: Book,
      },
    ],
  },
];

export const educationData = {
  tabs: educationContent.tabs,
  content: educationContent.content,
};
