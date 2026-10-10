'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getDashboardData,
  logPerformanceSummary,
  getResourceSummary,
  type DashboardData,
  type MetricName,
  formatMetricValue,
} from '@/lib/performance';
import { Activity, Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Performance Dashboard Component
 * 
 * Displays Web Vitals metrics and performance statistics.
 * Useful for development and performance analysis.
 * 
 * @example
 * ```tsx
 * // In a development page
 * import { PerformanceDashboard } from '@/components/performance/performance-dashboard';
 * 
 * export default function DevPage() {
 *   return <PerformanceDashboard />;
 * }
 * ```
 */
export function PerformanceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [resources, setResources] = useState<any>(null);

  const loadData = () => {
    setData(getDashboardData());
    setResources(getResourceSummary());
  };

  useEffect(() => {
    loadData();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getRatingColor = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good':
        return 'bg-green-500';
      case 'needs-improvement':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail') => {
    return status === 'pass' ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading performance data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Core Web Vitals and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => logPerformanceSummary()} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Log Summary
          </Button>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Budget Status */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Budget Status</CardTitle>
          <CardDescription>
            Metrics compared against performance budgets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.budgetStatus.map((budget) => (
              <div key={budget.metric} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{budget.metric}</span>
                  {getStatusIcon(budget.status)}
                </div>
                <div className="text-2xl font-bold">
                  {formatMetricValue(budget.metric, budget.average)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Budget: {formatMetricValue(budget.metric, budget.budget)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Web Vitals Details */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(data.summary).map(([name, stats]) => {
          if (!stats) return null;

          const metric = name as MetricName;
          const goodPercent = ((stats.goodCount / stats.count) * 100).toFixed(1);
          const poorPercent = ((stats.poorCount / stats.count) * 100).toFixed(1);

          return (
            <Card key={metric}>
              <CardHeader>
                <CardTitle className="text-lg">{metric}</CardTitle>
                <CardDescription>
                  {stats.count} measurements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Average</span>
                    <span className="font-medium">
                      {formatMetricValue(metric, stats.average)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Median</span>
                    <span className="font-medium">
                      {formatMetricValue(metric, stats.median)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P95</span>
                    <span className="font-medium">
                      {formatMetricValue(metric, stats.p95)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex gap-1">
                    <div 
                      className="h-2 bg-green-500 rounded-l"
                      style={{ width: `${goodPercent}%` }}
                    />
                    <div 
                      className="h-2 bg-yellow-500"
                      style={{ width: `${(stats.needsImprovementCount / stats.count) * 100}%` }}
                    />
                    <div 
                      className="h-2 bg-red-500 rounded-r"
                      style={{ width: `${poorPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{goodPercent}% good</span>
                    <span>{poorPercent}% poor</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resource Summary */}
      {resources && (
        <Card>
          <CardHeader>
            <CardTitle>Resource Loading Summary</CardTitle>
            <CardDescription>
              Breakdown of loaded resources by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(resources).map(([type, data]: [string, any]) => (
                <div key={type} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{type}</span>
                    <Badge variant="secondary">{data.count}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Size</span>
                      <span>{(data.totalSize / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Time</span>
                      <span>{(data.totalDuration / data.count).toFixed(0)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cached</span>
                      <span>{data.cached}/{data.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Measurements</CardTitle>
          <CardDescription>
            Last 10 performance measurements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recentMetrics.slice(-10).reverse().map((entry, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{entry.name}</Badge>
                  <span className="text-sm font-medium">
                    {formatMetricValue(entry.name, entry.value)}
                  </span>
                  <div 
                    className={`w-2 h-2 rounded-full ${getRatingColor(entry.rating)}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
