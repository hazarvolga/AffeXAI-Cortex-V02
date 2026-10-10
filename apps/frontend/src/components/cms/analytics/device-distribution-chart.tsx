'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Smartphone, Tablet, Monitor } from 'lucide-react';
import type { DeviceType } from '@/lib/api/cmsAnalyticsService';

interface DeviceDistributionChartProps {
  distribution: Record<DeviceType, number>;
  isLoading?: boolean;
}

const COLORS = {
  mobile: 'hsl(var(--chart-1))',
  tablet: 'hsl(var(--chart-2))',
  desktop: 'hsl(var(--chart-3))',
};

const DEVICE_ICONS = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

const DEVICE_LABELS = {
  mobile: 'Mobil',
  tablet: 'Tablet',
  desktop: 'Masaüstü',
};

export function DeviceDistributionChart({ distribution, isLoading }: DeviceDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          </CardTitle>
          <CardDescription>
            <div className="h-4 w-56 bg-muted animate-pulse rounded mt-2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);

  const chartData = Object.entries(distribution).map(([device, value]) => ({
    name: DEVICE_LABELS[device as DeviceType],
    value,
    percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0',
    device: device as DeviceType,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cihaz Dağılımı</CardTitle>
        <CardDescription>
          Kullanıcıların cihaz tiplerine göre dağılımı
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.device]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2">
            {chartData.map((item) => {
              const Icon = DEVICE_ICONS[item.device];
              return (
                <div
                  key={item.device}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[item.device] }}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {item.value.toLocaleString('tr-TR')}
                    </span>
                    <span className="text-sm font-medium w-12 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
