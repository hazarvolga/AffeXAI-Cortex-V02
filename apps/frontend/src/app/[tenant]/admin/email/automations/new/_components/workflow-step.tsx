'use client';

import { useWizardStore } from './wizard-store';
import { Button } from '@/components/ui/button';
import { AutomationBuilder } from '@/modules/email-marketing/components/automation/automation-builder';
import { ArrowLeft, Play } from 'lucide-react';

export function WorkflowStep() {
    const { setStep, draftData } = useWizardStore();

    const initialData = {
        name: draftData.name || '',
        description: draftData.description,
        trigger: (draftData as any).trigger,
        // Maps store 'steps' to nodes - primitive mapping for now
        workflow: {
            nodes: (draftData as any).steps || [],
            edges: [],
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 relative border-b border-white/5">
                <AutomationBuilder
                    mode="create"
                    initialStep="workflow"
                    initialData={initialData}
                />
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/5 bg-black/50 backdrop-blur-xl flex justify-between items-center z-50">
                <Button
                    variant="ghost"
                    onClick={() => setStep('trigger')}
                    className="text-white/40 hover:text-white uppercase text-[10px] tracking-widest flex items-center gap-2"
                >
                    <ArrowLeft className="w-3 h-3" />
                    Back
                </Button>

                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 border border-white/10 bg-white/5 text-[9px] font-mono text-white/40 uppercase tracking-widest">
                        AUTO-SAVE: ACTIVE
                    </div>
                    <Button
                        onClick={() => setStep('review')}
                        className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] transition-all font-bold text-[10px] tracking-[0.2em] uppercase h-10 px-8 shadow-lg shadow-[#9df425]/10"
                    >
                        <span className="flex items-center gap-2">
                            PROCEED_TO_REVIEW
                            <Play className="w-3 h-3 fill-current" />
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
