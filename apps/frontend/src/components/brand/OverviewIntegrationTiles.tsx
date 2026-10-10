"use client";

import React from 'react';
import { Users, TrendingUp } from 'lucide-react';

export const UserEcosystemTile = ({ total = 1247, subscribers = 856 }: { total?: number, subscribers?: number }) => {
    return (
        <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative group">
            <div className="relative z-10">
                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">Ecosystem</p>
                <h3 className="text-lg font-bold text-white tracking-tight">User Base</h3>
            </div>

            <div className="flex-1 flex flex-col justify-center py-4 relative z-10">
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-light text-white tracking-tighter">{total}</span>
                    <span className="text-[#13ecec] text-[10px] font-mono font-bold flex items-center gap-0.5">
                        <TrendingUp size={10} /> +2.4%
                    </span>
                </div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono">Total Active Nodes</p>

                <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg border border-white/5 group-hover:border-[#13ecec]/20 transition-colors">
                        <span className="text-[10px] text-white/50 uppercase font-mono">Subscribers</span>
                        <span className="text-sm font-bold text-white/90">{subscribers}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-white/5 relative z-10">
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#13ecec] to-blue-500 w-[68%] animate-pulse"></div>
                </div>
            </div>

            {/* Background Icon */}
            <Users className="absolute -bottom-4 -right-4 size-24 text-[#13ecec]/5 group-hover:text-[#13ecec]/10 transition-colors duration-700 pointer-events-none" />
        </div>
    );
};

export const RoleDistributionTile = () => {
    const roles = [
        { label: 'Admin', count: 5, color: 'bg-red-500' },
        { label: 'Manager', count: 14, color: 'bg-blue-500' },
        { label: 'Agent', count: 15, color: 'bg-[#13ecec]' },
    ];

    return (
        <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between overflow-hidden group">
            <div>
                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">Permissions</p>
                <h3 className="text-lg font-bold text-white tracking-tight">Role Distribution</h3>
            </div>

            <div className="flex-1 space-y-4 py-4">
                {roles.map((role) => (
                    <div key={role.label} className="group/role">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] text-white/60 font-mono tracking-wider uppercase">{role.label}</span>
                            <span className="text-[10px] font-bold text-white/90">{role.count}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${role.color} opacity-60 group-hover/role:opacity-100 transition-opacity`} style={{ width: `${(role.count / 40) * 100}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-2 flex justify-center">
                <button className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#13ecec]/40 hover:text-[#13ecec] transition-colors">
                    Access_Security_Logs
                </button>
            </div>
        </div>
    );
};
