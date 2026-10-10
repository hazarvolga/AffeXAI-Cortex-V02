'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { useSocket } from "@/providers/SocketProvider";

interface Insight {
    id: string;
    title: string;
    message: string;
    impact: 'high' | 'medium' | 'low';
    type: 'success' | 'warning' | 'info' | 'neural-insight';
    timestamp: Date;
}

export function NeuralInsightsCard() {
    const { lastEvent } = useSocket();
    const [insights, setInsights] = useState<Insight[]>([]);

    useEffect(() => {
        if (lastEvent && lastEvent.type === 'neural-insight') {
            const newInsight: Insight = {
                id: Date.now().toString(),
                title: lastEvent.title,
                message: lastEvent.message,
                impact: lastEvent.impact,
                type: 'neural-insight',
                timestamp: new Date()
            };
            setInsights(prev => [newInsight, ...prev].slice(0, 10)); // Keep last 10
        }
    }, [lastEvent]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'info': return <Info className="h-4 w-4 text-blue-500" />;
            default: return <Sparkles className="h-4 w-4 text-[#9df425]" />; // Brand Green
        }
    };

    const getBadgeVariant = (impact: string) => {
        switch (impact) {
            case 'high': return 'destructive';
            case 'medium': return 'default';
            case 'low': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Neural Grid Insights
                </CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                        {insights.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 opacity-60">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[#9df425] blur-xl opacity-20 animate-pulse"></div>
                                    <Sparkles className="h-8 w-8 text-[#9df425] animate-spin-slow" />
                                </div>
                                <p className="text-xs font-mono uppercase tracking-widest text-[#9df425]">
                                    Scanning Neural Grid...
                                </p>
                                <p className="text-[10px] text-muted-foreground max-w-[180px]">
                                    Waiting for live signals from social & commerce nodes.
                                </p>
                            </div>
                        ) : (
                            insights.map((insight) => (
                                <div key={insight.id} className="flex items-start space-x-4 rounded-md border border-white/5 bg-white/[0.02] p-3 shadow-sm animate-in slide-in-from-left-2 duration-300">
                                    <div className="mt-1">
                                        {getIcon(insight.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium leading-none text-white/90">
                                                {insight.title}
                                            </p>
                                            <Badge variant={getBadgeVariant(insight.impact)} className="text-[10px] uppercase tracking-wider">
                                                {insight.impact}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-white/60">
                                            {insight.message}
                                        </p>
                                        <p className="text-[10px] text-white/40 pt-1 font-mono">
                                            {new Date(insight.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
