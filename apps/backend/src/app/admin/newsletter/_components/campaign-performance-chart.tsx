'use client';

import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import emailCampaignsService from '@/lib/api/emailCampaignsService';
import { EmailCampaign } from '@/lib/api/emailCampaignsService';

export function CampaignPerformanceChart() {
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const campaigns = await emailCampaignsService.getAllCampaigns();
                const data = campaigns
                    .filter((c: EmailCampaign) => c.status === 'sent')
                    .slice(0, 5) // Get last 5 sent campaigns
                    .map((c: EmailCampaign) => {
                        // Calculate rates
                        const openRate = c.totalRecipients > 0 ? Math.round((c.openedCount / c.totalRecipients) * 100) : 0;
                        const clickRate = c.totalRecipients > 0 ? Math.round((c.clickedCount / c.totalRecipients) * 100) : 0;
                        
                        return {
                            name: c.name.substring(0, 15) + (c.name.length > 15 ? '...' : ''), // Shorten name for chart
                            "Açılma Oranı (%)": openRate,
                            "Tıklanma Oranı (%)": clickRate,
                        }
                    }).reverse(); // Reverse to show oldest first
                setChartData(data);
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
            <Card>
                <CardHeader>
                    <CardTitle>Kampanya Performansı</CardTitle>
                    <CardDescription>Son gönderilen kampanyaların açılma ve tıklanma oranları.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[300px]">
                        <div className="text-muted-foreground">Veriler yükleniyor...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kampanya Performansı</CardTitle>
                <CardDescription>Son gönderilen kampanyaların açılma ve tıklanma oranları.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                             cursor={{ fill: "hsl(var(--muted))" }}
                             contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                        />
                        <Legend />
                        <Bar dataKey="Açılma Oranı (%)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Tıklanma Oranı (%)" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}