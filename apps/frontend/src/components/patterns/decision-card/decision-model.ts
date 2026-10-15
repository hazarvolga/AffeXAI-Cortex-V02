/** UX-CONTRACT decision card: recommendation → evidence → action → status → measured result. */

export type DecisionStatus = "pending" | "approved" | "applied" | "rejected";

export interface DecisionEvidence {
  /** What the source record shows, e.g. "12 açık talep". */
  label: string;
  /** Link to the source record(s) inside the tenant. */
  href?: string;
  /** ISO timestamp of the evidence. */
  date: string;
  tenant: string;
}

export interface DecisionOutcome {
  label: string;
  value: string;
  measuredAt: string;
}

export interface Decision {
  id: string;
  /** One sentence. */
  recommendation: string;
  evidence: DecisionEvidence[];
  action: { label: string; permission: string };
  status: DecisionStatus;
  outcome: DecisionOutcome | null;
}

export interface DecisionViewer {
  permissions: readonly string[];
  tenant: string;
}

export interface DecisionView {
  recommendation: string;
  statusLabel: string;
  evidence: Array<DecisionEvidence & { dateLabel: string }>;
  actionLabel: string;
  canApprove: boolean;
  /** Why the action is unavailable, shown next to the disabled control. */
  blockedReason: string | null;
  outcomeLabel: string;
}

const STATUS_LABELS: Record<DecisionStatus, string> = {
  pending: "Onay bekliyor",
  approved: "Onaylandı",
  applied: "Uygulandı",
  rejected: "Reddedildi",
};

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/** True when the text holds more than one sentence (a terminator followed by more text). */
function hasSeveralSentences(text: string): boolean {
  return /[.!?…]\s+\S/.test(text.trim());
}

function outcomeLabel(decision: Decision): string {
  if (decision.status === "pending" || decision.status === "approved")
    return "Henüz uygulanmadı";
  if (decision.status === "rejected") return "Uygulanmadı";
  if (!decision.outcome) return "Sonuç henüz ölçülmedi";
  const { label, value, measuredAt } = decision.outcome;
  return `${label}: ${value} (${dateLabel(measuredAt)})`;
}

/**
 * What a decision card shows to this viewer. Evidence from other workspaces is
 * never shown, and nothing without evidence or without the action permission
 * can be approved.
 */
export function decisionView(
  decision: Decision,
  viewer: DecisionViewer,
): DecisionView {
  if (hasSeveralSentences(decision.recommendation)) {
    throw new Error("Bir karar kartındaki öneri tek cümle olmalı.");
  }
  const evidence = decision.evidence
    .filter((item) => item.tenant === viewer.tenant)
    .map((item) => ({ ...item, dateLabel: dateLabel(item.date) }));
  const hasPermission = viewer.permissions.includes(decision.action.permission);

  let blockedReason: string | null = null;
  if (decision.status === "pending") {
    if (evidence.length === 0)
      blockedReason = "Kanıt olmadan öneri onaylanamaz.";
    else if (!hasPermission)
      blockedReason = `Bu işlem için "${decision.action.permission}" yetkisi gerekiyor.`;
  }

  return {
    recommendation: decision.recommendation,
    statusLabel: STATUS_LABELS[decision.status],
    evidence,
    actionLabel: decision.action.label,
    canApprove: decision.status === "pending" && blockedReason === null,
    blockedReason,
    outcomeLabel: outcomeLabel(decision),
  };
}
