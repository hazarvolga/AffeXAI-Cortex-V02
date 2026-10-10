/**
 * CMS Analytics Tracker
 *
 * Core tracking system for component-level analytics:
 * - Event collection and buffering
 * - Session management
 * - Heatmap data aggregation
 * - Performance monitoring
 */

import type {
  ComponentInteraction,
  InteractionType,
  UserSession,
  SessionEvent,
  HeatmapPoint,
  ComponentHeatmap,
  ComponentPerformance,
} from '@/types/cms-analytics';
import { cmsAnalyticsService } from '@/lib/api/cmsAnalyticsService';
import type { BatchTrackEventsDto } from '@/lib/api/cmsAnalyticsService';

/**
 * Analytics Tracker Configuration
 */
export interface AnalyticsTrackerConfig {
  /** Enable tracking */
  enabled: boolean;

  /** Buffer size before sending to server */
  bufferSize: number;

  /** Buffer timeout (ms) */
  bufferTimeout: number;

  /** Enable session recording */
  enableSessionRecording: boolean;

  /** Enable heatmap tracking */
  enableHeatmaps: boolean;

  /** Enable performance monitoring */
  enablePerformanceMonitoring: boolean;

  /** Sample rate (0-1, for performance) */
  sampleRate: number;

  /** API endpoint for sending events */
  apiEndpoint: string;

  /** Exclude tracking for certain components */
  excludeComponents?: string[];

  /** Privacy mode (anonymize data) */
  privacyMode: boolean;
}

/**
 * Default configuration
 */
const defaultConfig: AnalyticsTrackerConfig = {
  enabled: true,
  bufferSize: 50,
  bufferTimeout: 5000,
  enableSessionRecording: false,
  enableHeatmaps: true,
  enablePerformanceMonitoring: true,
  sampleRate: 1.0,
  apiEndpoint: '/api/cms-analytics',
  privacyMode: false,
};

/**
 * Analytics Tracker Class
 */
export class AnalyticsTracker {
  private config: AnalyticsTrackerConfig;
  private eventBuffer: ComponentInteraction[] = [];
  private sessionId: string;
  private sessionStartTime: Date;
  private currentSession: UserSession | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private bufferTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<AnalyticsTrackerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();

    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize tracker
   */
  private initialize(): void {
    // Start session
    this.startSession();

    // Setup buffer timer
    this.setupBufferTimer();

    // Setup performance monitoring
    if (this.config.enablePerformanceMonitoring && typeof window !== 'undefined') {
      this.setupPerformanceMonitoring();
    }

    // Setup page visibility listener
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    // Setup beforeunload listener
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }
  }

  /**
   * Start new session
   */
  private startSession(): void {
    this.currentSession = {
      id: this.sessionId,
      startTime: this.sessionStartTime,
      pagesVisited: [window.location.href],
      totalInteractions: 0,
      device: this.getDeviceInfo(),
    };
  }

  /**
   * Track component interaction
   */
  public trackInteraction(
    componentId: string,
    componentType: string,
    interactionType: InteractionType,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enabled) return;
    if (this.config.excludeComponents?.includes(componentId)) return;
    if (Math.random() > this.config.sampleRate) return;

    const interaction: ComponentInteraction = {
      id: this.generateEventId(),
      componentId,
      componentType,
      interactionType,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.getUserId(),
      pageUrl: window.location.href,
      deviceType: this.getDeviceType(),
      browser: this.getBrowser(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      metadata: this.config.privacyMode ? this.anonymizeMetadata(metadata) : metadata,
    };

    // Add to buffer
    this.eventBuffer.push(interaction);

    // Update session
    if (this.currentSession) {
      this.currentSession.totalInteractions++;
    }

    // Check if buffer is full
    if (this.eventBuffer.length >= this.config.bufferSize) {
      this.flushBuffer();
    }
  }

  /**
   * Track click with coordinates
   */
  public trackClick(
    componentId: string,
    componentType: string,
    event: MouseEvent,
    metadata?: Record<string, any>
  ): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    const interaction: ComponentInteraction = {
      id: this.generateEventId(),
      componentId,
      componentType,
      interactionType: 'click',
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.getUserId(),
      pageUrl: window.location.href,
      deviceType: this.getDeviceType(),
      browser: this.getBrowser(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      coordinates: {
        x: event.clientX,
        y: event.clientY,
        relativeX: event.clientX - rect.left,
        relativeY: event.clientY - rect.top,
      },
      metadata: this.config.privacyMode ? this.anonymizeMetadata(metadata) : metadata,
    };

    this.eventBuffer.push(interaction);

    if (this.currentSession) {
      this.currentSession.totalInteractions++;
    }

    if (this.eventBuffer.length >= this.config.bufferSize) {
      this.flushBuffer();
    }
  }

  /**
   * Track component view (impression)
   */
  public trackView(componentId: string, componentType: string): void {
    this.trackInteraction(componentId, componentType, 'view');
  }

  /**
   * Track component hover
   */
  public trackHover(
    componentId: string,
    componentType: string,
    event: MouseEvent
  ): void {
    this.trackClick(componentId, componentType, event, { type: 'hover' });
  }

  /**
   * Track scroll depth
   */
  public trackScroll(
    componentId: string,
    componentType: string,
    scrollDepth: number
  ): void {
    this.trackInteraction(componentId, componentType, 'scroll', { scrollDepth });
  }

  /**
   * Track conversion
   */
  public trackConversion(
    componentId: string,
    componentType: string,
    conversionGoal: string,
    value?: number
  ): void {
    this.trackInteraction(componentId, componentType, 'submit', {
      conversion: true,
      conversionGoal,
      value,
    });

    if (this.currentSession) {
      this.currentSession.converted = true;
      this.currentSession.conversionGoal = conversionGoal;
    }
  }

  /**
   * Flush event buffer to server
   */
  public async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // Transform events to match API DTO format
      const batchDto: BatchTrackEventsDto = {
        events: events.map(event => ({
          componentId: event.componentId,
          componentType: event.componentType,
          interactionType: event.interactionType,
          sessionId: event.sessionId,
          userId: event.userId,
          pageUrl: event.pageUrl,
          deviceType: event.deviceType,
          browser: event.browser,
          viewport: event.viewport,
          coordinates: event.coordinates,
          metadata: event.metadata,
        } as any)),
        session: this.currentSession ? {
          id: this.currentSession.id,
          startTime: this.currentSession.startTime.toISOString(),
          deviceType: this.currentSession.device.type as any,
          browser: this.currentSession.device.browser || 'Unknown',
          os: this.currentSession.device.os || 'Unknown',
          userId: this.getUserId() as any,
        } : undefined,
      };

      await cmsAnalyticsService.trackEventsBatch(batchDto);
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-add events to buffer if send fails
      this.eventBuffer.unshift(...events);
    }
  }

  /**
   * Setup buffer timer
   */
  private setupBufferTimer(): void {
    this.bufferTimer = setInterval(() => {
      this.flushBuffer();
    }, this.config.bufferTimeout);
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!window.PerformanceObserver) return;

    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          // Track component render time
          this.trackPerformance(entry);
        }
      }
    });

    this.performanceObserver.observe({ entryTypes: ['measure'] });
  }

  /**
   * Track performance metric
   */
  private trackPerformance(entry: PerformanceEntry): void {
    // Extract component ID from mark name
    const match = entry.name.match(/component-render-(.*)/);
    if (!match) return;

    const componentId = match[1];

    this.trackInteraction(componentId, 'unknown', 'view', {
      performanceMetric: {
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
      },
    });
  }

  /**
   * Handle visibility change
   */
  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      // Flush buffer when page becomes hidden
      this.flushBuffer();
    }
  };

  /**
   * Handle before unload
   */
  private handleBeforeUnload = (): void => {
    // End session
    if (this.currentSession) {
      this.currentSession.endTime = new Date();
      this.currentSession.duration =
        this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
    }

    // Flush buffer
    this.flushBuffer();
  };

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user ID (if authenticated)
   */
  private getUserId(): string | undefined {
    // Check if user is authenticated
    // This should integrate with your auth system
    if (typeof window !== 'undefined') {
      // Example: get from localStorage or cookie
      return localStorage.getItem('userId') || undefined;
    }
    return undefined;
  }

  /**
   * Get device type
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Get browser information
   */
  private getBrowser(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    return navigator.userAgent;
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): UserSession['device'] {
    return {
      type: this.getDeviceType(),
      browser: this.getBrowser(),
      os: this.getOS(),
    };
  }

  /**
   * Get operating system
   */
  private getOS(): string {
    if (typeof navigator === 'undefined') return 'unknown';

    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Win') !== -1) return 'Windows';
    if (userAgent.indexOf('Mac') !== -1) return 'macOS';
    if (userAgent.indexOf('Linux') !== -1) return 'Linux';
    if (userAgent.indexOf('Android') !== -1) return 'Android';
    if (userAgent.indexOf('iOS') !== -1) return 'iOS';
    return 'unknown';
  }

  /**
   * Anonymize metadata for privacy
   */
  private anonymizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;

    // Remove sensitive fields
    const { email, phone, name, address, ...safe } = metadata;
    return safe;
  }

  /**
   * Destroy tracker
   */
  public destroy(): void {
    // Flush remaining events
    this.flushBuffer();

    // Clear buffer timer
    if (this.bufferTimer) {
      clearInterval(this.bufferTimer);
    }

    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    // Remove event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }
  }
}

/**
 * Global tracker instance
 */
let globalTracker: AnalyticsTracker | null = null;

/**
 * Initialize global analytics tracker
 */
export function initializeAnalytics(
  config: Partial<AnalyticsTrackerConfig> = {}
): AnalyticsTracker {
  if (globalTracker) {
    globalTracker.destroy();
  }

  globalTracker = new AnalyticsTracker(config);
  return globalTracker;
}

/**
 * Get global tracker instance
 */
export function getAnalytics(): AnalyticsTracker | null {
  return globalTracker;
}

/**
 * Destroy global tracker
 */
export function destroyAnalytics(): void {
  if (globalTracker) {
    globalTracker.destroy();
    globalTracker = null;
  }
}
