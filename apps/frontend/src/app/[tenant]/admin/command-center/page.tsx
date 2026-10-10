'use client';

import React, { useState } from 'react';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { AgentOrchestratorGraph } from './components/AgentOrchestratorGraph';
import { EmotionalAnalytics3D } from './components/EmotionalAnalytics3D';
import { VoiceCommandInterface } from './components/VoiceCommandInterface';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Activity, GitGraph, Terminal } from 'lucide-react';

export default function CommandCenterPage() {
    const [isVoiceActive, setIsVoiceActive] = useState(false);

    return (
        <BccEditorialWrapper
            headerTitle="AI Command Center"
            headerSubtitle="Centralized Neural Orchestration & Telemetry"
            headerBadge="GOD MODE"
            headerAction={
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`text-white/60 hover:text-white`}
                        onClick={() => window.location.href = '/admin/ai-settings'}
                    >
                        <Terminal className="w-4 h-4 mr-2" />
                        AI Config
                    </Button>
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <Button
                        variant="outline"
                        className={`border-white/10 ${isVoiceActive ? 'text-[#9df425] border-[#9df425]/50 animate-pulse' : 'text-white/40'}`}
                        onClick={() => setIsVoiceActive(!isVoiceActive)}
                    >
                        <Mic className="w-4 h-4 mr-2" />
                        {isVoiceActive ? "Listening..." : "Voice Control"}
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] animate-in fade-in duration-700">

                {/* Main Orchestrator View */}
                <Card className="lg:col-span-2 bg-[#0a0a0a] border-white/5 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9df425] to-transparent opacity-20" />
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <GitGraph className="w-4 h-4 text-[#9df425]" />
                            <span className="font-mono text-xs uppercase tracking-widest text-white/60">Active Agent Swarm</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-[10px] items-center flex gap-1.5 px-2 py-1 rounded-full bg-white/5 text-white/40 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Orchestrator: ON
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <AgentOrchestratorGraph />
                    </div>
                </Card>

                {/* Right Column: Analytics & Terminal */}
                <div className="flex flex-col gap-6">

                    {/* 3D Emotional Analytics */}
                    <Card className="flex-1 bg-[#0a0a0a] border-white/5 relative overflow-hidden flex flex-col min-h-[300px]">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[#ff8c00]" />
                                <span className="font-mono text-xs uppercase tracking-widest text-white/60">Sentiment Topography</span>
                            </div>
                        </div>
                        <div className="flex-1 w-full h-full relative">
                            <EmotionalAnalytics3D />
                        </div>
                    </Card>

                    {/* System Terminal / Voice Log */}
                    <Card className="h-1/3 bg-black border-white/10 p-4 font-mono text-xs relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-2 text-white/40 border-b border-white/5 pb-2">
                            <Terminal className="w-3 h-3" />
                            <span className="uppercase tracking-widest">System Log</span>
                        </div>
                        <VoiceCommandInterface onCommand={(cmd) => console.log("Exec:", cmd)} isActive={isVoiceActive} />
                    </Card>

                </div>
            </div>
        </BccEditorialWrapper>
    );
}
