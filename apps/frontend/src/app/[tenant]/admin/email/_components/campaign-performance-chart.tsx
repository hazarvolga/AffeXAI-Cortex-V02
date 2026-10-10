'use client';

import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { BccHudTile } from "@/components/brand/BccHudTile"
import emailCampaignsService from '@/lib/api/emailCampaignsService';

interface ChartData {
    name: string;
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
}

export function CampaignPerformanceChart() {
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const campaigns = await emailCampaignsService.getAll();
                const chartData = campaigns.map(campaign => {
                    const sent = campaign.sentCount || 0;
                    const opened = campaign.openedCount || 0;
                    const clicked = campaign.clickedCount || 0;

                    return {
                        name: campaign.subject?.substring(0, 20).toUpperCase() + (campaign.subject?.length > 20 ? '...' : ''),
                        sent,
                        opened,
                        clicked,
                        openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
                        clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
                    };
                });
                setChartData(chartData);
            } catch (error) {
                console.error('Error fetching campaign data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <BccHudTile title="SIGNAL_PERFORMANCE" subtitle="Pulse Interaction Metrics" icon="bar_chart">
                <div className="flex items-center justify-center h-[300px]">
                    <div className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-mono animate-pulse">Syncing_Telemetry...</div>
                </div>
            </BccHudTile>
        );
    }

    return (
        <BccHudTile title="SIGNAL_PERFORMANCE" subtitle="Open and Click Resonance Rates" icon="equalizer">
            <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis
                            dataKey="name"
                            stroke="#ffffff20"
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}
                        />
                        <YAxis
                            stroke="#ffffff20"
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}%`}
                            tick={{ fill: 'rgba(255,255,255,0.4)' }}
                        />
                        <Tooltip
                            cursor={{ fill: "rgba(255,255,255,0.05)" }}
                            contentStyle={{
                                backgroundColor: "#080808",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "0px",
                                fontSize: "10px",
                                fontFamily: "monospace",
                                textTransform: "uppercase"
                            }}
                            itemStyle={{ color: "#ff8c00" }}
                        />
                        <Legend
                            wrapperStyle={{
                                fontSize: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                paddingTop: '20px',
                                opacity: 0.6
                            }}
                        />
                        <Bar dataKey="openRate" name="OPEN_RESONANCE (%)" fill="#ff8c00" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="clickRate" name="CLICK_PULSE (%)" fill="#9df425" radius={[0, 0, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </BccHudTile>
    )
}