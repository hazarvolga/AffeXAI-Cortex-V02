'use client';

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Cloud, Server, Zap, Settings2 } from 'lucide-react';

export const RoutingControl = () => {
    const [mode, setMode] = React.useState('auto');

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-lg relative overflow-hidden">
            <div className="relative z-10 mb-6">
                <h3 className="flex items-center gap-2 font-bold text-lg text-white tracking-tight">
                    <Settings2 className="h-5 w-5 text-[#00f0ff]" />
                    Engine Routing
                </h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">Hybrid AI Orchestration Strategy</p>
            </div>

            <ToggleGroup type="single" value={mode} onValueChange={(val) => val && setMode(val)} className="grid grid-cols-1 md:grid-cols-3 gap-3">

                {/* AUTO MODE */}
                <ToggleGroupItem
                    value="auto"
                    className="h-auto flex flex-col items-center justify-center p-4 border border-white/10 bg-black/20 hover:bg-white/5 transition-all rounded data-[state=on]:border-[#00f0ff] data-[state=on]:bg-[#00f0ff]/10 data-[state=on]:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                >
                    <Zap className="h-6 w-6 mb-2 text-white/60 data-[state=on]:text-[#00f0ff]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Auto (Smart)</span>
                    <span className="text-[9px] text-white/40 mt-1 text-center font-mono">Cost/Perf Balance</span>
                </ToggleGroupItem>

                {/* CLOUD ONLY */}
                <ToggleGroupItem
                    value="cloud"
                    className="h-auto flex flex-col items-center justify-center p-4 border border-white/10 bg-black/20 hover:bg-white/5 transition-all rounded data-[state=on]:border-blue-500 data-[state=on]:bg-blue-500/10 data-[state=on]:text-blue-400"
                >
                    <Cloud className="h-6 w-6 mb-2 text-white/60" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Force Cloud</span>
                    <span className="text-[9px] text-white/40 mt-1 text-center font-mono">Max Quality</span>
                </ToggleGroupItem>

                {/* LOCAL ONLY */}
                <ToggleGroupItem
                    value="local"
                    className="h-auto flex flex-col items-center justify-center p-4 border border-white/10 bg-black/20 hover:bg-white/5 transition-all rounded data-[state=on]:border-[#a855f7] data-[state=on]:bg-[#a855f7]/10 data-[state=on]:text-[#a855f7]"
                >
                    <Server className="h-6 w-6 mb-2 text-white/60" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Force Local</span>
                    <span className="text-[9px] text-white/40 mt-1 text-center font-mono">Zero Cost</span>
                </ToggleGroupItem>

            </ToggleGroup>

            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-white/30">
                <span>ACTIVE POOL: {mode === 'local' ? 'LLAMA-3 (ORACLE)' : 'GPT-4O / CLAUDE-3.5'}</span>
                <span className="text-[#00f0ff]">STATUS: READY</span>
            </div>
        </div>
    );
};
