import type { PublicModuleStatus } from "@/lib/i18n/public-copy";

/** Status vocabulary of docs/active/AffeXAI-Cortex_Modul_Kabul_Matrisi.md. */
export type AcceptanceStatus =
  | "Bekliyor"
  | "Uygulanıyor"
  | "Yerelde doğrulandı"
  | "Entegrasyonda doğrulandı"
  | "Yayın kabulü geçti";

/**
 * Acceptance status of the backend modules the marketing pages mention.
 * Mirror of the acceptance matrix: update both in the same change so the public
 * site never shows a module ahead of its accepted state.
 */
export const MODULE_ACCEPTANCE = {
  certificates: "Bekliyor",
  commerce: "Bekliyor",
  crm: "Yerelde doğrulandı",
  "email-marketing": "Bekliyor",
  events: "Bekliyor",
  "faq-learning": "Bekliyor",
  mail: "Bekliyor",
  "social-media": "Bekliyor",
  strategy: "Bekliyor",
  tickets: "Uygulanıyor",
} as const satisfies Record<string, AcceptanceStatus>;

export type MarketedModule = keyof typeof MODULE_ACCEPTANCE;

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
