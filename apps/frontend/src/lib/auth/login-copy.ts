import { LoginError } from "./login-outcome";
import { TENANT_SLUG_PATTERN } from "./tenant-selection";

export type LoginContext = "portal" | "team";

export const LOGIN_COPY = {
  brand: "AffeXAI Cortex",
  title: "Giriş yap",
  lead: {
    portal:
      "Portalınıza ya da çalışma alanınıza e-posta adresiniz ve şifrenizle girin.",
    team: "Ekibinizin yönetim paneline e-posta adresiniz ve şifrenizle girin.",
  } satisfies Record<LoginContext, string>,
  email: "E-posta",
  password: "Şifre",
  workspace: "Çalışma alanı kodu",
  workspaceOptional: "isteğe bağlı",
  workspaceHint:
    "Boş bırakabilirsiniz; hesabınızın bağlı olduğu çalışma alanını biz buluruz.",
  workspaceToggle: "Çalışma alanı kodumu girmek istiyorum",
  workspaceLocked: "Çalışma alanı",
  submit: "Giriş yap",
  submitting: "Giriş yapılıyor…",
  forgotPassword: "Şifremi unuttum",
  noAccount: "Hesabınız yok mu?",
  requestAccess: "Erken erişim talep edin",
  chooseTitle: "Çalışma alanını seçin",
  chooseLead:
    "Bu bilgiler birden fazla çalışma alanında geçerli. Devam etmek istediğinizi seçin.",
  chooseBack: "Farklı bilgilerle dene",
  errorSummary: "Formda {count} alan düzeltilmeli.",
  errors: {
    emailRequired: "E-posta adresinizi yazın.",
    emailInvalid: "Geçerli bir e-posta adresi yazın (ör. ad@kurulus.com).",
    passwordRequired: "Şifrenizi yazın.",
    workspaceInvalid:
      "Çalışma alanı kodu yalnız harf, rakam, tire ve alt çizgi içerebilir.",
  },
  failures: {
    credentials:
      "E-posta veya şifre hatalı. Bilgilerinizi kontrol edip yeniden deneyin.",
    rateLimited:
      "Kısa sürede çok fazla deneme yapıldı. Birkaç dakika sonra yeniden deneyin.",
    unavailable:
      "Giriş hizmeti şu an yanıt vermiyor. Biraz sonra yeniden deneyin.",
    network: "Sunucuya ulaşılamadı. Bağlantınızı kontrol edip yeniden deneyin.",
  },
  legal: { privacy: "Gizlilik", terms: "Kullanım koşulları" },
} as const;

export type LoginField = "email" | "password" | "workspace";

export interface LoginValues {
  email: string;
  password: string;
  workspace: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Field errors shown on blur and submit; the backend stays the authority. */
export function validateLogin(
  values: LoginValues,
): Partial<Record<LoginField, string>> {
  const { errors } = LOGIN_COPY;
  const email = values.email.trim();
  const workspace = values.workspace.trim();
  const result: Partial<Record<LoginField, string>> = {};
  if (!email) result.email = errors.emailRequired;
  else if (!EMAIL_PATTERN.test(email)) result.email = errors.emailInvalid;
  if (!values.password) result.password = errors.passwordRequired;
  if (workspace && !TENANT_SLUG_PATTERN.test(workspace))
    result.workspace = errors.workspaceInvalid;
  return result;
}

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_TOO_MANY_REQUESTS = 429;

/** Plain-language reason for a failed login; raw server text is never shown. */
export function loginFailureMessage(error: unknown): string {
  const { failures } = LOGIN_COPY;
  if (!(error instanceof LoginError)) return failures.network;
  if (error.status === HTTP_UNAUTHORIZED || error.status === HTTP_BAD_REQUEST) {
    return failures.credentials;
  }
  if (error.status === HTTP_TOO_MANY_REQUESTS) return failures.rateLimited;
  return failures.unavailable;
}
