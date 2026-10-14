"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Database,
  Globe,
  Palette,
  User,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";

interface SettingsArea {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
}

/** Only settings surfaces that exist; planned ones are not advertised (UX-CONTRACT). */
const SETTINGS_AREAS: SettingsArea[] = [
  {
    title: "Site ayarları",
    description: "Site adı, logo, iletişim bilgileri ve meta etiketleri.",
    icon: Globe,
    path: "/settings/site",
  },
  {
    title: "Tema",
    description: "Renkler, tipografi ve marka görünümü.",
    icon: Palette,
    path: "/settings/theme",
  },
  {
    title: "Otomasyon",
    description: "Otomatik iş akışlarının genel ayarları.",
    icon: Workflow,
    path: "/settings/automation",
  },
  {
    title: "Yedekleme",
    description: "Yedek alma ve geri yükleme noktaları.",
    icon: Database,
    path: "/settings/backup",
  },
  {
    title: "Profilim",
    description: "Kendi hesap bilgileriniz ve tercihleriniz.",
    icon: User,
    path: "/profile",
  },
];

export default function AdminSettingsPage() {
  const tenant = String(useParams().tenant || "");

  return (
    <BccEditorialWrapper
      headerTitle="Ayarlar"
      headerSubtitle="Çalışma alanının site, görünüm, otomasyon ve yedekleme ayarları."
      headerBadge="Yönetim"
    >
      <nav aria-label="Ayar alanları" className="pb-20">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SETTINGS_AREAS.map(({ title, description, icon: Icon, path }) => (
            <li key={path}>
              <Link
                href={`/${tenant}/admin${path}`}
                className="group flex h-full flex-col gap-3 border border-white/15 bg-white/[0.02] p-6 transition-colors hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <Icon aria-hidden className="h-5 w-5 text-white/80" />
                <span className="text-base font-semibold text-white">
                  {title}
                </span>
                <span className="text-sm text-white/75">{description}</span>
                <span className="mt-auto inline-flex items-center gap-1 text-sm text-white/85 group-hover:underline">
                  Aç <ArrowRight aria-hidden className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </BccEditorialWrapper>
  );
}
