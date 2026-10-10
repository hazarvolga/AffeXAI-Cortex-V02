/**
 * CMS Analytics React Hooks
 *
 * Easy-to-use hooks for component analytics tracking:
 * - useAnalyticsTracker: Track interactions
 * - useComponentView: Auto-track views
 * - useHeatmap: Track click heatmaps
 * - useABTest: A/B test variant selection
 */

import { useEffect, useRef, useCallback } from 'react';
import { getAnalytics } from '@/lib/cms/analytics-tracker';
import type { InteractionType, ABTest, ABTestVariant } from '@/types/cms-analytics';

/**
 * Hook to track component interactions
 */
export function useAnalyticsTracker(componentId: string, componentType: string) {
  const tracker = getAnalytics();

  const trackInteraction = useCallback(
    (interactionType: InteractionType, metadata?: Record<string, any>) => {
      if (!tracker) return;
      tracker.trackInteraction(componentId, componentType, interactionType, metadata);
    },
    [tracker, componentId, componentType]
  );

  const trackClick = useCallback(
    (event: MouseEvent, metadata?: Record<string, any>) => {
      if (!tracker) return;
      tracker.trackClick(componentId, componentType, event, metadata);
    },
    [tracker, componentId, componentType]
  );

  const trackView = useCallback(() => {
    if (!tracker) return;
    tracker.trackView(componentId, componentType);
  }, [tracker, componentId, componentType]);

  const trackHover = useCallback(
    (event: MouseEvent) => {
      if (!tracker) return;
      tracker.trackHover(componentId, componentType, event);
    },
    [tracker, componentId, componentType]
  );

  const trackScroll = useCallback(
    (scrollDepth: number) => {
      if (!tracker) return;
      tracker.trackScroll(componentId, componentType, scrollDepth);
    },
    [tracker, componentId, componentType]
  );

  const trackConversion = useCallback(
    (conversionGoal: string, value?: number) => {
      if (!tracker) return;
      tracker.trackConversion(componentId, componentType, conversionGoal, value);
    },
    [tracker, componentId, componentType]
  );

  return {
    trackInteraction,
    trackClick,
    trackView,
    trackHover,
    trackScroll,
    trackConversion,
  };
}

/**
 * Hook to auto-track component views using IntersectionObserver
 */
export function useComponentView(
  componentId: string,
  componentType: string,
  options?: IntersectionObserverInit
) {
  const elementRef = useRef<HTMLElement>(null);
  const hasTrackedRef = useRef(false);
  const { trackView } = useAnalyticsTracker(componentId, componentType);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedRef.current) {
            trackView();
            hasTrackedRef.current = true;
          }
        });
      },
      {
        threshold: 0.5, // Track when 50% visible
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [trackView, options]);

  return elementRef;
}

/**
 * Hook to track click heatmap
 */
export function useHeatmap(componentId: string, componentType: string) {
  const elementRef = useRef<HTMLElement>(null);
  const { trackClick } = useAnalyticsTracker(componentId, componentType);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleClick = (event: MouseEvent) => {
      trackClick(event);
    };

    element.addEventListener('click', handleClick);

    return () => {
      element.removeEventListener('click', handleClick);
    };
  }, [trackClick]);

  return elementRef;
}

/**
 * Hook for A/B test variant selection
 */
export function useABTest(testId: string, componentId: string): {
  variant: ABTestVariant | null;
  isLoading: boolean;
  trackImpression: () => void;
  trackConversion: (value?: number) => void;
} {
  const variantRef = useRef<ABTestVariant | null>(null);
  const hasTrackedImpressionRef = useRef(false);
  const tracker = getAnalytics();

  // In a real implementation, this would fetch the test from API
  // For now, we'll return a mock variant
  const variant = variantRef.current;
  const isLoading = false;

  const trackImpression = useCallback(() => {
    if (!tracker || !variant || hasTrackedImpressionRef.current) return;

    tracker.trackView(componentId, 'ab-test-variant');
    hasTrackedImpressionRef.current = true;
  }, [tracker, variant, componentId]);

  const trackConversion = useCallback(
    (value?: number) => {
      if (!tracker || !variant) return;

      tracker.trackConversion(
        componentId,
        'ab-test-variant',
        testId,
        value
      );
    },
    [tracker, variant, componentId, testId]
  );

  // Track impression on mount
  useEffect(() => {
    if (variant) {
      trackImpression();
    }
  }, [variant, trackImpression]);

  return {
    variant,
    isLoading,
    trackImpression,
    trackConversion,
  };
}

/**
 * Hook to track scroll depth
 */
export function useScrollDepth(componentId: string, componentType: string) {
  const elementRef = useRef<HTMLElement>(null);
  const maxScrollDepthRef = useRef(0);
  const { trackScroll } = useAnalyticsTracker(componentId, componentType);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const scrollDepth = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

      if (scrollDepth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = scrollDepth;

        // Track at 25%, 50%, 75%, 100% milestones
        const milestones = [0.25, 0.5, 0.75, 1.0];
        for (const milestone of milestones) {
          if (
            scrollDepth >= milestone &&
            maxScrollDepthRef.current >= milestone
          ) {
            trackScroll(milestone);
            break;
          }
        }
      }
    };

    element.addEventListener('scroll', handleScroll);

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [trackScroll]);

  return elementRef;
}

/**
 * Hook to track time on component
 */
export function useEngagementTime(componentId: string, componentType: string) {
  const startTimeRef = useRef<number>(Date.now());
  const { trackInteraction } = useAnalyticsTracker(componentId, componentType);

  useEffect(() => {
    return () => {
      // Track total engagement time on unmount
      const engagementTime = Date.now() - startTimeRef.current;
      trackInteraction('view', { engagementTime });
    };
  }, [trackInteraction]);
}

/**
 * Hook to track form interactions
 */
export function useFormAnalytics(
  formId: string,
  fields: string[]
): {
  trackFieldFocus: (fieldName: string) => void;
  trackFieldBlur: (fieldName: string) => void;
  trackFieldChange: (fieldName: string, value: any) => void;
  trackSubmit: (success: boolean, errors?: Record<string, string>) => void;
} {
  const { trackInteraction } = useAnalyticsTracker(formId, 'form');
  const fieldInteractionsRef = useRef<Record<string, number>>({});

  const trackFieldFocus = useCallback(
    (fieldName: string) => {
      trackInteraction('focus', { field: fieldName });
      fieldInteractionsRef.current[fieldName] =
        (fieldInteractionsRef.current[fieldName] || 0) + 1;
    },
    [trackInteraction]
  );

  const trackFieldBlur = useCallback(
    (fieldName: string) => {
      trackInteraction('input', { field: fieldName, action: 'blur' });
    },
    [trackInteraction]
  );

  const trackFieldChange = useCallback(
    (fieldName: string, value: any) => {
      trackInteraction('input', {
        field: fieldName,
        hasValue: Boolean(value),
        valueLength: typeof value === 'string' ? value.length : undefined,
      });
    },
    [trackInteraction]
  );

  const trackSubmit = useCallback(
    (success: boolean, errors?: Record<string, string>) => {
      trackInteraction('submit', {
        success,
        errorCount: errors ? Object.keys(errors).length : 0,
        fieldInteractions: fieldInteractionsRef.current,
      });
    },
    [trackInteraction]
  );

  return {
    trackFieldFocus,
    trackFieldBlur,
    trackFieldChange,
    trackSubmit,
  };
}

/**
 * Hook to track performance metrics
 */
export function usePerformanceTracking(componentId: string, componentType: string) {
  const { trackInteraction } = useAnalyticsTracker(componentId, componentType);
  const mountTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Track component mount time
    const mountDuration = Date.now() - mountTimeRef.current;

    // Use performance API if available
    if (typeof window.performance?.mark === 'function') {
      const markName = `component-mount-${componentId}`;
      performance.mark(markName);

      trackInteraction('view', {
        performanceMetric: {
          type: 'mount',
          duration: mountDuration,
          timestamp: Date.now(),
        },
      });
    }
  }, [componentId, trackInteraction]);

  const measureRender = useCallback(
    (renderName: string) => {
      if (!window.performance) return;

      const markName = `component-render-${componentId}-${renderName}`;
      performance.mark(markName);

      // Measure from previous mark if exists
      try {
        const measure = performance.measure(
          markName,
          `component-mount-${componentId}`,
          markName
        );

        trackInteraction('view', {
          performanceMetric: {
            type: 'render',
            name: renderName,
            duration: measure.duration,
            timestamp: Date.now(),
          },
        });
      } catch (error) {
        // Previous mark doesn't exist, ignore
      }
    },
    [componentId, trackInteraction]
  );

  return { measureRender };
}
