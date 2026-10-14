"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { X } from "lucide-react";
import { AutomationWizard } from "./_components/automation-wizard";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { EmailModuleNav } from "@/components/admin/email/EmailModuleNav";
import { BccEditorialConfirmDialog } from "@/components/brand/BccEditorialConfirmDialog";

/**
 * The wizard renders inside the page's <main> rather than a full-screen modal,
 * so the skip link, landmarks and keyboard order keep working.
 */
export default function NewAutomationPage() {
  const router = useRouter();
  const params = useParams();
  const tenant = (params?.tenant as string) || "default";
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  return (
    <>
      <BccEditorialWrapper
        headerTitle="Yeni otomasyon"
        headerSubtitle="Tetikleyici, adımlar ve etkinleştirme"
        headerBadge="Otomasyon sihirbazı"
        moduleNav={<EmailModuleNav />}
        headerAction={
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="inline-flex min-h-10 items-center gap-2 border border-white/20 bg-[#0B0F19] px-4 text-sm text-white transition-colors hover:border-red-500/50 hover:bg-red-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Sihirbazdan çık
          </button>
        }
      >
        <div className="h-[80vh] min-h-[600px] w-full overflow-hidden rounded-sm border border-white/5 bg-black/40 shadow-inner">
          <AutomationWizard />
        </div>
      </BccEditorialWrapper>

      <BccEditorialConfirmDialog
        open={showExitConfirm}
        onOpenChange={setShowExitConfirm}
        onConfirm={() => router.push(`/${tenant}/admin/email/automations`)}
      />
    </>
  );
}
