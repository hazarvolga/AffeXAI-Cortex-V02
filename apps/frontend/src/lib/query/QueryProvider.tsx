'use client';

import React from 'react';
import { QueryClientProvider, HydrationBoundary, DehydratedState } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './query-client';

/**
 * Query Provider Props
 */
interface QueryProviderProps {
  children: React.ReactNode;
  /** Show React Query Devtools (default: only in development) */
  showDevtools?: boolean;
  /** Dehydrated state from SSR/SSG */
  dehydratedState?: DehydratedState;
}

/**
 * Query Provider Component
 * 
 * Wraps the application with TanStack Query provider and devtools.
 * Supports SSR/SSG hydration for optimal performance.
 * 
 * @example
 * ```tsx
 * // In app/layout.tsx
 * import { QueryProvider } from '@/lib/query';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <QueryProvider>
 *       {children}
 *     </QueryProvider>
 *   );
 * }
 * 
 * // With SSR hydration
 * export default function Page({ dehydratedState }) {
 *   return (
 *     <QueryProvider dehydratedState={dehydratedState}>
 *       {children}
 *     </QueryProvider>
 *   );
 * }
 * ```
 */
export function QueryProvider({
  children,
  showDevtools = process.env.NODE_ENV === 'development',
  dehydratedState,
}: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        {children}
      </HydrationBoundary>
      {showDevtools && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}
