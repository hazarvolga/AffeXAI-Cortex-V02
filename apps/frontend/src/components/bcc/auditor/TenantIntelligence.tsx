'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';

export const TenantIntelligence = ({ tenants }: { tenants: any[] }) => {
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredTenants = tenants?.filter(t =>
        t.tenantId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.planName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="font-bold text-lg text-white tracking-tight">Tenant Intelligence</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">Real-time Consumption Breakdown</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search Entity ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#9df425]"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-[10px] uppercase tracking-widest text-white/30 border-b border-white/10">
                        <tr>
                            <th className="pb-4 font-normal pl-2">Tenant Entity</th>
                            <th className="pb-4 font-normal">Plan Tier</th>
                            <th className="pb-4 font-normal text-right">Token Flow</th>
                            <th className="pb-4 font-normal text-right">Est. Liability</th>
                            <th className="pb-4 font-normal text-right pr-2">Trend</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80 font-light">
                        {filteredTenants.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-white/30 text-xs font-mono uppercase tracking-widest">
                                    No usage data found
                                </td>
                            </tr>
                        )}
                        {filteredTenants.map((row, i) => (
                            <tr key={i} className="group hover:bg-white/5 transition-colors">
                                <td className="py-4 pl-2 font-medium">
                                    <span className="text-[#9df425] font-mono mr-2">TN-{row.tenantId.substring(0, 4)}</span>
                                    Tenant {row.tenantId.substring(0, 8)}...
                                    <div className="text-[9px] text-white/30 font-mono hidden sm:block">ID: {row.tenantId}</div>
                                </td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded text-[9px] uppercase tracking-wider ${row.planName === 'Enterprise' ? 'bg-[#9df425]/10 text-[#9df425] border border-[#9df425]/20' : 'bg-white/10 border border-white/5'}`}>
                                        {row.planName}
                                    </span>
                                </td>
                                <td className="py-4 text-right font-mono text-white/60">
                                    {row.totalTokens.toLocaleString()}
                                </td>
                                <td className="py-4 text-right font-mono text-[#9df425]">
                                    ${row.estimatedCost.toFixed(2)}
                                </td>
                                <td className="py-4 pr-2 flex justify-end">
                                    {row.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-red-500" />}
                                    {row.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-[#9df425]" />}
                                    {row.trend === 'stable' && <span className="text-white/30 text-xs">—</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
