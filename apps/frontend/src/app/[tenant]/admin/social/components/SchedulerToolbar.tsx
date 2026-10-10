import React from 'react';
import { ViewToggle } from './ViewToggle';
import { ProviderFilter, SocialProvider } from './ProviderFilter';

interface SchedulerToolbarProps {
    view: 'table' | 'calendar';
    onViewChange: (view: 'table' | 'calendar') => void;
    selectedProviders: SocialProvider[];
    onToggleProvider: (provider: SocialProvider) => void;
}

export function SchedulerToolbar({ view, onViewChange, selectedProviders, onToggleProvider }: SchedulerToolbarProps) {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b border-white/5 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
            {/* Left: View Context */}
            <div className="flex items-center gap-6 w-full md:w-auto">
                <ViewToggle view={view} onViewChange={onViewChange} />
                <div className="hidden md:block w-[1px] h-6 bg-white/10" />
                <div className="text-[10px] uppercase tracking-widest text-[#9df425] font-mono animate-pulse">
                    System Active
                </div>
            </div>

            {/* Right: Filters */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <ProviderFilter
                    selectedProviders={selectedProviders}
                    onToggleProvider={onToggleProvider}
                />
            </div>
        </div>
    );
}
