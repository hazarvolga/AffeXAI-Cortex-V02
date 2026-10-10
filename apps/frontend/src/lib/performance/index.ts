/**
 * Performance Module
 * 
 * Web Vitals tracking, performance monitoring, and metrics collection.
 */

// Web Vitals
export {
  reportWebVitals,
  getAllWebVitals,
  performanceMonitor,
  PerformanceMonitor,
  getMetricRating,
  formatMetricValue,
  PERFORMANCE_BUDGETS,
} from './web-vitals';

export type { MetricName, MetricRating } from './web-vitals';

// Metrics
export {
  metricsStore,
  getDashboardData,
  logPerformanceSummary,
  getResourceTimings,
  getResourceSummary,
  generatePerformanceReport,
} from './metrics';

export type { DashboardData, ResourceTiming } from './metrics';
