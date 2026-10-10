'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AutomationWizard } from './_components/automation-wizard';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { EmailModuleNav } from '@/components/admin/email/EmailModuleNav';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { BccEditorialConfirmDialog } from '@/components/brand/BccEditorialConfirmDialog';
import { useWizardStore } from './_components/wizard-store';

export default function NewAutomationPage() {
  const router = useRouter();
  const params = useParams();
  const tenant = params?.tenant as string || 'default';
  const { draftData } = useWizardStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Auto-open on mount to avoid hydration mismatch with Dialog
  useEffect(() => {
    setIsOpen(true);
  }, []);

  const handleExit = () => {
    setIsOpen(false);
    // Add a small timeout to allow animation to start before routing
    setTimeout(() => router.push(`/${tenant}/admin/email/automations`), 300);
  };

  const handleSafetyCheck = () => {
    // Always require confirmation to exit construction mode
    setShowExitConfirm(true);
  };

  return (
    <>
      {/* Background Context - Visible behind the glassmorphic modal */}
      <BccEditorialWrapper
        headerTitle="Automation Matrix"
        headerSubtitle="Constructing autonomous communication protocols"
        headerBadge="Protocol Builder"
        moduleNav={<EmailModuleNav />}
        telemetryData={[
          { label: "System Status", value: "ONLINE", color: "#9df425" },
          { label: "Construction Mode", value: "ACTIVE", color: "#ff8c00" }
        ]}
      >
        <div className="h-full flex items-center justify-center opacity-20 pointer-events-none">
          <p className="text-white/40 font-mono uppercase tracking-[0.2em] text-xs animate-pulse">
            Initializing Construction Environment...
          </p>
        </div>
      </BccEditorialWrapper>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleSafetyCheck();
        }}
      >
        <DialogContent
          className="!max-w-none !w-screen !h-screen !p-0 !bg-transparent !border-none !shadow-none"
          onInteractOutside={(e) => e.preventDefault()} // Safety: Prevent click-outside close
          onEscapeKeyDown={(e) => {
            e.preventDefault(); // Safety: Intercept ESC
            handleSafetyCheck();
          }}
        >
          {/* Accessibility Requirement */}
          <DialogTitle className="sr-only">Automation Construction Wizard</DialogTitle>

          {/* High-Visibility Custom Close Button - Fixed Position to ensure visibility */}
          <button
            onClick={handleSafetyCheck}
            className="fixed top-6 right-6 z-[60] p-2 rounded-full bg-[#0B0F19] border border-white/20 text-white hover:bg-red-900/40 hover:text-red-400 hover:border-red-500/50 transition-all group shadow-2xl cursor-pointer"
            title="Exit Construction Mode (ESC)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
            <span className="sr-only">Close</span>
          </button>

          {/* Internal Wrapper with Breathing Room */}
          <div className="flex-1 w-full h-full p-8 md:p-12 overflow-hidden">
            <div className="w-full h-full border border-white/5 rounded-sm overflow-hidden bg-black/40 backdrop-blur-sm shadow-inner">
              <AutomationWizard />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation */}
      <BccEditorialConfirmDialog
        open={showExitConfirm}
        onOpenChange={setShowExitConfirm}
        onConfirm={handleExit}
      />
    </>
  );
}
