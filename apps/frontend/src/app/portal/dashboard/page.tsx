"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarDays,
  FileKey2,
  GraduationCap,
  LifeBuoy,
  Mail,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { CortexPageHeader, CortexSurface } from "@/components/brand/editorial";
import { PortalActivityPanel } from "@/components/portal/dashboard/PortalActivityPanel";
import { PortalEventsPanel } from "@/components/portal/dashboard/PortalEventsPanel";
import {
  getPortalNavigation,
  normalizePortalRoles,
} from "@/components/portal/portal-navigation";

const actionMeta = {
  orders: {
    icon: ShoppingBag,
    description: "Siparişlerinizi ve işlem durumlarını inceleyin.",
  },
  licenses: {
    icon: FileKey2,
    description: "Aktif lisans ve kullanım haklarınıza ulaşın.",
  },
  support: {
    icon: LifeBuoy,
    description: "Yeni talep açın veya mevcut talepleri izleyin.",
  },
  knowledge: {
    icon: BookOpen,
    description: "Doğrulanmış yanıtları ve rehberleri bulun.",
  },
  courses: {
    icon: GraduationCap,
    description: "Eğitimlerinize kaldığınız yerden devam edin.",
  },
  certificates: {
    icon: Award,
    description: "Tamamlanan programların belgelerini görüntüleyin.",
  },
  newsletter: {
    icon: Mail,
    description: "Güncel içerik ve duyuru arşivini inceleyin.",
  },
  events: {
    icon: CalendarDays,
    description: "Yaklaşan programları ve kayıt seçeneklerini görün.",
  },
  profile: {
    icon: UserRound,
    description: "Hesap ve iletişim bilgilerinizi yönetin.",
  },
} as const;

const roleLabels: Readonly<Record<string, string>> = {
  customer: "Müşteri",
  student: "Öğrenci",
  subscriber: "Abone",
  viewer: "İzleyici",
};

function humanRole(role: string): string {
  return (
    roleLabels[role] ??
    role
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase("tr-TR"))
  );
}

export default function PortalDashboardPage() {
  const { user } = useAuth();
  const roles = normalizePortalRoles(user);
  const navigation = getPortalNavigation(user);
  const actions = navigation.filter(({ id }) => id !== "dashboard").slice(0, 6);
  const roleSummary =
    roles.length > 0 ? roles.map(humanRole).join(" · ") : "Portal kullanıcısı";
  const firstName = user?.firstName?.trim();
  const tenantName = user?.tenantId?.trim() || "AffeXAI çalışma alanı";
  const canViewEvents = navigation.some(({ id }) => id === "events");

  return (
    <div data-cortex-shell="portal-dashboard">
      <CortexPageHeader
        eyebrow="Client intelligence / 01"
        title="Genel Bakış"
        badge="Erişim açık"
        description={
          firstName
            ? `${firstName}, çalışma alanınızdaki güncel işlemlere buradan devam edebilirsiniz.`
            : "Çalışma alanınızdaki güncel işlemlere buradan devam edebilirsiniz."
        }
      />

      <section
        aria-label="Oturum özeti"
        className="grid border-b border-[var(--cortex-line)] sm:grid-cols-3"
      >
        {[
          { label: "Çalışma alanı", value: tenantName },
          { label: "Erişim profili", value: roleSummary },
          { label: "Oturum", value: "Doğrulandı" },
        ].map((item) => (
          <div
            key={item.label}
            className="border-b border-[var(--cortex-line)] px-5 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:px-8 sm:last:border-r-0"
          >
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--cortex-text-faint)]">
              {item.label}
            </p>
            <p className="mt-2 truncate text-sm font-medium text-[var(--cortex-text)]">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <CortexSurface
          eyebrow="Next action"
          title="Şimdi ne yapmak istersiniz?"
          description="Rolünüze açık işlemler tek bir çalışma sırasına göre gösterilir."
        >
          {actions.length === 0 ? (
            <div className="px-6 py-10 text-sm text-[var(--cortex-text-muted)]">
              Bu hesap için henüz bir işlem alanı tanımlanmamış. Profil
              bilgilerinizi kontrol edebilirsiniz.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3">
              {actions.map((item, index) => {
                const meta =
                  actionMeta[item.id as keyof typeof actionMeta] ??
                  actionMeta.profile;
                const Icon = meta.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group relative min-h-44 border-b border-[var(--cortex-line)] p-5 transition-colors hover:bg-[var(--cortex-surface-quiet)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--cortex-focus)] sm:p-6 sm:[&:nth-child(odd)]:border-r xl:border-r xl:[&:nth-child(3n)]:border-r-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-mono text-[10px] text-[var(--cortex-text-faint)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Icon
                        className="h-4 w-4 text-[var(--cortex-text-faint)] group-hover:text-[var(--cortex-accent-ink)]"
                        aria-hidden="true"
                      />
                    </div>
                    <h2 className="mt-8 text-base font-semibold group-hover:text-[var(--cortex-accent-ink)]">
                      {item.label}
                    </h2>
                    <p className="mt-2 max-w-xs text-xs leading-5 text-[var(--cortex-text-muted)]">
                      {meta.description}
                    </p>
                    <ArrowUpRight
                      className="absolute bottom-5 right-5 h-4 w-4 text-[var(--cortex-text-faint)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--cortex-accent-ink)]"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </CortexSurface>

        <div className="grid gap-6 xl:grid-cols-2">
          <PortalActivityPanel />
          {canViewEvents ? (
            <PortalEventsPanel />
          ) : (
            <CortexSurface
              eyebrow="Account"
              title="Profiliniz"
              description="İletişim ve hesap bilgilerinizi güncel tutun."
              className="min-h-[320px]"
            >
              <div className="flex min-h-52 items-center justify-center p-6">
                <Link
                  href="/portal/profile"
                  className="inline-flex items-center gap-2 border border-[var(--cortex-line-strong)] px-4 py-3 text-sm font-semibold hover:border-[var(--cortex-accent)] hover:text-[var(--cortex-accent-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cortex-focus)]"
                >
                  Profili aç <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </CortexSurface>
          )}
        </div>
      </div>
    </div>
  );
}
