import type { PublicModuleStatus } from "@/lib/i18n/public-copy";

/** Status vocabulary of docs/active/AffeXAI-Cortex_Modul_Kabul_Matrisi.md. */
export type AcceptanceStatus =
  | "Bekliyor"
  | "Uygulanıyor"
  | "Yerelde doğrulandı"
  | "Entegrasyonda doğrulandı"
  | "Yayın kabulü geçti";

/**
 * Acceptance status of all backend modules (apps/backend/src/modules).
 * Mirror of the acceptance matrix: update both in the same change so the public
 * site never shows a module ahead of its accepted state.
 */
export const MODULE_ACCEPTANCE = {
  ai: "Bekliyor",
  analytics: "Bekliyor",
  backup: "Uygulanıyor",
  bcc: "Bekliyor",
  brand: "Bekliyor",
  certificates: "Bekliyor",
  chat: "Bekliyor",
  cms: "Bekliyor",
  commerce: "Bekliyor",
  crm: "Yerelde doğrulandı",
  "database-import": "Uygulanıyor",
  "email-marketing": "Bekliyor",
  events: "Bekliyor",
  "faq-learning": "Bekliyor",
  forms: "Uygulanıyor",
  "insight-engine": "Bekliyor",
  "knowledge-sources": "Bekliyor",
  mail: "Bekliyor",
  media: "Bekliyor",
  "neural-crawler": "Bekliyor",
  "neural-grid": "Uygulanıyor",
  notifications: "Uygulanıyor",
  organizations: "Yerelde doğrulandı",
  "platform-integration": "Uygulanıyor",
  roles: "Yerelde doğrulandı",
  settings: "Yerelde doğrulandı",
  shared: "Bekliyor",
  "social-media": "Bekliyor",
  strategy: "Bekliyor",
  "system-logs": "Bekliyor",
  tickets: "Uygulanıyor",
  "trust-dynamics": "Bekliyor",
  users: "Yerelde doğrulandı",
} as const satisfies Record<string, AcceptanceStatus>;

export type MarketedModule = keyof typeof MODULE_ACCEPTANCE;

export const ALL_MODULES = Object.keys(MODULE_ACCEPTANCE) as MarketedModule[];

/** Single public source for "how many modules": the acceptance matrix. */
export const MODULE_COUNT = ALL_MODULES.length;

const PUBLIC_STATUS_BY_ACCEPTANCE: Readonly<
  Record<AcceptanceStatus, PublicModuleStatus>
> = {
  Bekliyor: "roadmap",
  Uygulanıyor: "in-development",
  "Yerelde doğrulandı": "early-access",
  "Entegrasyonda doğrulandı": "early-access",
  "Yayın kabulü geçti": "early-access",
};

export function publicStatusOf(module: MarketedModule): PublicModuleStatus {
  return PUBLIC_STATUS_BY_ACCEPTANCE[MODULE_ACCEPTANCE[module]];
}

export type StatusTally = Readonly<Record<PublicModuleStatus, number>>;

export function tallyPublicStatuses(
  modules: readonly MarketedModule[] = ALL_MODULES,
): StatusTally {
  return modules.reduce<StatusTally>(
    (tally, module) => {
      const status = publicStatusOf(module);
      return { ...tally, [status]: tally[status] + 1 };
    },
    { "early-access": 0, "in-development": 0, roadmap: 0 },
  );
}
