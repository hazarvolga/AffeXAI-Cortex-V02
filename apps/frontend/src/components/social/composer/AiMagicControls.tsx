"use client";

import React, { useState } from 'react';
import { useComposerStore } from '@/lib/stores/composerStore';
import { Wand2, RefreshCw, Eraser, Zap, MessageSquare } from 'lucide-react';

import { socialMediaService } from '@/lib/api/socialMediaService';

export const AiMagicControls = () => {
    const { masterContent, setPlatformContent, adaptMasterToAll, resetAll } = useComposerStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleMagic = async () => {
        if (!masterContent) return;
        setIsGenerating(true);
        try {
            // Parallel optimization for all active channels
            const platforms = ['twitter', 'linkedin', 'instagram'] as const;

            await Promise.all(platforms.map(async (platform) => {
                try {
                    const optimizedText = await socialMediaService.optimizePost(masterContent, platform);
                    setPlatformContent(platform, optimizedText);
                } catch (err) {
                    console.error(`Failed to optimize for ${platform}`, err);
                    // Fallback to master content if AI fails, to ensure no empty states
                    setPlatformContent(platform, masterContent);
                }
            }));

        } catch (e) {
            console.error("Magic failed", e);
            // Fallback to local heuristic if total failure
            adaptMasterToAll();
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full px-4">
            <div className="text-[10px] uppercase font-mono text-white/30 tracking-widest text-center mb-2">
                SIGNAL PROCESSING
            </div>

            <button
                onClick={handleMagic}
                disabled={isGenerating}
                className={`
                    w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-2 border border-[#13ecda]/20
                    transition-all duration-300 group relative overflow-hidden
                    ${isGenerating ? 'bg-[#13ecda]/10 border-[#13ecda]' : 'bg-white/5 hover:bg-white/10 hover:border-[#13ecda]/50'}
                `}
            >
                <div className={`
                    absolute inset-0 bg-gradient-to-tr from-[#13ecda]/20 to-transparent opacity-0 transition-opacity duration-500
                    ${isGenerating ? 'opacity-100 animate-pulse' : 'group-hover:opacity-100'}
                `} />

                <Wand2 className={`w-8 h-8 text-[#13ecda] transition-transform duration-500 ${isGenerating ? 'rotate-180 scale-110' : 'group-hover:rotate-12'}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 z-10">
                    {isGenerating ? 'ADAPTING...' : 'RELAY'}
                </span>
            </button>

            <div className="h-px w-full bg-white/10 my-2" />

            <button className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-1">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Tone Shift</span>
                </div>
                <div className="text-[10px] text-white/40 font-mono group-hover:text-white/60">
                    Professional, Casual, Urgent...
                </div>
            </button>

            <button className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-1">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Shorten</span>
                </div>
                <div className="text-[10px] text-white/40 font-mono group-hover:text-white/60">
                    Fit to constraints
                </div>
            </button>

            <div className="flex-1" />

            <button
                onClick={resetAll}
                className="flex items-center justify-center gap-2 py-3 text-xs font-mono text-red-400 hover:bg-red-500/10 rounded transition-colors"
            >
                <Eraser className="w-3 h-3" />
                CLEAR BUFFERS
            </button>
        </div>
    );
};
