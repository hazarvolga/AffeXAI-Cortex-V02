'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/performance/web-vitals';
import { metricsStore } from '@/lib/performance/metrics';

/**
 * Web Vitals Reporter Component
 * 
 * Automatically tracks and reports Web Vitals metrics.
 * Add this component to your root layout to enable monitoring.
 * 
 * @example
 * ```tsx
 * // In app/layout.tsx
 * import { WebVitalsReporter } from '@/components/performance/web-vitals-reporter';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <WebVitalsReporter />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Dynamically import web-vitals to avoid including it in the main bundle
    import('web-vitals').then(({ onFCP, onLCP, onCLS, onTTFB, onINP }) => {
      // Track all Core Web Vitals
      onFCP((metric) => {
        reportWebVitals(metric);
        metricsStore.add('FCP', metric.value);
      });

      onLCP((metric) => {
        reportWebVitals(metric);
        metricsStore.add('LCP', metric.value);
      });

      onCLS((metric) => {
        reportWebVitals(metric);
        metricsStore.add('CLS', metric.value);
      });

      onTTFB((metric) => {
        reportWebVitals(metric);
        metricsStore.add('TTFB', metric.value);
      });

      onINP((metric) => {
        reportWebVitals(metric);
        metricsStore.add('INP', metric.value);
      });
      
      // Note: FID is deprecated in favor of INP in web-vitals v4
    });
  }, []);

  // This component doesn't render anything
  return null;
}
