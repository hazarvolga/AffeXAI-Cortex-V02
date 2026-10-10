'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton Base Component Props
 */
interface SkeletonProps {
  className?: string;
  /** Animation style */
  animation?: 'pulse' | 'wave' | 'none';
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

/**
 * Base Skeleton Component
 * 
 * Displays a loading placeholder with animation.
 * 
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-32" />
 * ```
 */
export function Skeleton({ 
  className, 
  animation = 'pulse',
  rounded = 'md',
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-muted',
        roundedClasses[rounded],
        animationClasses[animation],
        className
      )}
      role="status"
      aria-label="Yükleniyor"
    />
  );
}

/**
 * Text Skeleton
 * 
 * Skeleton for text lines with configurable width and lines.
 * 
 * @example
 * ```tsx
 * <SkeletonText lines={3} />
 * ```
 */
interface SkeletonTextProps {
  /** Number of lines */
  lines?: number;
  /** Width variation for natural look */
  variant?: 'default' | 'equal' | 'random';
  /** Gap between lines */
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SkeletonText({ 
  lines = 1, 
  variant = 'default',
  gap = 'md',
  className 
}: SkeletonTextProps) {
  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  };

  const getWidth = (index: number): string => {
    if (variant === 'equal') return 'w-full';
    if (variant === 'random') {
      const widths = ['w-full', 'w-11/12', 'w-10/12', 'w-9/12', 'w-8/12'];
      return widths[Math.floor(Math.random() * widths.length)];
    }
    // Default: last line is shorter
    return index === lines - 1 && lines > 1 ? 'w-4/5' : 'w-full';
  };

  return (
    <div className={cn('flex flex-col', gapClasses[gap], className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn('h-4', getWidth(index))} />
      ))}
    </div>
  );
}

/**
 * Card Skeleton
 * 
 * Skeleton for card components.
 * 
 * @example
 * ```tsx
 * <SkeletonCard />
 * ```
 */
interface SkeletonCardProps {
  /** Show image area */
  showImage?: boolean;
  /** Show avatar */
  showAvatar?: boolean;
  /** Number of text lines */
  textLines?: number;
  /** Show action buttons area */
  showActions?: boolean;
  className?: string;
}

export function SkeletonCard({
  showImage = true,
  showAvatar = false,
  textLines = 3,
  showActions = true,
  className,
}: SkeletonCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      {/* Image */}
      {showImage && <Skeleton className="mb-4 h-48 w-full" />}

      {/* Header with Avatar */}
      <div className="mb-3 flex items-center gap-3">
        {showAvatar && <Skeleton className="h-10 w-10" rounded="full" />}
        <div className="flex-1">
          <Skeleton className="mb-2 h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Text Lines */}
      <SkeletonText lines={textLines} className="mb-4" />

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      )}
    </div>
  );
}

/**
 * Table Skeleton
 * 
 * Skeleton for table components.
 * 
 * @example
 * ```tsx
 * <SkeletonTable rows={5} columns={4} />
 * ```
 */
interface SkeletonTableProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Show header row */
  showHeader?: boolean;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      {showHeader && (
        <div className="mb-2 flex gap-4 border-b pb-2">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 flex-1" />
          ))}
        </div>
      )}

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * List Skeleton
 * 
 * Skeleton for list components.
 * 
 * @example
 * ```tsx
 * <SkeletonList items={5} />
 * ```
 */
interface SkeletonListProps {
  /** Number of items */
  items?: number;
  /** Show avatar in items */
  showAvatar?: boolean;
  /** Show actions in items */
  showActions?: boolean;
  className?: string;
}

export function SkeletonList({
  items = 5,
  showAvatar = true,
  showActions = false,
  className,
}: SkeletonListProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
          {showAvatar && <Skeleton className="h-10 w-10" rounded="full" />}
          
          <div className="flex-1">
            <Skeleton className="mb-2 h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>

          {showActions && <Skeleton className="h-8 w-8" rounded="full" />}
        </div>
      ))}
    </div>
  );
}

/**
 * Form Skeleton
 * 
 * Skeleton for form components.
 * 
 * @example
 * ```tsx
 * <SkeletonForm fields={4} />
 * ```
 */
interface SkeletonFormProps {
  /** Number of form fields */
  fields?: number;
  /** Show submit button */
  showSubmit?: boolean;
  className?: string;
}

export function SkeletonForm({
  fields = 4,
  showSubmit = true,
  className,
}: SkeletonFormProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}

      {showSubmit && (
        <div className="mt-2 flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  );
}

/**
 * Avatar Group Skeleton
 * 
 * Skeleton for avatar groups.
 * 
 * @example
 * ```tsx
 * <SkeletonAvatarGroup count={3} />
 * ```
 */
interface SkeletonAvatarGroupProps {
  /** Number of avatars */
  count?: number;
  /** Avatar size */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SkeletonAvatarGroup({
  count = 3,
  size = 'md',
  className,
}: SkeletonAvatarGroupProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex -space-x-2', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton 
          key={index} 
          className={cn(sizes[size], 'border-2 border-background')} 
          rounded="full" 
        />
      ))}
    </div>
  );
}
