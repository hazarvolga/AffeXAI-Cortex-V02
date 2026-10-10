/**
 * Web Vitals Tracking
 * 
 * Tracks Core Web Vitals and sends them to analytics.
 * Supports multiple analytics providers (console, Google Analytics, custom).
 */

import type { Metric } from 'web-vitals';

/**
 * Performance Metric Types
 */
export type MetricName = 
  | 'FCP'  // First Contentful Paint
  | 'LCP'  // Largest Contentful Paint
  | 'FID'  // First Input Delay (deprecated, use INP)
  | 'CLS'  // Cumulative Layout Shift
  | 'TTFB' // Time to First Byte
  | 'INP'; // Interaction to Next Paint

/**
 * Metric Rating (Good, Needs Improvement, Poor)
 */
export type MetricRating = 'good' | 'needs-improvement' | 'poor';

/**
 * Performance Budget Thresholds
 * Based on Core Web Vitals recommendations
 */
export const PERFORMANCE_BUDGETS = {
  FCP: {
    good: 1800,      // < 1.8s
    poor: 3000,      // > 3.0s
  },
  LCP: {
    good: 2500,      // < 2.5s
    poor: 4000,      // > 4.0s
  },
  FID: {
    good: 100,       // < 100ms
    poor: 300,       // > 300ms
  },
  INP: {
    good: 200,       // < 200ms
    poor: 500,       // > 500ms
  },
  CLS: {
    good: 0.1,       // < 0.1
    poor: 0.25,      // > 0.25
  },
  TTFB: {
    good: 800,       // < 800ms
    poor: 1800,      // > 1800ms
  },
} as const;

/**
 * Get metric rating based on value
 */
export function getMetricRating(name: MetricName, value: number): MetricRating {
  const budget = PERFORMANCE_BUDGETS[name];
  
  if (value <= budget.good) {
    return 'good';
  } else if (value <= budget.poor) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

/**
 * Format metric value for display
 */
export function formatMetricValue(name: MetricName, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * Analytics Providers
 */
interface AnalyticsProvider {
  name: string;
  send: (metric: Metric) => void;
}

/**
 * Console Logger (Development)
 */
const consoleProvider: AnalyticsProvider = {
  name: 'console',
  send: (metric) => {
    const rating = getMetricRating(metric.name as MetricName, metric.value);
    const formatted = formatMetricValue(metric.name as MetricName, metric.value);
    
    console.group(`📊 Web Vital: ${metric.name}`);
    console.log('Value:', formatted);
    console.log('Rating:', rating);
    console.log('ID:', metric.id);
    console.log('Navigation Type:', metric.navigationType);
    console.groupEnd();
  },
};

/**
 * Google Analytics Provider
 */
const googleAnalyticsProvider: AnalyticsProvider = {
  name: 'google-analytics',
  send: (metric) => {
    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: getMetricRating(metric.name as MetricName, metric.value),
      });
    }
  },
};

/**
 * Custom Analytics Provider
 * Send to your own analytics endpoint
 */
const customProvider: AnalyticsProvider = {
  name: 'custom',
  send: async (metric) => {
    try {
      await fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: getMetricRating(metric.name as MetricName, metric.value),
          id: metric.id,
          delta: metric.delta,
          navigationType: metric.navigationType,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to send metric:', error);
    }
  },
};

/**
 * Active Providers
 * Configure which providers to use based on environment
 */
const activeProviders: AnalyticsProvider[] = [
  // Always use console in development
  ...(process.env.NODE_ENV === 'development' ? [consoleProvider] : []),
  
  // Use Google Analytics in production if available
  ...(process.env.NEXT_PUBLIC_GA_ID ? [googleAnalyticsProvider] : []),
  
  // Use custom analytics if endpoint is configured
  ...(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT ? [customProvider] : []),
];

/**
 * Report Web Vitals
 * 
 * This function is called by Next.js for each web vital metric.
 * It sends the metrics to all configured analytics providers.
 * 
 * @example
 * ```tsx
 * // In app/layout.tsx (App Router) or pages/_app.tsx (Pages Router)
 * export { reportWebVitals } from '@/lib/performance/web-vitals';
 * ```
 */
export function reportWebVitals(metric: Metric) {
  // Send to all active providers
  activeProviders.forEach(provider => {
    try {
      provider.send(metric);
    } catch (error) {
      console.error(`Failed to send metric to ${provider.name}:`, error);
    }
  });

  // Check if metric exceeds budget
  const rating = getMetricRating(metric.name as MetricName, metric.value);
  if (rating === 'poor') {
    console.warn(
      `⚠️ Performance Budget Exceeded: ${metric.name} = ${formatMetricValue(metric.name as MetricName, metric.value)} (${rating})`
    );
  }
}

/**
 * Get all Web Vitals
 * Manually trigger collection of all metrics
 * 
 * @example
 * ```ts
 * import { getAllWebVitals } from '@/lib/performance/web-vitals';
 * 
 * const metrics = await getAllWebVitals();
 * console.log('Current metrics:', metrics);
 * ```
 */
export async function getAllWebVitals(): Promise<Record<MetricName, number | null>> {
  const metrics: Record<MetricName, number | null> = {
    FCP: null,
    LCP: null,
    FID: null,
    CLS: null,
    TTFB: null,
    INP: null,
  };

  if (typeof window === 'undefined') {
    return metrics;
  }

  try {
    const { onFCP, onLCP, onCLS, onTTFB, onINP } = await import('web-vitals');

    await Promise.all([
      new Promise<void>(resolve => onFCP((m: any) => { metrics.FCP = m.value; resolve(); })),
      new Promise<void>(resolve => onLCP((m: any) => { metrics.LCP = m.value; resolve(); })),
      new Promise<void>(resolve => onCLS((m: any) => { metrics.CLS = m.value; resolve(); })),
      new Promise<void>(resolve => onTTFB((m: any) => { metrics.TTFB = m.value; resolve(); })),
      new Promise<void>(resolve => onINP((m: any) => { metrics.INP = m.value; resolve(); })),
    ]);
  } catch (error) {
    console.error('Failed to collect web vitals:', error);
  }

  return metrics;
}

/**
 * Performance Observer for Custom Metrics
 * Track custom performance marks and measures
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  /**
   * Mark a performance point
   * 
   * @example
   * ```ts
   * const monitor = new PerformanceMonitor();
   * monitor.mark('data-fetch-start');
   * // ... fetch data
   * monitor.mark('data-fetch-end');
   * const duration = monitor.measure('data-fetch', 'data-fetch-start', 'data-fetch-end');
   * ```
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
    performance.mark(name);
  }

  /**
   * Measure duration between two marks
   */
  measure(name: string, startMark: string, endMark: string): number {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (start === undefined || end === undefined) {
      console.warn(`Missing marks for measurement: ${name}`);
      return 0;
    }

    const duration = end - start;
    performance.measure(name, startMark, endMark);

    return duration;
  }

  /**
   * Get all measurements
   */
  getMeasures(): PerformanceMeasure[] {
    return performance.getEntriesByType('measure') as PerformanceMeasure[];
  }

  /**
   * Clear all marks and measures
   */
  clear(): void {
    this.marks.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();
