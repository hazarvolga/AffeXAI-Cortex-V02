"use client";

import { useParams } from "next/navigation";
import { DecisionCard } from "@/components/patterns/decision-card/DecisionCard";
import type { Decision } from "@/components/patterns/decision-card/decision-model";
import { usePermissions } from "@/hooks/usePermissions";
import { tenantAdminHref } from "@/lib/navigation/tenant-admin-href";
import { toast } from "@/lib/notify";

/** Sample decisions until G4 produces real, source-backed recommendations. */
function sampleDecisions(tenant: string): Decision[] {
  return [
    {
      id: "sample-support-capacity",
      recommendation:
        "Açık destek talepleri SLA sınırına yaklaştığı için bekleyen taleplere bir ajan daha atayın.",
      evidence: [
        {
          label: "Açık destek talepleri",
          href: tenantAdminHref(tenant, "/support"),
          date: "2026-10-14T09:00:00Z",
          tenant,
        },
      ],
      action: { label: "Ajan ata", permission: "support.assign" },
      status: "pending",
      outcome: null,
    },
    {
      id: "sample-campaign-resend",
      recommendation:
        "Açılma oranı düşük kalan son kampanyayı açmayan abonelere farklı bir konu satırıyla yeniden gönderin.",
      evidence: [
        {
          label: "Kampanya istatistikleri",
          href: tenantAdminHref(tenant, "/email/campaigns"),
          date: "2026-10-12T15:30:00Z",
          tenant,
        },
      ],
      action: {
        label: "Yeniden gönderimi planla",
        permission: "marketing.campaigns",
      },
      status: "applied",
      outcome: null,
    },
  ];
}

export function StrategyDecisionPreview() {
  const params = useParams<{ tenant?: string }>();
  const tenant = params?.tenant ?? "";
  const { permissions } = usePermissions();
  const viewer = { permissions: permissions as string[], tenant };

  return (
    <section
      aria-labelledby="decision-preview-title"
      className="relative z-10 space-y-4"
    >
      <h2
        id="decision-preview-title"
        className="text-lg font-semibold text-white"
      >
        Karar kartları
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {sampleDecisions(tenant).map((decision) => (
          <DecisionCard
            key={decision.id}
            decision={decision}
            viewer={viewer}
            isDemo
            onApprove={() =>
              toast.info("Önizleme kartı", {
                description:
                  "Onay akışı gerçek önerilerle birlikte bağlanacak; bu kart hiçbir işlem yapmaz.",
              })
            }
          />
        ))}
      </div>
    </section>
  );
}
