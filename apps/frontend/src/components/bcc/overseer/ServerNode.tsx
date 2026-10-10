'use client';

import React from 'react';
import { Activity, BrainCircuit, Server, Zap } from 'lucide-react';

interface ServiceStatus {
    name: string;
    status: 'ok' | 'error' | 'warning';
}

interface ServerNodeProps {
    name: string;
    role: string;
    status: 'online' | 'offline' | 'degraded';
    cpuLoad: number;
    ramUsage: number;
    services: ServiceStatus[];
    isLocalBrain?: boolean;
}

export const ServerNode: React.FC<ServerNodeProps> = ({ name, role, status, cpuLoad, ramUsage, services, isLocalBrain }) => {
    const primaryColor = isLocalBrain ? '#a855f7' : '#00f0ff'; // Purple for Brain, Cyan for App
    const statusColor = status === 'online' ? primaryColor : '#ff1a1a';

    return (
        <div className="relative group bg-white/5 border border-white/10 p-6 rounded-lg transition-all hover:border-white/20 hover:bg-white/[0.07] overflow-hidden">
            {/* Decorative Glow */}
            <div
                className="absolute top-0 right-0 w-24 h-24 blur-[60px] rounded-full opacity-20 pointer-events-none transition-opacity group-hover:opacity-40"
                style={{ backgroundColor: primaryColor }}
            />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-black/40 rounded-md border border-white/10 shadow-inner">
                        {isLocalBrain ? (
                            <BrainCircuit className="h-6 w-6" style={{ color: primaryColor }} />
                        ) : (
                            <Server className="h-6 w-6" style={{ color: primaryColor }} />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white tracking-tight leading-none">{name}</h3>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">{role}</p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/5">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'animate-pulse' : ''}`} style={{ backgroundColor: statusColor }} />
                    <span className="text-[10px] font-mono uppercase text-white/60">{status.toUpperCase()}</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/40">
                        <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> CPU Load</span>
                        <span className="font-mono text-white">{cpuLoad}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full transition-all duration-700 ease-out"
                            style={{ width: `${cpuLoad}%`, backgroundColor: primaryColor }}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/40">
                        <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> RAM Usage</span>
                        <span className="font-mono text-white">{ramUsage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full transition-all duration-700 ease-out"
                            style={{ width: `${ramUsage}%`, backgroundColor: cpuLoad > 80 ? '#ff1a1a' : primaryColor }}
                        />
                    </div>
                </div>
            </div>

            {/* Services List (Micro-badges) */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5 relative z-10">
                {services.map((svc) => (
                    <span
                        key={svc.name}
                        className={`text-[9px] px-2 py-0.5 rounded border ${svc.status === 'ok'
                                ? 'border-white/10 bg-white/5 text-white/60'
                                : 'border-red-500/30 bg-red-500/10 text-red-400'
                            }`}
                    >
                        {svc.name}
                    </span>
                ))}
            </div>
        </div>
    );
};
