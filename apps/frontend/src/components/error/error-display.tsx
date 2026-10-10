/**
 * Error Display Components
 * 
 * Reusable components for displaying errors in different contexts.
 */

'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors/error-messages';
import type { ApiError } from '@/lib/api/http-client';

// ============================================================================
// Types
// ============================================================================

export interface ErrorDisplayProps {
  error: Error | ApiError | string | null;
  title?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export interface InlineErrorProps {
  message: string;
  className?: string;
}

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// ============================================================================
// Error Display Component
// ============================================================================

/**
 * Error Display
 * 
 * Full error display with optional retry button.
 * 
 * @example
 * ```tsx
 * <ErrorDisplay 
 *   error={error} 
 *   onRetry={() => refetch()} 
 *   showRetry 
 * />
 * ```
 */
export function ErrorDisplay({
  error,
  title = 'Hata Oluştu',
  showRetry = false,
  onRetry,
  onDismiss,
  className,
}: ErrorDisplayProps) {
  if (!error) return null;

  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const errorCode = (errorObj as any).code;
  const statusCode = (errorObj as any).status || (errorObj as any).statusCode;
  const message = getErrorMessage(errorCode, statusCode);

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        {title}
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss} className="h-auto p-1">
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{message}</p>
        {showRetry && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tekrar Dene
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// ============================================================================
// Inline Error Component
// ============================================================================

/**
 * Inline Error
 * 
 * Small inline error message for forms and inputs.
 * 
 * @example
 * ```tsx
 * <InlineError message="Bu alan zorunludur" />
 * ```
 */
export function InlineError({ message, className }: InlineErrorProps) {
  if (!message) return null;

  return (
    <p className={`text-sm font-medium text-destructive ${className || ''}`}>
      {message}
    </p>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

/**
 * Empty State
 * 
 * Display when no data is available or error prevents loading.
 * 
 * @example
 * ```tsx
 * <EmptyState 
 *   title="Kullanıcı Bulunamadı"
 *   message="Arama kriterlerinize uygun kullanıcı bulunamadı."
 *   action={{ label: 'Yeni Kullanıcı Ekle', onClick: () => router.push('/users/new') }}
 * />
 * ```
 */
export function EmptyState({
  title = 'Veri Bulunamadı',
  message = 'Görüntülenecek veri bulunmuyor.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className || ''}`}>
      <div className="mb-4">
        {icon || <AlertCircle className="h-12 w-12 text-muted-foreground" />}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default ErrorDisplay;
