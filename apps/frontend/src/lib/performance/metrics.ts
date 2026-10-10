/**
 * Performance Metrics Collector
 * 
 * Collects and aggregates performance metrics for monitoring and analysis.
 */

import type { MetricName, MetricRating } from './web-vitals';
import { getMetricRating, formatMetricValue, PERFORMANCE_BUDGETS } from './web-vitals';

/**
 * Performance Metric Entry
 */
interface MetricEntry {
  name: MetricName;
  value: number;
  rating: MetricRating;
  timestamp: number;
  url: string;
  userAgent?: string;
}

/**
 * Aggregated Performance Stats
 */
interface PerformanceStats {
  metric: MetricName;
  count: number;
  average: number;
  median: number;
  p75: number;
  p95: number;
  min: number;
  max: number;
  goodCount: number;
  needsImprovementCount: number;
  poorCount: number;
}

/**
 * Performance Metrics Store
 */
class MetricsStore {
  private metrics: MetricEntry[] = [];
  private readonly maxEntries = 1000; // Keep last 1000 metrics

  /**
   * Add a metric entry
   */
  add(name: MetricName, value: number): void {
    const entry: MetricEntry = {
      name,
      value,
      rating: getMetricRating(name, value),
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.metrics.push(entry);

    // Keep only recent entries
    if (this.metrics.length > this.maxEntries) {
      this.metrics = this.metrics.slice(-this.maxEntries);
    }

    // Store in localStorage for persistence
    this.persist();
  }

  /**
   * Get all metrics for a specific type
   */
  getMetrics(name: MetricName): MetricEntry[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): MetricEntry[] {
    return [...this.metrics];
  }

  /**
   * Calculate statistics for a metric
   */
  getStats(name: MetricName): PerformanceStats | null {
    const entries = this.getMetrics(name);
    
    if (entries.length === 0) {
      return null;
    }

    const values = entries.map(e => e.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);

    const getPercentile = (p: number) => {
      const index = Math.ceil((p / 100) * values.length) - 1;
      return values[index];
    };

    return {
      metric: name,
      count: entries.length,
      average: sum / entries.length,
      median: getPercentile(50),
      p75: getPercentile(75),
      p95: getPercentile(95),
      min: values[0],
      max: values[values.length - 1],
      goodCount: entries.filter(e => e.rating === 'good').length,
      needsImprovementCount: entries.filter(e => e.rating === 'needs-improvement').length,
      poorCount: entries.filter(e => e.rating === 'poor').length,
    };
  }

  /**
   * Get summary of all metrics
   */
  getSummary(): Record<MetricName, PerformanceStats | null> {
    const metrics: MetricName[] = ['FCP', 'LCP', 'FID', 'CLS', 'TTFB', 'INP'];
    const summary: Record<MetricName, PerformanceStats | null> = {} as any;

    metrics.forEach(metric => {
      summary[metric] = this.getStats(metric);
    });

    return summary;
  }

  /**
   * Check if metrics meet performance budgets
   */
  checkBudgets(): { metric: MetricName; status: 'pass' | 'fail'; average: number; budget: number }[] {
    const results: { metric: MetricName; status: 'pass' | 'fail'; average: number; budget: number }[] = [];
    const summary = this.getSummary();

    Object.entries(summary).forEach(([name, stats]) => {
      if (stats) {
        const budget = PERFORMANCE_BUDGETS[name as MetricName].good;
        results.push({
          metric: name as MetricName,
          status: stats.average <= budget ? 'pass' : 'fail',
          average: stats.average,
          budget,
        });
      }
    });

    return results;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.persist();
  }

  /**
   * Persist to localStorage
   */
  private persist(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('performance-metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Failed to persist metrics:', error);
    }
  }

  /**
   * Load from localStorage
   */
  load(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('performance-metrics');
      if (stored) {
        this.metrics = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: this.getSummary(),
      budgets: this.checkBudgets(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}

/**
 * Global metrics store instance
 */
export const metricsStore = new MetricsStore();

// Load metrics on initialization
if (typeof window !== 'undefined') {
  metricsStore.load();
}

/**
 * Performance Dashboard Data
 */
export interface DashboardData {
  summary: Record<MetricName, PerformanceStats | null>;
  budgetStatus: { metric: MetricName; status: 'pass' | 'fail'; average: number; budget: number }[];
  recentMetrics: MetricEntry[];
  timestamp: string;
}

/**
 * Get performance dashboard data
 */
export function getDashboardData(): DashboardData {
  return {
    summary: metricsStore.getSummary(),
    budgetStatus: metricsStore.checkBudgets(),
    recentMetrics: metricsStore.getAllMetrics().slice(-20), // Last 20 metrics
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary(): void {
  const summary = metricsStore.getSummary();
  const budgets = metricsStore.checkBudgets();

  console.group('📊 Performance Summary');
  
  Object.entries(summary).forEach(([name, stats]) => {
    if (stats) {
      const budget = budgets.find(b => b.metric === name);
      const status = budget?.status === 'pass' ? '✅' : '❌';
      
      console.log(`${status} ${name}:`);
      console.log(`  Average: ${formatMetricValue(name as MetricName, stats.average)}`);
      console.log(`  Median: ${formatMetricValue(name as MetricName, stats.median)}`);
      console.log(`  P95: ${formatMetricValue(name as MetricName, stats.p95)}`);
      console.log(`  Good: ${stats.goodCount} | Needs Improvement: ${stats.needsImprovementCount} | Poor: ${stats.poorCount}`);
    }
  });

  console.groupEnd();
}

/**
 * Resource Timing Analysis
 */
export interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  cached: boolean;
}

/**
 * Get resource timing data
 */
export function getResourceTimings(): ResourceTiming[] {
  if (typeof window === 'undefined') return [];

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  return resources.map(resource => ({
    name: resource.name,
    type: getResourceType(resource.name),
    duration: resource.duration,
    size: resource.transferSize || 0,
    cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
  }));
}

/**
 * Get resource type from URL
 */
function getResourceType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  
  if (['js', 'jsx', 'ts', 'tsx'].includes(extension)) return 'script';
  if (['css', 'scss', 'sass'].includes(extension)) return 'stylesheet';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(extension)) return 'image';
  if (['woff', 'woff2', 'ttf', 'otf'].includes(extension)) return 'font';
  if (['json', 'xml'].includes(extension)) return 'data';
  
  return 'other';
}

/**
 * Get resource summary by type
 */
export function getResourceSummary() {
  const timings = getResourceTimings();
  const byType: Record<string, { count: number; totalSize: number; totalDuration: number; cached: number }> = {};

  timings.forEach(resource => {
    if (!byType[resource.type]) {
      byType[resource.type] = { count: 0, totalSize: 0, totalDuration: 0, cached: 0 };
    }

    byType[resource.type].count++;
    byType[resource.type].totalSize += resource.size;
    byType[resource.type].totalDuration += resource.duration;
    if (resource.cached) byType[resource.type].cached++;
  });

  return byType;
}

/**
 * Performance Report
 */
export function generatePerformanceReport(): string {
  const dashboard = getDashboardData();
  const resources = getResourceSummary();

  let report = '# Performance Report\n\n';
  report += `Generated: ${dashboard.timestamp}\n\n`;

  report += '## Web Vitals Summary\n\n';
  Object.entries(dashboard.summary).forEach(([name, stats]) => {
    if (stats) {
      const budget = dashboard.budgetStatus.find(b => b.metric === name);
      report += `### ${name}\n`;
      report += `- Status: ${budget?.status === 'pass' ? '✅ Pass' : '❌ Fail'}\n`;
      report += `- Average: ${formatMetricValue(name as MetricName, stats.average)}\n`;
      report += `- P95: ${formatMetricValue(name as MetricName, stats.p95)}\n`;
      report += `- Budget: ${formatMetricValue(name as MetricName, budget?.budget || 0)}\n\n`;
    }
  });

  report += '## Resource Summary\n\n';
  Object.entries(resources).forEach(([type, data]) => {
    report += `### ${type}\n`;
    report += `- Count: ${data.count}\n`;
    report += `- Total Size: ${(data.totalSize / 1024).toFixed(2)} KB\n`;
    report += `- Avg Duration: ${(data.totalDuration / data.count).toFixed(2)}ms\n`;
    report += `- Cached: ${data.cached}/${data.count}\n\n`;
  });

  return report;
}
