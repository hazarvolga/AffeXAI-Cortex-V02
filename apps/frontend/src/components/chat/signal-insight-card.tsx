'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Badge,
} from '@/components/ui/badge';

interface SignalInsightCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string | number;
  trend: 'up' | 'down' | 'neutral';
  change: string;
}

export default function SignalInsightCard({
  title,
  description,
  icon,
  value,
  trend,
  change
}: SignalInsightCardProps) {
  const trendClass = trend === 'up'
    ? 'text-green-600'
    : trend === 'down'
      ? 'text-red-600'
      : 'text-muted-foreground';
  const trendIcon = trend === 'up'
    ? 'TrendingUp'
    : trend === 'down'
      ? 'TrendingDown'
      : 'Minus';

  return (
    <Card className="h-[120px]">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs">
        <span className={trendClass}>
          {/* In a real implementation, we'd use the actual trend icon */}
          {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '→'} {change}
        </span>
        <Badge variant="secondary">Live</Badge>
      </CardFooter>
    </Card>
  );
}
