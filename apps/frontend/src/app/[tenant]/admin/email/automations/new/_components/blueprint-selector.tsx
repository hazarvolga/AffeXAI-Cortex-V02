'use client';

import { useWizardStore } from './wizard-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    FilePlus,
    Users,
    ShoppingCart,
    Mail,
    CalendarClock,
    Sparkles,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

const BLUEPRINTS = [
    {
        id: 'blank',
        title: 'BLANK_CANVAS',
        description: 'Initialize empty workflow lattice. Manual node construction required.',
        icon: FilePlus,
        color: '#ffffff',
        tags: ['MANUAL'],
    },
    {
        id: 'welcome-series',
        title: 'WELCOME_PROTOCOL',
        description: 'Standard onboarding sequence for new entities via subscription vector.',
        icon: Users,
        color: '#9df425',
        tags: ['GROWTH', 'ONBOARDING'],
    },
    {
        id: 'abandoned-cart',
        title: 'CART_RECOVERY',
        description: 'Behavioral intervention for stalled transaction states.',
        icon: ShoppingCart,
        color: '#ff8c00', // Orange accent
        tags: ['REVENUE', 'ECOMMERCE'],
    },
    {
        id: 'nurture',
        title: 'ENGAGEMENT_NURTURE',
        description: 'Long-term content drip distribution to sustain entity resonance.',
        icon: Mail,
        color: '#3b82f6',
        tags: ['RETENTION'],
    },
    {
        id: 'event-reminder',
        title: 'EVENT_SYNC',
        description: 'Temporal notifications aligned to scheduled system events.',
        icon: CalendarClock,
        color: '#8b5cf6',
        tags: ['EVENTS'],
    },
];

export function BlueprintSelector() {
    const { selectedBlueprintId, selectBlueprint, setStep, setDraftData } = useWizardStore();

    const handleSelect = (id: string) => {
        selectBlueprint(id);
        const blueprint = BLUEPRINTS.find(b => b.id === id);
        if (blueprint) {
            setDraftData({
                name: blueprint.id === 'blank' ? '' : `${blueprint.title} (Draft)`,
                description: blueprint.description
            });
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-8 pb-4">
                <h2 className="text-[20px] font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#9df425]" />
                    Select Strategy Blueprint
                </h2>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest max-w-2xl">
                    Choose a pre-configured neural lattice or initialize a blank substrate.
                </p>
            </div>

            <ScrollArea className="flex-1 px-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {BLUEPRINTS.map((blueprint) => {
                        const isSelected = selectedBlueprintId === blueprint.id;
                        const Icon = blueprint.icon;

                        return (
                            <div
                                key={blueprint.id}
                                onClick={() => handleSelect(blueprint.id)}
                                className={cn(
                                    "group relative p-6 border transition-all duration-300 cursor-pointer min-h-[200px] flex flex-col bg-white/[0.01] hover:bg-white/[0.03]",
                                    isSelected
                                        ? "border-[#9df425]/50 bg-[#9df425]/5"
                                        : "border-white/5 hover:border-white/20"
                                )}
                            >
                                {/* Decorative Corner */}
                                <div className={cn(
                                    "absolute top-0 right-0 w-8 h-8 border-t border-r transition-all duration-300",
                                    isSelected ? "border-[#9df425]/50" : "border-white/5 group-hover:border-white/20"
                                )} />

                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn(
                                        "p-3 rounded-none border transition-all duration-300",
                                        isSelected
                                            ? "bg-[#9df425]/20 border-[#9df425]/30"
                                            : "bg-white/5 border-white/5 group-hover:bg-white/10"
                                    )}>
                                        <Icon
                                            className="w-5 h-5"
                                            style={{ color: isSelected ? '#9df425' : blueprint.color }}
                                        />
                                    </div>
                                    {isSelected && (
                                        <div className="bg-[#9df425]/20 text-[#9df425] text-[7px] font-mono px-2 py-1 uppercase tracking-widest border border-[#9df425]/30">
                                            SELECTED
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <h3 className={cn(
                                        "text-[12px] font-bold uppercase tracking-[0.15em] mb-2 transition-colors",
                                        isSelected ? "text-white" : "text-white/80 group-hover:text-white"
                                    )}>
                                        {blueprint.title}
                                    </h3>
                                    <p className="text-[10px] text-white/40 leading-relaxed font-mono">
                                        {blueprint.description}
                                    </p>
                                </div>

                                {/* Footer / Tags */}
                                <div className="mt-6 flex flex-wrap gap-2">
                                    {blueprint.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[7px] text-white/20 font-mono border border-white/5 px-1.5 py-0.5 uppercase tracking-widest"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-black/50 backdrop-blur-xl flex justify-end">
                <Button
                    onClick={() => setStep('trigger')}
                    disabled={!selectedBlueprintId}
                    className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] transition-all font-bold text-[10px] tracking-[0.2em] uppercase h-10 px-8 shadow-lg shadow-[#9df425]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    INITIALIZE_SEQUENCE
                </Button>
            </div>
        </div>
    );
}
