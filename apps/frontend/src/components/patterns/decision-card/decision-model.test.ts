import assert from "node:assert/strict";
import { test } from "node:test";
import { decisionView, type Decision } from "./decision-model";

const base: Decision = {
  id: "d-1",
  recommendation:
    "Açık destek taleplerinde SLA'yı korumak için bir ajan daha atayın.",
  evidence: [
    {
      label: "12 açık talep",
      href: "/acme/admin/support",
      date: "2026-10-14T09:00:00Z",
      tenant: "acme",
    },
  ],
  action: { label: "Ajan ata", permission: "tickets.assign" },
  status: "pending",
  outcome: null,
};

test("a pending decision with evidence can be approved by someone with the permission", () => {
  const view = decisionView(base, {
    permissions: ["tickets.assign"],
    tenant: "acme",
  });
  assert.equal(view.statusLabel, "Onay bekliyor");
  assert.equal(view.canApprove, true);
  assert.equal(view.blockedReason, null);
  assert.equal(view.evidence[0].dateLabel, "14 Eki 2026");
  assert.equal(view.outcomeLabel, "Henüz uygulanmadı");
});

test("without the action permission the card explains why it cannot act", () => {
  const view = decisionView(base, { permissions: [], tenant: "acme" });
  assert.equal(view.canApprove, false);
  assert.equal(
    view.blockedReason,
    'Bu işlem için "tickets.assign" yetkisi gerekiyor.',
  );
});

test("evidence from another workspace is dropped and a recommendation without evidence cannot be approved", () => {
  const foreign = {
    ...base,
    evidence: [{ ...base.evidence[0], tenant: "other" }],
  };
  const view = decisionView(foreign, {
    permissions: ["tickets.assign"],
    tenant: "acme",
  });
  assert.equal(view.evidence.length, 0);
  assert.equal(view.canApprove, false);
  assert.equal(view.blockedReason, "Kanıt olmadan öneri onaylanamaz.");
});

test("an applied decision shows the measured result, or says it is not measured yet", () => {
  const applied = { ...base, status: "applied" as const };
  assert.equal(
    decisionView(applied, { permissions: [], tenant: "acme" }).outcomeLabel,
    "Sonuç henüz ölçülmedi",
  );
  const measured = {
    ...applied,
    outcome: {
      label: "Ortalama ilk yanıt",
      value: "2 sa → 45 dk",
      measuredAt: "2026-10-20T12:00:00Z",
    },
  };
  const view = decisionView(measured, { permissions: [], tenant: "acme" });
  assert.equal(view.statusLabel, "Uygulandı");
  assert.equal(view.canApprove, false);
  assert.equal(
    view.outcomeLabel,
    "Ortalama ilk yanıt: 2 sa → 45 dk (20 Eki 2026)",
  );
});

test("a recommendation must be a single sentence", () => {
  assert.throws(
    () =>
      decisionView(
        { ...base, recommendation: "Birinci cümle. İkinci cümle." },
        { permissions: [], tenant: "acme" },
      ),
    /tek cümle/,
  );
});
