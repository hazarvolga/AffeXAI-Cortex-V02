'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
    { name: 'Mon', interactions: 4000, conversions: 2400 },
    { name: 'Tue', interactions: 3000, conversions: 1398 },
    { name: 'Wed', interactions: 2000, conversions: 9800 },
    { name: 'Thu', interactions: 2780, conversions: 3908 },
    { name: 'Fri', interactions: 1890, conversions: 4800 },
    { name: 'Sat', interactions: 2390, conversions: 3800 },
    { name: 'Sun', interactions: 3490, conversions: 4300 },
];

export function PerformanceTimelineChart() {
    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Unified Performance Timeline</CardTitle>
                <CardDescription>
                    Interactions vs Conversions across all channels (Neural Aggregation)
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="interactions" stackId="1" stroke="#8884d8" fill="#8884d8" />
                            <Area type="monotone" dataKey="conversions" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
