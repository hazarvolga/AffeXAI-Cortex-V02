export type ValidationStatus = "valid" | "invalid" | "risky" | "unknown";

export interface ValidationCheckResult {
  isValid: boolean;
  details: string;
  suggestion?: string;
}

export interface AddressValidationResult {
  email: string;
  isValid: boolean;
  status: ValidationStatus;
  confidence: number;
  checks?: Partial<Record<string, ValidationCheckResult>>;
  error?: string;
}

const CHECK_LABELS: ReadonlyArray<[string, string]> = [
  ["syntax", "Biçim"],
  ["domain", "Alan adı"],
  ["mx", "MX kaydı"],
  ["disposable", "Geçici adres"],
  ["roleAccount", "Rol hesabı"],
  ["typo", "Yazım hatası"],
  ["domainReputation", "Alan adı itibarı"],
  ["ipReputation", "IP itibarı"],
];

const STATUS_LABELS: Record<ValidationStatus, string> = {
  valid: "Geçerli",
  invalid: "Geçersiz",
  risky: "Riskli",
  unknown: "Doğrulanamadı",
};

export interface ValidationView {
  statusLabel: string;
  checks: Array<{
    key: string;
    label: string;
    passed: boolean;
    details: string;
  }>;
  /** The full corrected address when the typo check suggested a domain. */
  suggestion?: string;
}

/** What the address checker shows for one `/subscribers/validate-email` result. */
export function describeValidation(
  result: AddressValidationResult,
): ValidationView {
  const checks = CHECK_LABELS.flatMap(([key, label]) => {
    const check = result.checks?.[key];
    return check
      ? [{ key, label, passed: check.isValid, details: check.details }]
      : [];
  });
  const typoDomain = result.checks?.typo?.suggestion;
  const local = result.email.split("@")[0];
  return {
    statusLabel: STATUS_LABELS[result.status] ?? STATUS_LABELS.unknown,
    checks,
    suggestion: typoDomain && local ? `${local}@${typoDomain}` : undefined,
  };
}
