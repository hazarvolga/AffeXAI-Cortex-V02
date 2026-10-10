"use client";

import React from 'react';
import { useComposerStore, Platform } from '@/lib/stores/composerStore';
import { Hash, Linkedin, Twitter, Instagram, Facebook, Command } from 'lucide-react';

export const PlatformTabs = () => {
    const { activeTab, setActiveTab, platforms } = useComposerStore();

    const tabs = [
        { id: 'master', icon: Command, label: 'Master', color: 'text-white' },
        { id: 'twitter', icon: Twitter, label: 'Twitter', color: 'text-blue-400' },
        { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'text-blue-600' },
        { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
        { id: 'facebook', icon: Facebook, label: 'Facebook', color: 'text-blue-500' },
    ];

    return (
        <div className="flex border-b border-white/10 bg-black/40">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isModified = tab.id !== 'master' && platforms[tab.id as Platform]?.isModified;

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider relative transition-all
                            ${isActive ? 'bg-white/5 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.02]'}
                        `}
                    >
                        <tab.icon className={`w-4 h-4 ${isActive ? tab.color : 'text-current'}`} />
                        <span className="hidden xl:inline">{tab.label}</span>

                        {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#13ecda] shadow-[0_0_10px_#13ecda]" />
                        )}

                        {isModified && !isActive && (
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#13ecda]" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
