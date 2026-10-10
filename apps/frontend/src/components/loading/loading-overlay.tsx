'use client';

import React from 'react';
import { useLoadingContext } from '@/contexts/LoadingContext';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Loading Overlay Props
 */
interface LoadingOverlayProps {
  /** Show overlay only for specific loading ID */
  loadingId?: string;
  /** Custom loading message */
  message?: string;
  /** Show progress bar */
  showProgress?: boolean;
  /** Overlay blur effect */
  blur?: boolean;
  /** Custom className */
  className?: string;
  /** Custom spinner size */
  spinnerSize?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Loading Overlay Component
 * 
 * Displays a full-screen or container-level loading overlay with spinner and message.
 * Automatically shows/hides based on global loading state or specific loading ID.
 * 
 * @example
 * ```tsx
 * // Global loading overlay (shows when any loading is active)
 * <LoadingOverlay />
 * ```
 * 
 * @example
 * ```tsx
 * // Specific loading ID
 * <LoadingOverlay 
 *   loadingId="fetch-users" 
 *   message="Kullanıcılar yükleniyor..."
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // With progress bar
 * <LoadingOverlay 
 *   loadingId="upload-file" 
 *   showProgress 
 *   blur
 * />
 * ```
 */
export function LoadingOverlay({
  loadingId,
  message,
  showProgress = false,
  blur = true,
  className,
  spinnerSize = 'lg',
}: LoadingOverlayProps) {
  const { isLoading, isLoadingId, getLoadingState } = useLoadingContext();

  // Check if should show overlay
  const shouldShow = loadingId ? isLoadingId(loadingId) : isLoading;

  // Get loading state
  const loadingState = loadingId ? getLoadingState(loadingId) : undefined;

  // Get display message
  const displayMessage = message || loadingState?.message || 'Yükleniyor...';

  // Get progress
  const progress = loadingState?.progress;

  if (!shouldShow) {
    return null;
  }

  // Spinner sizes
  const spinnerSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300',
        !shouldShow && 'opacity-0 pointer-events-none',
        shouldShow && 'opacity-100 pointer-events-auto',
        blur && 'backdrop-blur-sm',
        'bg-background/80',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 rounded-lg bg-card p-8 shadow-lg">
        {/* Spinner */}
        <Loader2
          className={cn(
            'animate-spin text-primary',
            spinnerSizes[spinnerSize]
          )}
        />

        {/* Message */}
        <p className="text-center text-sm font-medium text-foreground">
          {displayMessage}
        </p>

        {/* Progress Bar */}
        {showProgress && typeof progress === 'number' && (
          <div className="w-64">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              %{Math.round(progress)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Inline Loading Spinner
 * 
 * Small loading spinner for inline use in buttons, cards, etc.
 * 
 * @example
 * ```tsx
 * <button disabled={isLoading}>
 *   {isLoading ? <LoadingSpinner /> : 'Kaydet'}
 * </button>
 * ```
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  className
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <Loader2
      className={cn(
        'animate-spin',
        sizes[size],
        className
      )}
    />
  );
}

/**
 * Container Loading Overlay
 * 
 * Loading overlay that covers a specific container instead of full screen.
 * Useful for loading specific sections of a page.
 * 
 * @example
 * ```tsx
 * <div className="relative">
 *   <ContainerLoadingOverlay isLoading={isLoading} message="Veriler yükleniyor..." />
 *   <YourContent />
 * </div>
 * ```
 */
interface ContainerLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  showProgress?: boolean;
  progress?: number;
  blur?: boolean;
  className?: string;
}

export function ContainerLoadingOverlay({
  isLoading,
  message = 'Yükleniyor...',
  showProgress = false,
  progress,
  blur = true,
  className,
}: ContainerLoadingOverlayProps) {
  if (!isLoading) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute inset-0 z-40 flex items-center justify-center',
        blur && 'backdrop-blur-sm',
        'bg-background/80',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 rounded-lg bg-card p-6 shadow-md">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">{message}</p>

        {showProgress && typeof progress === 'number' && (
          <div className="w-48">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              %{Math.round(progress)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
