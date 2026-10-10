'use client';

import { ReactNode } from 'react';
import { useWizardStore, WizardStep } from './wizard-store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';

interface WizardLayoutProps {
    children: ReactNode;
}

const STEPS: { id: WizardStep; label: string; number: string }[] = [
    { id: 'blueprint', label: 'SELECT_BLUEPRINT', number: '01' },
    { id: 'trigger', label: 'CONFIGURE_TRIGGER', number: '02' },
    { id: 'workflow', label: 'BUILD_WORKFLOW', number: '03' },
    { id: 'review', label: 'REVIEW_ACTIVATE', number: '04' },
];

export function WizardLayout({ children }: WizardLayoutProps) {
    const { currentStep } = useWizardStore();

    const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

    return (
        <div className="h-[calc(100dvh-4rem)] flex flex-col bg-black text-white overflow-hidden relative">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            {/* Header / Stepper */}
            <header className="relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="container mx-auto h-16 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-[10px] font-bold tracking-[0.2em] text-white uppercase border border-white/10 px-3 py-1 bg-white/5">
                            AUTOMATION_WIZARD_V2
                        </h1>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1">
                        {STEPS.map((step, index) => {
                            const isActive = step.id === currentStep;
                            const isCompleted = index < currentStepIndex;
                            const isPending = index > currentStepIndex;

                            return (
                                <div key={step.id} className="flex items-center">
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2 border transition-all duration-300",
                                            isActive
                                                ? "bg-[#9df425]/10 border-[#9df425]/30 text-[#9df425]"
                                                : isCompleted
                                                    ? "bg-white/5 border-white/10 text-white/40"
                                                    : "border-transparent text-white/20"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-[9px] font-mono font-bold",
                                            isActive ? "text-[#9df425]" : "text-current"
                                        )}>
                                            {step.number}
                                        </span>
                                        <span className="text-[9px] font-bold tracking-widest uppercase">
                                            {step.label}
                                        </span>
                                        {isCompleted && <Check className="w-3 h-3 ml-2 text-[#9df425]" />}
                                    </div>

                                    {index < STEPS.length - 1 && (
                                        <div className="w-8 h-[1px] bg-white/5 mx-1" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="w-32" /> {/* Spacer for balance */}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 relative z-10 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="h-full w-full"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
