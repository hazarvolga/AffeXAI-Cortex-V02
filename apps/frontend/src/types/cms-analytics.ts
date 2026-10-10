/**
 * CMS Analytics System - Type Definitions
 *
 * Implements comprehensive component-level analytics tracking:
 * - User interaction tracking (clicks, hovers, scrolls)
 * - Heatmap data collection
 * - Session recording
 * - A/B testing support
 * - Conversion tracking
 * - Performance metrics
 */

/**
 * Interaction Types
 */
export type InteractionType =
  | 'click'
  | 'hover'
  | 'scroll'
  | 'focus'
  | 'input'
  | 'submit'
  | 'view'
  | 'exit';

/**
 * Component Interaction Event
 */
export interface ComponentInteraction {
  /** Unique event ID */
  id: string;

  /** Component/block ID that was interacted with */
  componentId: string;

  /** Type of component */
  componentType: string;

  /** Type of interaction */
  interactionType: InteractionType;

  /** Timestamp of interaction */
  timestamp: Date;

  /** Session ID */
  sessionId: string;

  /** User ID (if authenticated) */
  userId?: string;

  /** Page URL where interaction occurred */
  pageUrl: string;

  /** Device type */
  deviceType: 'mobile' | 'tablet' | 'desktop';

  /** Browser information */
  browser?: string;

  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };

  /** Interaction coordinates (for clicks, hovers) */
  coordinates?: {
    x: number;
    y: number;
    relativeX: number; // Relative to component
    relativeY: number; // Relative to component
  };

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Heatmap Data Point
 */
export interface HeatmapPoint {
  /** X coordinate */
  x: number;

  /** Y coordinate */
  y: number;

  /** Intensity/weight (number of interactions) */
  intensity: number;

  /** Interaction type */
  type: InteractionType;
}

/**
 * Component Heatmap Data
 */
export interface ComponentHeatmap {
  /** Component/block ID */
  componentId: string;

  /** Component type */
  componentType: string;

  /** Page URL */
  pageUrl: string;

  /** Collection period */
  period: {
    start: Date;
    end: Date;
  };

  /** Heatmap data points */
  points: HeatmapPoint[];

  /** Component dimensions */
  dimensions: {
    width: number;
    height: number;
  };

  /** Total interactions */
  totalInteractions: number;

  /** Unique users */
  uniqueUsers: number;
}

/**
 * Session Recording Event
 */
export interface SessionEvent {
  /** Event ID */
  id: string;

  /** Session ID */
  sessionId: string;

  /** Timestamp */
  timestamp: Date;

  /** Event type */
  type: 'navigation' | 'interaction' | 'mutation' | 'scroll' | 'resize';

  /** Event data */
  data: any;
}

/**
 * User Session
 */
export interface UserSession {
  /** Session ID */
  id: string;

  /** User ID (if authenticated) */
  userId?: string;

  /** Session start time */
  startTime: Date;

  /** Session end time */
  endTime?: Date;

  /** Duration in milliseconds */
  duration?: number;

  /** Pages visited */
  pagesVisited: string[];

  /** Total interactions */
  totalInteractions: number;

  /** Device information */
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os: string;
  };

  /** Session events (for recording) */
  events?: SessionEvent[];

  /** Conversion achieved */
  converted?: boolean;

  /** Conversion goal */
  conversionGoal?: string;
}

/**
 * Component Performance Metrics
 */
export interface ComponentPerformance {
  /** Component ID */
  componentId: string;

  /** Component type */
  componentType: string;

  /** Page URL */
  pageUrl: string;

  /** Measurement period */
  period: {
    start: Date;
    end: Date;
  };

  /** Render time (ms) */
  renderTime: {
    average: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  };

  /** Time to interactive (ms) */
  timeToInteractive?: {
    average: number;
    min: number;
    max: number;
  };

  /** Error rate */
  errorRate: number;

  /** Total renders */
  totalRenders: number;
}

/**
 * A/B Test Variant
 */
export interface ABTestVariant {
  /** Variant ID */
  id: string;

  /** Variant name */
  name: string;

  /** Variant description */
  description?: string;

  /** Component configuration for this variant */
  componentConfig: Record<string, any>;

  /** Traffic allocation (0-100) */
  trafficAllocation: number;

  /** Metrics */
  metrics: {
    impressions: number;
    interactions: number;
    conversions: number;
    conversionRate: number;
    averageEngagementTime: number;
  };
}

/**
 * A/B Test Configuration
 */
export interface ABTest {
  /** Test ID */
  id: string;

  /** Test name */
  name: string;

  /** Test description */
  description?: string;

  /** Component being tested */
  componentId: string;

  /** Component type */
  componentType: string;

  /** Test variants */
  variants: ABTestVariant[];

  /** Test status */
  status: 'draft' | 'running' | 'paused' | 'completed';

  /** Test period */
  period: {
    start: Date;
    end?: Date;
  };

  /** Target audience */
  targetAudience?: {
    countries?: string[];
    devices?: ('mobile' | 'tablet' | 'desktop')[];
    userSegments?: string[];
  };

  /** Conversion goal */
  conversionGoal: string;

  /** Statistical significance */
  statisticalSignificance?: {
    achieved: boolean;
    confidenceLevel: number; // 0-100
    sampleSize: number;
  };

  /** Winner variant (if test completed) */
  winnerVariantId?: string;
}

/**
 * Component Analytics Summary
 */
export interface ComponentAnalytics {
  /** Component ID */
  componentId: string;

  /** Component type */
  componentType: string;

  /** Page URL */
  pageUrl: string;

  /** Analysis period */
  period: {
    start: Date;
    end: Date;
  };

  /** Total views */
  totalViews: number;

  /** Unique viewers */
  uniqueViewers: number;

  /** Total interactions */
  totalInteractions: number;

  /** Interaction rate (interactions / views) */
  interactionRate: number;

  /** Average engagement time (ms) */
  averageEngagementTime: number;

  /** Bounce rate (users who didn't interact) */
  bounceRate: number;

  /** Conversions (if applicable) */
  conversions?: number;

  /** Conversion rate */
  conversionRate?: number;

  /** Top interaction types */
  topInteractions: Array<{
    type: InteractionType;
    count: number;
    percentage: number;
  }>;

  /** Device breakdown */
  deviceBreakdown: {
    mobile: number;
    tablet: number;
    desktop: number;
  };

  /** Performance metrics */
  performance?: ComponentPerformance;

  /** Active A/B tests */
  activeTests?: ABTest[];
}

/**
 * Analytics Time Range
 */
export type AnalyticsTimeRange =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'custom';

/**
 * Analytics Filter Options
 */
export interface AnalyticsFilters {
  /** Time range */
  timeRange: AnalyticsTimeRange;

  /** Custom date range (if timeRange is 'custom') */
  customRange?: {
    start: Date;
    end: Date;
  };

  /** Filter by page URL */
  pageUrl?: string;

  /** Filter by component type */
  componentType?: string;

  /** Filter by device type */
  deviceType?: ('mobile' | 'tablet' | 'desktop')[];

  /** Filter by user segment */
  userSegment?: string;

  /** Include A/B test data */
  includeABTests?: boolean;
}

/**
 * Analytics Dashboard Data
 */
export interface AnalyticsDashboard {
  /** Overall statistics */
  overview: {
    totalViews: number;
    totalInteractions: number;
    averageEngagementTime: number;
    conversionRate: number;
    changeFromPrevious: {
      views: number;
      interactions: number;
      engagementTime: number;
      conversionRate: number;
    };
  };

  /** Top performing components */
  topComponents: Array<{
    componentId: string;
    componentType: string;
    pageUrl: string;
    interactionRate: number;
    conversions: number;
  }>;

  /** Interaction timeline */
  timeline: Array<{
    timestamp: Date;
    views: number;
    interactions: number;
    conversions: number;
  }>;

  /** Device distribution */
  deviceDistribution: {
    mobile: number;
    tablet: number;
    desktop: number;
  };

  /** Active A/B tests */
  activeTests: ABTest[];

  /** Recent sessions */
  recentSessions: UserSession[];
}

/**
 * Analytics Export Format
 */
export type AnalyticsExportFormat = 'json' | 'csv' | 'xlsx';

/**
 * Analytics Export Options
 */
export interface AnalyticsExportOptions {
  /** Export format */
  format: AnalyticsExportFormat;

  /** Include raw event data */
  includeRawEvents?: boolean;

  /** Include heatmap data */
  includeHeatmaps?: boolean;

  /** Include session recordings */
  includeSessionRecordings?: boolean;

  /** Date range */
  dateRange: {
    start: Date;
    end: Date;
  };

  /** Component filters */
  componentIds?: string[];

  /** Page filters */
  pageUrls?: string[];
}
