
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { subscribers } from "@/lib/newsletter-data";
import { format, subMonths, getMonth, getYear } from 'date-fns';
import { tr } from 'date-fns/locale';

// Helper to get last 6 months
const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i)).reverse();

// Process data
const monthlyData = last6Months.map(monthDate => {
    const month = getMonth(monthDate);
    const year = getYear(monthDate);

    const count = subscribers.filter(sub => {
        const subDate = new Date(sub.subscribedAt);
        return getMonth(subDate) === month && getYear(subDate) === year;
    }).length;

    return {
        name: format(monthDate, 'MMM', { locale: tr }),
        "Yeni Aboneler": count
    };
});

export function SubscriberGrowthChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Abone Büyüme Grafiği</CardTitle>
                <CardDescription>Son 6 aydaki yeni abone kayıtları.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
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
                            tickFormatter={(value) => `${value}`}
                        />
                         <Tooltip
                            cursor={{ fill: "hsl(var(--muted))" }}
                            contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                        />
                        <Bar dataKey="Yeni Aboneler" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
