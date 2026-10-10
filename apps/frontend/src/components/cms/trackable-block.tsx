"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { useAnalyticsTracker } from '@/hooks/useCMSAnalytics';
import type { BlockInstance } from '@/types/cms-template';

interface TrackableBlockProps {
  block: BlockInstance;
  pageId: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * TrackableBlock - Wrapper component for CMS blocks with analytics tracking
 * 
 * Features:
 * - Automatic view tracking when block enters viewport
 * - Click tracking for interactive elements
 * - Engagement time tracking
 * - Scroll depth tracking within block
 * - Component performance metrics
 * 
 * Usage:
 * ```tsx
 * <TrackableBlock block={blockInstance} pageId="home-page">
 *   <YourBlockComponent {...blockInstance.properties} />
 * </TrackableBlock>
 * ```
 */
export function TrackableBlock({ 
  block, 
  pageId, 
  children, 
  className 
}: TrackableBlockProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const { trackInteraction } = useAnalyticsTracker(block.id, block.type);
  const engagementStartRef = useRef<number | null>(null);
  const trackEvent = useCallback((event: {
    type: 'component_view' | 'button_click' | 'link_click' | 'cta_click' | 'scroll_depth';
    componentId: string; componentType: string; pageId: string;
    metadata: Record<string, unknown>;
  }) => {
    const interactionType = event.type === 'component_view' ? 'view' : event.type === 'scroll_depth' ? 'scroll' : 'click';
    trackInteraction(interactionType, { ...event.metadata, eventType: event.type, pageId: event.pageId });
  }, [trackInteraction]);
  const startEngagementTracking = useCallback(() => {
    engagementStartRef.current = Date.now();
  }, []);
  const stopEngagementTracking = useCallback(() => {
    if (engagementStartRef.current === null) return;
    trackInteraction('exit', { engagementTime: Date.now() - engagementStartRef.current, pageId });
    engagementStartRef.current = null;
  }, [pageId, trackInteraction]);
  const viewTrackedRef = useRef(false);
  const engagementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track block view when it enters viewport
  useEffect(() => {
    if (!blockRef.current || viewTrackedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !viewTrackedRef.current) {
            // Track view event
            trackEvent({
              type: 'component_view',
              componentId: block.id,
              componentType: block.type,
              pageId,
              metadata: {
                category: block.category,
                label: block.properties.label || block.type,
                variant: block.properties.variant || 'default',
                position: block.properties.position || 'unknown'
              }
            });

            viewTrackedRef.current = true;

            // Start engagement tracking after 2 seconds of visibility
            engagementTimerRef.current = setTimeout(() => {
              startEngagementTracking();
            }, 2000);
          } else if (!entry.isIntersecting && viewTrackedRef.current) {
            // Stop engagement tracking when block leaves viewport
            if (engagementTimerRef.current) {
              clearTimeout(engagementTimerRef.current);
            }
            stopEngagementTracking();
          }
        });
      },
      {
        threshold: 0.5, // Track when 50% of block is visible
        rootMargin: '0px'
      }
    );

    observer.observe(blockRef.current);

    return () => {
      observer.disconnect();
      if (engagementTimerRef.current) {
        clearTimeout(engagementTimerRef.current);
      }
      stopEngagementTracking();
    };
  }, [block.id, block.type, block.category, pageId, trackEvent, startEngagementTracking, stopEngagementTracking]);

  // Track clicks within the block
  const handleBlockClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const clickedElement = target.tagName.toLowerCase();
    
    // Track button clicks
    if (clickedElement === 'button' || target.closest('button')) {
      const button = target.closest('button');
      trackEvent({
        type: 'button_click',
        componentId: block.id,
        componentType: block.type,
        pageId,
        metadata: {
          buttonText: button?.textContent || 'unknown',
          buttonVariant: button?.getAttribute('data-variant') || 'default',
          category: block.category
        }
      });
    }

    // Track link clicks
    if (clickedElement === 'a' || target.closest('a')) {
      const link = target.closest('a');
      trackEvent({
        type: 'link_click',
        componentId: block.id,
        componentType: block.type,
        pageId,
        metadata: {
          linkText: link?.textContent || 'unknown',
          linkHref: link?.getAttribute('href') || 'unknown',
          category: block.category
        }
      });
    }

    // Track CTA interactions
    if (target.dataset.cta === 'true' || target.closest('[data-cta="true"]')) {
      trackEvent({
        type: 'cta_click',
        componentId: block.id,
        componentType: block.type,
        pageId,
        metadata: {
          ctaText: target.textContent || 'unknown',
          ctaType: target.dataset.ctaType || 'primary',
          category: block.category
        }
      });
    }
  };

  // Track scroll depth within block
  const handleScroll = () => {
    if (!blockRef.current) return;

    const element = blockRef.current;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    const scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    // Track at 25%, 50%, 75%, 100% milestones
    const milestones = [25, 50, 75, 100];
    milestones.forEach((milestone) => {
      if (scrollPercent >= milestone && !element.dataset[`scrolled${milestone}`]) {
        element.dataset[`scrolled${milestone}`] = 'true';
        trackEvent({
          type: 'scroll_depth',
          componentId: block.id,
          componentType: block.type,
          pageId,
          metadata: {
            depth: milestone,
            category: block.category
          }
        });
      }
    });
  };

  return (
    <div
      ref={blockRef}
      className={className}
      onClick={handleBlockClick}
      onScroll={handleScroll}
      data-block-id={block.id}
      data-block-type={block.type}
      data-trackable="true"
    >
      {children}
    </div>
  );
}

/**
 * withTracking - HOC to wrap any component with analytics tracking
 * 
 * Usage:
 * ```tsx
 * const TrackedHero = withTracking(HeroBlock);
 * <TrackedHero block={blockInstance} pageId="home" />
 * ```
 */
export function withTracking<P extends { block: BlockInstance; pageId: string }>(
  Component: React.ComponentType<P>
) {
  return function TrackedComponent(props: P) {
    return (
      <TrackableBlock block={props.block} pageId={props.pageId}>
        <Component {...props} />
      </TrackableBlock>
    );
  };
}
