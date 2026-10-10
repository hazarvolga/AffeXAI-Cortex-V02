'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import type { TimelineDataPoint } from '@/lib/api/cmsAnalyticsService';

interface AnalyticsTimelineChartProps {
  data: TimelineDataPoint[];
  isLoading?: boolean;
}

export function AnalyticsTimelineChart({ data, isLoading }: AnalyticsTimelineChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          </CardTitle>
          <CardDescription>
            <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.map((point) => ({
    date: new Date(point.timestamp).toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric',
    }),
    görüntülenme: point.views,
    etkileşim: point.interactions,
    dönüşüm: point.conversions,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etkileşim Trendi</CardTitle>
        <CardDescription>
          Zaman içindeki görüntülenme, etkileşim ve dönüşüm verileri
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="görüntülenme"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="etkileşim"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="dönüşüm"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
