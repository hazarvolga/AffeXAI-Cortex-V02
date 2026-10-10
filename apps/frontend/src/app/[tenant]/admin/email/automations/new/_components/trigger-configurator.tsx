'use client';

import { useWizardStore } from './wizard-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Zap,
    ArrowLeft,
    UserPlus,
    Tag,
    Calendar,
    MousePointerClick
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TriggerType, TriggerEvent } from '@/types/automation';

const TRIGGER_TYPES = [
    {
        type: TriggerEvent.SUBSCRIBER_CREATED,
        label: 'SUBSCRIBER_ENTRY',
        description: 'Executes when a new entity joins the designated list segment.',
        icon: UserPlus,
    },
    {
        type: TriggerEvent.SUBSCRIBER_SEGMENT_ADDED,
        label: 'TAG_ATTACHMENT',
        description: 'Executes when a specific metadata tag is appended to an entity.',
        icon: Tag,
    },
    {
        type: TriggerEvent.EMAIL_CLICKED,
        label: 'INTERACTION_EVENT',
        description: 'Executes upon specific link interaction within a broadcast.',
        icon: MousePointerClick,
    },
    {
        type: TriggerType.TIME_BASED,
        label: 'TEMPORAL_MARKER',
        description: 'Executes on a specific date or anniversary (e.g., entity creation date).',
        icon: Calendar,
    },
];

export function TriggerConfigurator() {
    const { draftData, setTrigger, setStep } = useWizardStore();

    // Check if the current trigger type matches one of our list options
    // Since we mix TriggerType and TriggerEvent, we need a flexible check or stored ID logic
    // For MVP, we assume (draftData as any).trigger.type stores the selected value
    const selectedType = (draftData as any).trigger?.type as unknown as string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTypeSelect = (type: any) => {
        // Here we map the selection to the actual DTO structure required by backend
        // If it's TIME_BASED (TriggerType), we store it as triggerType
        // If it's an Event (TriggerEvent), we store triggerType=EVENT and config.events=[type]

        if (type === TriggerType.TIME_BASED) {
            setTrigger({
                type: TriggerType.TIME_BASED,
                config: { schedule: 'daily', dateField: 'created_at' } // Default stub
            });
        } else {
            setTrigger({
                type: TriggerType.EVENT,
                config: { events: [type] }
            });
        }
    };

    const isConfigValid = !!(draftData as any).trigger?.type;

    return (
        <div className="h-full flex flex-col">
            <div className="p-8 pb-4">
                <h2 className="text-[20px] font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-3">
                    <Zap className="w-5 h-5 text-[#9df425]" />
                    Configure Initialization Trigger
                </h2>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest max-w-2xl">
                    Define the primary event vector that instantiates this workflow instance.
                </p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Trigger Type Selection */}
                <div className="w-1/3 border-r border-white/5 bg-white/[0.01] flex flex-col">
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Available Triggers</h3>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="flex flex-col">
                            {TRIGGER_TYPES.map((t) => {
                                const Icon = t.icon;
                                // Complex check because selectedType depends on how we stored it (as TriggerType.EVENT or the sub-event?)
                                // For UI selection state, checking against the type passed to handleTypeSelect is tricky unless we persist selection ID.
                                // Simplified check:
                                let isSelected = false;
                                if (t.type === TriggerType.TIME_BASED) {
                                    isSelected = (draftData as any).trigger?.type === TriggerType.TIME_BASED;
                                } else {
                                    // It's an event
                                    const config = (draftData as any).trigger?.config as any;
                                    isSelected = (draftData as any).trigger?.type === TriggerType.EVENT && config?.events?.includes(t.type);
                                }

                                return (
                                    <button
                                        key={t.type}
                                        onClick={() => handleTypeSelect(t.type)}
                                        className={cn(
                                            "flex items-start gap-4 p-6 text-left transition-all duration-300 border-b border-white/5",
                                            isSelected
                                                ? "bg-[#9df425]/10"
                                                : "hover:bg-white/[0.02]"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-none border transition-colors",
                                            isSelected
                                                ? "bg-[#9df425]/20 border-[#9df425]/30 text-[#9df425]"
                                                : "bg-white/5 border-white/10 text-white/40"
                                        )}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest mb-1",
                                                isSelected ? "text-[#9df425]" : "text-white/80"
                                            )}>
                                                {t.label}
                                            </h4>
                                            <p className="text-[9px] text-white/40 leading-relaxed font-mono">
                                                {t.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Trigger Configuration Form */}
                <div className="flex-1 bg-black/20 p-8">
                    {/* Simplified Display Logic */}
                    {(draftData as any).trigger?.type ? (
                        <div className="max-w-xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-px flex-1 bg-gradient-to-r from-[#9df425] to-transparent" />
                                    <span className="text-[10px] font-mono text-[#9df425] uppercase tracking-widest">
                                        PARAMETER_CONFIG
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] uppercase tracking-widest text-white/60">
                                            Automation ID (System)
                                        </Label>
                                        <div className="font-mono text-[10px] text-white/30 border border-white/10 p-3 bg-white/5">
                                            AUTO-GEN-{Math.random().toString(36).substring(7).toUpperCase()}
                                        </div>
                                    </div>

                                    <div className="p-4 border border-dashed border-white/10 bg-white/[0.02]">
                                        <p className="text-[9px] text-white/40 font-mono text-center uppercase">
                                            Configuration parameters for {selectedType}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-white/20">
                            <div className="text-center">
                                <Zap className="w-8 h-8 mx-auto mb-4 opacity-20" />
                                <p className="text-[10px] uppercase tracking-widest font-mono">
                                    Awaiting Trigger Selection...
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-black/50 backdrop-blur-xl flex justify-between">
                <Button
                    variant="ghost"
                    onClick={() => setStep('blueprint')}
                    className="text-white/40 hover:text-white uppercase text-[10px] tracking-widest flex items-center gap-2"
                >
                    <ArrowLeft className="w-3 h-3" />
                    Back
                </Button>
                <Button
                    onClick={() => setStep('workflow')}
                    disabled={!isConfigValid}
                    className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] transition-all font-bold text-[10px] tracking-[0.2em] uppercase h-10 px-8 shadow-lg shadow-[#9df425]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    CONFIRM_VECTOR
                </Button>
            </div>
        </div>
    );
}
