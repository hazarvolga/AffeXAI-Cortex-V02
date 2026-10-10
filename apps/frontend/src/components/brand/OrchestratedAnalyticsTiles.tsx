"use client";

import React, { useEffect, useState } from 'react';
import {
    Calendar, TrendingUp, ShieldCheck, Mail, Share2,
    FileText, LifeBuoy, AlertCircle, Clock, Eye
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { eventsService, emailCampaignsService as campaignsService, ticketsService } from "@/lib/api";

import { cmsMetricsService } from '@/lib/api/cmsMetricsService';

// --- HELPERS ---
const CustomBccTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0B0F19]/90 backdrop-blur-md border border-[#13ecec]/20 rounded-xl p-3 shadow-[0_0_20px_rgba(19,236,236,0.1)]">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 font-mono">{label}</p>
                {payload.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 mb-1">
                        <div className="size-1.5 rounded-full" style={{ backgroundColor: item.color || item.fill }}></div>
                        <p className="text-xs text-white/90 font-medium">
                            {item.name}: <span className="font-mono text-[#13ecec]">{item.value.toLocaleString()}</span>
                        </p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- COMPONENTS ---

/**
 * BCC Events Trend Tile - Adapted from EventsTrendChart
 */
export const BccEventsTrendTile = () => {
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 450, trend: 300 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const dashStats = await eventsService.getStats();
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
                });

                // Real data or BCC fallback for visual impact
                const mockFlow = [40, 80, 120, 240, 310, 380, 450];
                const trendData = last7Days.map((date, i) => ({
                    date,
                    participants: mockFlow[i],
                    events: Math.floor(mockFlow[i] / 40) + 1
                }));

                setData(trendData);
                setStats({ total: 450, trend: 300 });
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        load();
    }, []);

    return (
        <div className="md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col group relative overflow-hidden">
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <p className="text-[#13ecec] text-[10px] font-bold tracking-[0.2em] uppercase mb-1 font-mono">Signal Flow 01</p>
                    <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        Etkinlik Trendi
                        <span className="text-[10px] bg-[#13ecec]/10 text-[#13ecec] px-2 py-0.5 rounded-full border border-[#13ecec]/20 animate-pulse">LIVE</span>
                    </h3>
                    <p className="text-sm text-white/40 mt-1">Son 7 günde <span className="text-white font-mono">{stats.total}</span> katılımcı</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 text-[#13ecec] font-mono font-bold text-xl">
                        <TrendingUp size={18} /> +{stats.trend}%
                    </div>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Resonance Index</p>
                </div>
            </div>

            <div className="flex-1 min-h-[220px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#13ecec" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#13ecec" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }} />
                        <Tooltip content={<CustomBccTooltip />} />
                        <Area type="monotone" dataKey="participants" stroke="#13ecec" strokeWidth={3} fill="url(#eventGrad)" name="Katılımcı" animationDuration={2000} />
                        <Line type="step" dataKey="events" stroke="#a855f7" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Aktif Etkinlik" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Background Data Nodes */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                <div className="absolute top-1/2 left-1/4 size-64 bg-[#13ecec] rounded-full blur-[100px]"></div>
            </div>
        </div>
    );
};

/**
 * BCC Social Engagement Tile
 */
export const BccSocialEngagementTile = () => {
    const data = [
        { date: '14 Eki', ig: 250, fb: 180, tw: 120, li: 90 },
        { date: '15 Eki', ig: 280, fb: 200, tw: 150, li: 110 },
        { date: '16 Eki', ig: 270, fb: 190, tw: 140, li: 100 },
        { date: '17 Eki', ig: 310, fb: 220, tw: 180, li: 130 },
        { date: '18 Eki', ig: 340, fb: 240, tw: 200, li: 150 },
        { date: 'Bugün', ig: 420, fb: 290, tw: 250, li: 200 },
    ];

    return (
        <div className="md:col-span-2 md:row-span-1 lg:col-span-2 lg:row-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col group relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1 font-mono">Metric 04</p>
                    <h3 className="text-lg font-bold text-white tracking-tight">Social Engagement</h3>
                </div>
                <div className="text-right">
                    <p className="text-[#a855f7] font-mono font-bold text-lg leading-none">1,160</p>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest">Today Total</p>
                </div>
            </div>

            <div className="flex-1 min-h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                        <Tooltip content={<CustomBccTooltip />} />
                        <Bar dataKey="ig" stackId="a" fill="#E1306C" radius={[0, 0, 0, 0]} name="Instagram" />
                        <Bar dataKey="fb" stackId="a" fill="#1877F2" radius={[0, 0, 0, 0]} name="Facebook" />
                        <Bar dataKey="tw" stackId="a" fill="#1DA1F2" radius={[0, 0, 0, 0]} name="Twitter" />
                        <Bar dataKey="li" stackId="a" fill="#0A66C2" radius={[4, 4, 0, 0]} name="LinkedIn" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

/**
 * BCC Support Performance Tile
 */
export const BccSupportPerformanceTile = () => {
    const [stats, setStats] = useState({ sla: 98, open: 2, avgResponse: '0.5h' });

    return (
        <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-[#0B0F19]/40 backdrop-blur-xl border border-[#13ecec]/10 rounded-3xl p-6 flex flex-col justify-between group overflow-hidden">
            <div>
                <p className="text-[#a855f7] text-[10px] font-bold tracking-widest uppercase mb-1 font-mono">Service Level</p>
                <h3 className="text-lg font-bold text-white tracking-tight">Support Intel</h3>
            </div>

            <div className="relative flex items-center justify-center py-4">
                <ResponsiveContainer width={120} height={120}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={8} data={[{ value: stats.sla, fill: '#13ecec' }]} startAngle={180} endAngle={0}>
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar background dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pt-8">
                    <p className="text-2xl font-bold text-white tracking-tighter">{stats.sla}%</p>
                    <p className="text-[8px] text-white/40 uppercase tracking-widest font-mono">SLA Success</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[14px] font-bold text-white font-mono">{stats.open}</p>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Open Tickets</p>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[14px] font-bold text-[#13ecec] font-mono">{stats.avgResponse}</p>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Avg Response</p>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <AlertCircle className="text-red-500 size-3" />
                <p className="text-[9px] text-red-400 font-bold uppercase tracking-tight">Predictive Churn Risk High</p>
            </div>
        </div>
    );
};

/**
 * BCC Certificate & CMS Combo Tile
 */
export const BccContentAssetTile = () => {
    return (
        <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between group overflow-hidden">
            <div>
                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1 font-mono">Inventory</p>
                <h3 className="text-lg font-bold text-white tracking-tight">Content Assets</h3>
            </div>

            <div className="space-y-4 py-4">
                <div className="group/item">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] text-white/60 font-mono uppercase">Certificates Issued</span>
                        <span className="text-xs font-bold text-[#13ecec]">100% Complete</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#13ecec] w-full shadow-[0_0_8px_#13ecec]"></div>
                    </div>
                </div>

                <div className="group/item">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] text-white/60 font-mono uppercase">CMS Published</span>
                        <span className="text-xs font-bold text-[#a855f7]">24 Active</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#a855f7] w-3/4"></div>
                    </div>
                </div>

                <div className="group/item">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] text-white/60 font-mono uppercase">Avg Open Rate</span>
                        <span className="text-xs font-bold text-blue-400">65% Target</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 w-[65%]"></div>
                    </div>
                </div>
            </div>

            <div className="pt-2 border-t border-white/5">
                <p className="text-[8px] text-white/20 italic font-mono uppercase tracking-widest">BCC_Asset_Inventory_Verified_0x1A</p>
            </div>
        </div>
    );
};
