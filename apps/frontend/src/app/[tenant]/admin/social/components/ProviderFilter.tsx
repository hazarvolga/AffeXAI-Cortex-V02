import React from 'react';
import { Twitter, Linkedin, Instagram, Facebook, Globe } from 'lucide-react';
import { cn } from "@/lib/utils";

export type SocialProvider = 'twitter' | 'linkedin' | 'instagram' | 'facebook';

interface ProviderFilterProps {
    selectedProviders: SocialProvider[];
    onToggleProvider: (provider: SocialProvider) => void;
}

export function ProviderFilter({ selectedProviders, onToggleProvider }: ProviderFilterProps) {
    const providers: { id: SocialProvider; icon: any; color: string }[] = [
        { id: 'twitter', icon: Twitter, color: 'text-blue-400' },
        { id: 'linkedin', icon: Linkedin, color: 'text-blue-600' },
        { id: 'instagram', icon: Instagram, color: 'text-pink-500' },
        { id: 'facebook', icon: Facebook, color: 'text-blue-500' },
    ];

    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest mr-2">Filter Scope:</span>
            {providers.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedProviders.includes(p.id);
                return (
                    <button
                        key={p.id}
                        onClick={() => onToggleProvider(p.id)}
                        className={cn(
                            "flex items-center justify-center w-8 h-8 border transition-all duration-300",
                            isSelected
                                ? "bg-white/10 border-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                : "bg-transparent border-white/5 text-white/20 hover:text-white/60 hover:border-white/10"
                        )}
                        title={`Toggle ${p.id}`}
                    >
                        <Icon className={cn("w-4 h-4", isSelected && p.color)} />
                    </button>
                );
            })}
        </div>
    );
}
