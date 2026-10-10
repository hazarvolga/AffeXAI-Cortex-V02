'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, MousePointer, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { OverviewMetrics } from '@/lib/api/cmsAnalyticsService';

interface AnalyticsOverviewCardsProps {
  metrics: OverviewMetrics;
  isLoading?: boolean;
}

export function AnalyticsOverviewCards({ metrics, isLoading }: AnalyticsOverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Toplam Görüntülenme',
      value: metrics.totalViews.toLocaleString('tr-TR'),
      change: metrics.changeFromPrevious.views,
      icon: Eye,
      description: 'Sayfa görüntülenmeleri',
    },
    {
      title: 'Toplam Etkileşim',
      value: metrics.totalInteractions.toLocaleString('tr-TR'),
      change: metrics.changeFromPrevious.interactions,
      icon: MousePointer,
      description: 'Tıklama, hover, scroll vb.',
    },
    {
      title: 'Ortalama Etkileşim Süresi',
      value: `${Math.round(metrics.averageEngagementTime / 1000)}s`,
      change: metrics.changeFromPrevious.engagementTime,
      icon: Clock,
      description: 'Kullanıcı etkileşim süresi',
    },
    {
      title: 'Dönüşüm Oranı',
      value: `${metrics.conversionRate.toFixed(2)}%`,
      change: metrics.changeFromPrevious.conversionRate,
      icon: TrendingUp,
      description: 'Hedef dönüşüm oranı',
    },
  ];

  const getTrendIcon = (change: number) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const TrendIcon = getTrendIcon(card.change);
        const trendColor = getTrendColor(card.change);

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                <p className={`text-xs ${trendColor}`}>
                  {formatChange(card.change)}
                </p>
                <p className="text-xs text-muted-foreground ml-1">
                  önceki döneme göre
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
