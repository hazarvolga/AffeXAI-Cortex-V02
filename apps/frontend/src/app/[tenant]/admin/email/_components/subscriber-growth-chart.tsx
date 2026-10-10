'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { BccHudTile } from "@/components/brand/BccHudTile"
import { subscribers } from "@/lib/newsletter-data";
import { format, subMonths, getMonth, getYear } from 'date-fns';
import { enGB } from 'date-fns/locale';

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
        name: format(monthDate, 'MMM', { locale: enGB }).toUpperCase(),
        "NEW_NODES": count
    };
});

export function SubscriberGrowthChart() {
    return (
        <BccHudTile title="IDENTITY_GROWTH" subtitle="Neural Node Expansion Statistics" icon="trending_up">
            <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
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
                            tickFormatter={(value) => `${value}`}
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
                            itemStyle={{ color: "#9df425" }}
                        />
                        <Bar dataKey="NEW_NODES" fill="#9df425" radius={[0, 0, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </BccHudTile>
    )
}
