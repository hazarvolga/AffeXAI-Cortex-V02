'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";

export function QuotaUsageCard() {
    const [usage, setUsage] = useState({
        remaining: 850,
        limit: 1000,
        percentage: 85
    });

    // Mock refreshing data
    useEffect(() => {
        const interval = setInterval(() => {
            setUsage(prev => {
                const newRemaining = Math.max(0, prev.remaining - Math.floor(Math.random() * 5));
                return {
                    remaining: newRemaining,
                    limit: prev.limit,
                    percentage: (newRemaining / prev.limit) * 100
                };
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    AI Credit Usage
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Monthly Quota</span>
                            <span className="font-medium">{usage.remaining} / {usage.limit}</span>
                        </div>
                        <Progress value={usage.percentage} className="h-2" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Credits reset in 12 days. Upgrade plan for more capacity.
                    </p>
                    <div className="flex items-center space-x-2 pt-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium">Pro Plan Active</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
