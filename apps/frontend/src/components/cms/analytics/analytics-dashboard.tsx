'use client';

/**
 * Analytics Dashboard Component
 *
 * Comprehensive analytics dashboard with:
 * - Overview metrics
 * - Interaction timeline
 * - Top performing components
 * - Device distribution
 * - Active A/B tests
 */

import { useState } from 'react';
import type {
  AnalyticsDashboard,
  AnalyticsTimeRange,
  ComponentAnalytics,
} from '@/types/cms-analytics';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  MousePointerClickIcon,
  ClockIcon,
  TrendingUpIcon,
} from 'lucide-react';

export interface AnalyticsDashboardProps {
  /** Dashboard data */
  data: AnalyticsDashboard;

  /** Selected time range */
  timeRange: AnalyticsTimeRange;

  /** On time range change */
  onTimeRangeChange?: (range: AnalyticsTimeRange) => void;

  /** On component click */
  onComponentClick?: (componentId: string) => void;

  /** On test click */
  onTestClick?: (testId: string) => void;
}

export function AnalyticsDashboard({
  data,
  timeRange,
  onTimeRangeChange,
  onComponentClick,
  onTestClick,
}: AnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'interactions' | 'conversions'>(
    'views'
  );

  const timeRanges: AnalyticsTimeRange[] = [
    'today',
    'yesterday',
    'last7days',
    'last30days',
    'last90days',
  ];

  const timeRangeLabels: Record<AnalyticsTimeRange, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    last7days: 'Last 7 Days',
    last30days: 'Last 30 Days',
    last90days: 'Last 90 Days',
    custom: 'Custom',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Component performance and user interaction metrics
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeRangeChange?.(range)}
            >
              {timeRangeLabels[range]}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Views"
          value={data.overview.totalViews}
          change={data.overview.changeFromPrevious.views}
          icon={<EyeIcon className="h-5 w-5" />}
        />
        <MetricCard
          title="Total Interactions"
          value={data.overview.totalInteractions}
          change={data.overview.changeFromPrevious.interactions}
          icon={<MousePointerClickIcon className="h-5 w-5" />}
        />
        <MetricCard
          title="Avg Engagement"
          value={formatDuration(data.overview.averageEngagementTime)}
          change={data.overview.changeFromPrevious.engagementTime}
          icon={<ClockIcon className="h-5 w-5" />}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${(data.overview.conversionRate * 100).toFixed(2)}%`}
          change={data.overview.changeFromPrevious.conversionRate}
          icon={<TrendingUpIcon className="h-5 w-5" />}
        />
      </div>

      {/* Timeline chart */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Interaction Timeline</h3>
            <div className="flex gap-2">
              <Button
                variant={selectedMetric === 'views' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('views')}
              >
                Views
              </Button>
              <Button
                variant={selectedMetric === 'interactions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('interactions')}
              >
                Interactions
              </Button>
              <Button
                variant={selectedMetric === 'conversions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('conversions')}
              >
                Conversions
              </Button>
            </div>
          </div>

          <TimelineChart data={data.timeline} metric={selectedMetric} />
        </div>
      </Card>

      {/* Top components and device distribution */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top components */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Top Performing Components</h3>
          <div className="space-y-3">
            {data.topComponents.map((component, index) => (
              <div
                key={component.componentId}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onComponentClick?.(component.componentId)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{component.componentType}</div>
                    <div className="text-sm text-muted-foreground">
                      {component.pageUrl}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {(component.interactionRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {component.conversions} conversions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Device distribution */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Device Distribution</h3>
          <div className="space-y-4">
            <DeviceBar
              label="Desktop"
              percentage={data.deviceDistribution.desktop}
              color="bg-blue-500"
            />
            <DeviceBar
              label="Tablet"
              percentage={data.deviceDistribution.tablet}
              color="bg-green-500"
            />
            <DeviceBar
              label="Mobile"
              percentage={data.deviceDistribution.mobile}
              color="bg-purple-500"
            />
          </div>

          {/* Recent sessions */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3">Recent Sessions</h4>
            <div className="space-y-2">
              {data.recentSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {session.device.type}
                    </Badge>
                    <span className="text-muted-foreground">
                      {session.totalInteractions} interactions
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatDuration(session.duration || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Active A/B tests */}
      {data.activeTests.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Active A/B Tests</h3>
          <div className="space-y-3">
            {data.activeTests.map((test) => (
              <div
                key={test.id}
                className="p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onTestClick?.(test.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {test.description}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge>{test.status}</Badge>
                      <Badge variant="outline">{test.variants.length} variants</Badge>
                      {test.statisticalSignificance?.achieved && (
                        <Badge variant="secondary">
                          {test.statisticalSignificance.confidenceLevel}% confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Goal</div>
                    <div className="font-medium">{test.conversionGoal}</div>
                  </div>
                </div>

                {/* Variant summary */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {test.variants.map((variant) => (
                    <div key={variant.id} className="p-2 rounded border bg-muted/20">
                      <div className="text-xs text-muted-foreground">{variant.name}</div>
                      <div className="mt-1 text-lg font-semibold">
                        {(variant.metrics.conversionRate * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {variant.metrics.conversions} / {variant.metrics.impressions}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * Metric Card Component
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, icon }: MetricCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="mt-1 text-2xl font-bold">{formatValue(value)}</div>
          <div
            className={`mt-2 flex items-center gap-1 text-sm ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isPositive ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
            <span>
              {Math.abs(change).toFixed(1)}% from previous period
            </span>
          </div>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
    </Card>
  );
}

/**
 * Timeline Chart Component (simple bar chart)
 */
interface TimelineChartProps {
  data: AnalyticsDashboard['timeline'];
  metric: 'views' | 'interactions' | 'conversions';
}

function TimelineChart({ data, metric }: TimelineChartProps) {
  const maxValue = Math.max(...data.map((d) => d[metric]));

  return (
    <div className="space-y-2">
      {data.map((point, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground w-20">
            {new Date(point.timestamp).toLocaleDateString()}
          </div>
          <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${(point[metric] / maxValue) * 100}%`,
              }}
            />
          </div>
          <div className="text-sm font-medium w-16 text-right">
            {point[metric].toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Device Bar Component
 */
interface DeviceBarProps {
  label: string;
  percentage: number;
  color: string;
}

function DeviceBar({ label, percentage, color }: DeviceBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {(percentage * 100).toFixed(1)}%
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${percentage * 100}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Format value for display
 */
function formatValue(value: string | number): string {
  if (typeof value === 'string') return value;
  return value.toLocaleString();
}

/**
 * Format duration in milliseconds
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
