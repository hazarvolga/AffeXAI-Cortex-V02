import { useEffect, useCallback } from 'react';
import { cmsMetricsService } from '@/lib/api/cmsMetricsService';

// Generate a visitor ID and store in localStorage
const getVisitorId = (): string => {
  if (typeof window === 'undefined') return '';

  let visitorId = localStorage.getItem('cms_visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('cms_visitor_id', visitorId);
  }
  return visitorId;
};

interface UsePageViewTrackingOptions {
  pageId: string;
  pageTitle: string;
  category?: string;
}

/**
 * Hook to track page views automatically
 */
export const usePageViewTracking = ({
  pageId,
  pageTitle,
  category,
}: UsePageViewTrackingOptions) => {
  useEffect(() => {
    if (!pageId) return;

    const trackPageView = async () => {
      try {
        await cmsMetricsService.trackPageView({
          pageId,
          pageTitle,
          category,
          visitorId: getVisitorId(),
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [pageId, pageTitle, category]);
};

/**
 * Hook to track link clicks
 */
export const useLinkClickTracking = (pageId?: string) => {
  const trackLinkClick = useCallback(
    async (linkUrl: string, linkText: string) => {
      try {
        await cmsMetricsService.trackLinkClick({
          linkUrl,
          linkText,
          pageId,
          visitorId: getVisitorId(),
        });
      } catch (error) {
        console.error('Failed to track link click:', error);
      }
    },
    [pageId]
  );

  return trackLinkClick;
};

/**
 * Hook to track CMS activities (edit, publish)
 */
export const useActivityTracking = () => {
  const trackActivity = useCallback(
    async (
      activityType: 'edit' | 'publish',
      pageId: string,
      pageTitle: string,
      category?: string
    ) => {
      try {
        await cmsMetricsService.trackActivity({
          activityType,
          pageId,
          pageTitle,
          category,
        });
      } catch (error) {
        console.error('Failed to track activity:', error);
      }
    },
    []
  );

  return trackActivity;
};
