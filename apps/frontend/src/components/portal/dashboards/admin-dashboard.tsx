
'use client'

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, Users, Bot, MailOpen, ThumbsUp, LifeBuoy, DollarSign, Calendar, Send, Share2, BrainCircuit, Activity, CreditCard } from "lucide-react";
import Link from "next/link";
import {
    LineChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Line,
    CartesianGrid,
    AreaChart,
    Area
} from "recharts"
import { socialAccounts, getPlatformIcon } from "@/lib/social-media-data"; // Still needed for static icons/metadata
import { analyticsDashboardService, DashboardData, AnalyticsTimeRange } from "@/lib/api/analyticsDashboardService";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSocket } from "@/providers/SocketProvider";
import { useToast } from "@/hooks/use-toast";

// Fallback/Loading State
const LoadingCard = () => (
    <Card className="animate-pulse">
        <CardHeader className="h-20 bg-muted/50" />
        <CardContent className="h-24" />
    </Card>
);

export default function AdminDashboard() {
    const params = useParams();
    const tenant = params?.tenant as string || "default";
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const { socket, lastEvent } = useSocket();
    const { toast } = useToast();

    // Effect: Handle Real-Time Events
    useEffect(() => {
        if (!lastEvent) return;

        console.log("⚡ Dashboard received event:", lastEvent);

        if (lastEvent.type === 'neural-insight') {
            // Add new insight to the list dynamically
            setData(prev => {
                if (!prev) return null;
                const newInsight = {
                    title: lastEvent.title || "Yeni AI Tespesi",
                    type: "opportunity" as const,
                    impact: lastEvent.impact === 'high' || lastEvent.impact === 'low' ? lastEvent.impact : 'medium' as const,
                    description: lastEvent.message
                };
                return {
                    ...prev,
                    neuralInsights: [newInsight, ...(prev.neuralInsights || [])].slice(0, 5) // Keep top 5
                };
            });

            toast({
                title: "Neural Insight Detected",
                description: lastEvent.message || lastEvent.title,
                variant: "default", // or custom variant
            });
        }
    }, [lastEvent]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await analyticsDashboardService.getDashboardData({
                    timeRange: AnalyticsTimeRange.LAST_7_DAYS
                });
                setData(result);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derived Metrics for UI
    const metrics = [
        {
            title: "Toplam Görüntülenme",
            value: data?.overview.totalViews.toLocaleString() || "0",
            change: `${data?.overview.changeFromPrevious.views.toFixed(1)}%`,
            icon: Users,
            trend: (data?.overview.changeFromPrevious.views || 0) > 0 ? "up" : "down"
        },
        {
            title: "Etkileşimler",
            value: data?.overview.totalInteractions.toLocaleString() || "0",
            change: `${data?.overview.changeFromPrevious.interactions.toFixed(1)}%`,
            icon: Activity
        },
        {
            title: "Dönüşüm Oranı",
            value: `%${(data?.overview.conversionRate ? data.overview.conversionRate * 100 : 0).toFixed(2)}`,
            change: `${data?.overview.changeFromPrevious.conversionRate.toFixed(1)}%`,
            icon: DollarSign
        },
        {
            title: "Email Açılma",
            value: `%${(data?.emailEngagement?.openRate ? data.emailEngagement.openRate * 100 : 0).toFixed(1)}`,
            change: "Ortalama",
            icon: MailOpen
        },
        {
            title: "Marka Duygusu",
            value: data?.socialSentiment?.score ? (data.socialSentiment.score * 100).toFixed(0) : "N/A",
            change: data?.socialSentiment?.trend === 'up' ? 'Yükselişte' : 'Düşüşte',
            icon: ThumbsUp,
            color: (data?.socialSentiment?.score || 0) > 0.5 ? "text-green-500" : "text-red-500"
        },
        {
            title: "Neural Insights",
            value: data?.neuralInsights?.length.toString() || "0",
            change: "Yeni Sinyal",
            icon: BrainCircuit,
            highlight: true
        },
    ];

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => <LoadingCard key={i} />)}
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        BCC Komuta Merkezi
                    </h2>
                    <p className="text-muted-foreground">
                        Neural Grid tabanlı gerçek zamanlı marka analitiği.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Yenile
                    </Button>
                    <Button asChild>
                        <Link href={`/${tenant}/admin`}>Yönetim Paneli</Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {metrics.map((metric, i) => (
                    <Card key={i} className={metric.highlight ? "border-primary/50 bg-primary/5" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                            <metric.icon className={`h-4 w-4 ${metric.color || "text-muted-foreground"}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metric.value}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {metric.change}
                                {/* Add simple trend indicators if needed */}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Neural Insights & Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-500" />
                            Performans Zaman Çizelgesi
                        </CardTitle>
                        <CardDescription>Son 7 günün etkileşim ve dönüşüm verileri.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.timeline || []}>
                                <defs>
                                    <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString('tr-TR', { weekday: 'short' })}
                                    fontSize={12}
                                />
                                <YAxis fontSize={12} />
                                <Tooltip
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="interactions"
                                    stroke="hsl(var(--primary))"
                                    fillOpacity={1}
                                    fill="url(#colorInteractions)"
                                    name="Etkileşim"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="conversions"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Dönüşüm"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1 bg-slate-50 dark:bg-slate-900/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-purple-500" />
                            AI Önerileri (Neural Grid)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.neuralInsights && data.neuralInsights.length > 0 ? (
                                data.neuralInsights.map((insight, idx) => (
                                    <div key={idx} className="flex gap-3 p-3 bg-background rounded-lg border shadow-sm">
                                        <div className={`w-1 h-full rounded-full ${insight.impact === 'high' ? 'bg-red-500' :
                                            insight.impact === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`} />
                                        <div>
                                            <h4 className="font-semibold text-sm">{insight.title}</h4>
                                            <p className="text-xs text-muted-foreground capitalize">{insight.type} • {insight.impact} Impact</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Henüz yeterli veri yok.
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full text-xs" asChild>
                            <Link href={`/${tenant}/admin/strategy`}>Strateji Merkezine Git</Link>
                        </Button>
                    </CardFooter>
                </Card>

                {/* Commerce / Quota Widget */}
                <Card className="col-span-1 md:col-span-3">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <CreditCard className="h-4 w-4" />
                            Kullanım & Kota (AI Credits)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Progress value={data?.quotaUsage?.usedPercentage || 0} className="h-2" />
                            <div className="min-w-[100px] text-right">
                                <span className="text-lg font-bold">{data?.quotaUsage?.usedPercentage.toFixed(1) || 0}%</span>
                                <span className="text-xs text-muted-foreground block">Kullanıldı</span>
                            </div>
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                            <span>Kalan: {data?.quotaUsage?.remaining.toLocaleString() || 0} Token</span>
                            <span>Limit: {data?.quotaUsage?.limit.toLocaleString() || 0}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <Link href={`/${tenant}/admin/social`}>
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                            <Share2 className="h-8 w-8 mb-2 text-blue-500 group-hover:scale-110 transition-transform" />
                            <h3 className="font-semibold">Sosyal Medya</h3>
                            <p className="text-xs text-muted-foreground">İçerik planla ve paylaş</p>
                        </CardContent>
                    </Link>
                </Card>
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <Link href={`/${tenant}/admin/email-marketing`}>
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                            <Send className="h-8 w-8 mb-2 text-green-500 group-hover:scale-110 transition-transform" />
                            <h3 className="font-semibold">Email Kampanyası</h3>
                            <p className="text-xs text-muted-foreground">Bülten oluştur ve gönder</p>
                        </CardContent>
                    </Link>
                </Card>
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <Link href={`/${tenant}/admin/support`}>
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                            <LifeBuoy className="h-8 w-8 mb-2 text-orange-500 group-hover:scale-110 transition-transform" />
                            <h3 className="font-semibold">Destek Masası</h3>
                            <p className="text-xs text-muted-foreground">Talepleri yönet</p>
                        </CardContent>
                    </Link>
                </Card>
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <Link href={`/${tenant}/admin/events`}>
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                            <Calendar className="h-8 w-8 mb-2 text-purple-500 group-hover:scale-110 transition-transform" />
                            <h3 className="font-semibold">Etkinlikler</h3>
                            <p className="text-xs text-muted-foreground">Webinar ve buluşmalar</p>
                        </CardContent>
                    </Link>
                </Card>
            </div>
        </>
    );
}
