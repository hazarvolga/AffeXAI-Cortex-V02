/**
 * Bulk Operation Error Display Component
 * 
 * User-friendly error display with suggestions and recovery options
 */

'use client';

import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, HelpCircle, ExternalLink, X, ChevronDown, ChevronUp } from 'lucide-react';
import { BulkOperationError, BulkOperationErrorType, bulkOperationErrorHandler } from '@/lib/errors/bulk-operation-errors';
import { bulkOperationNotificationService } from '@/lib/notifications/bulk-operation-notifications';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface BulkOperationErrorDisplayProps {
  error: BulkOperationError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  showSuggestions?: boolean;
  className?: string;
}

interface ErrorSeverity {
  level: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

// ============================================================================
// Error Severity Configuration
// ============================================================================

const getErrorSeverity = (errorType: BulkOperationErrorType): ErrorSeverity => {
  const severityMap: Record<BulkOperationErrorType, ErrorSeverity> = {
    // Critical errors
    [BulkOperationErrorType.FILE_MALWARE_DETECTED]: {
      level: 'critical',
      color: 'text-red-800',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />
    },
    [BulkOperationErrorType.AUTHENTICATION_FAILED]: {
      level: 'critical',
      color: 'text-red-800',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />
    },
    [BulkOperationErrorType.PERMISSION_DENIED]: {
      level: 'critical',
      color: 'text-red-800',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />
    },

    // High severity errors
    [BulkOperationErrorType.FILE_CORRUPTED]: {
      level: 'high',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />
    },
    [BulkOperationErrorType.DATABASE_CONNECTION_FAILED]: {
      level: 'high',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />
    },
    [BulkOperationErrorType.MEMORY_LIMIT_EXCEEDED]: {
      level: 'high',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />
    },

    // Medium severity errors
    [BulkOperationErrorType.FILE_INVALID_FORMAT]: {
      level: 'medium',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />
    },
    [BulkOperationErrorType.FILE_TOO_LARGE]: {
      level: 'medium',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />
    },
    [BulkOperationErrorType.VALIDATION_PARTIAL_FAILURE]: {
      level: 'medium',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />
    },

    // Low severity errors (retryable)
    [BulkOperationErrorType.NETWORK_ERROR]: {
      level: 'low',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: <RefreshCw className="h-5 w-5 text-yellow-500" />
    },
    [BulkOperationErrorType.TIMEOUT_ERROR]: {
      level: 'low',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: <RefreshCw className="h-5 w-5 text-yellow-500" />
    },
    [BulkOperationErrorType.VALIDATION_SERVICE_UNAVAILABLE]: {
      level: 'low',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: <RefreshCw className="h-5 w-5 text-yellow-500" />
    },
    [BulkOperationErrorType.VALIDATION_RATE_LIMIT_EXCEEDED]: {
      level: 'low',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: <RefreshCw className="h-5 w-5 text-yellow-500" />
    },
    [BulkOperationErrorType.QUEUE_PROCESSING_FAILED]: {
      level: 'low',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: <RefreshCw className="h-5 w-5 text-yellow-500" />
    },

    // Default for unknown errors
    [BulkOperationErrorType.UNKNOWN_ERROR]: {
      level: 'medium',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: <HelpCircle className="h-5 w-5 text-gray-500" />
    },

    // Business logic errors
    [BulkOperationErrorType.BATCH_PROCESSING_FAILED]: {
      level: 'medium',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />
    },
    [BulkOperationErrorType.DUPLICATE_HANDLING_FAILED]: {
      level: 'medium',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />
    },
    [BulkOperationErrorType.SUBSCRIBER_CREATION_FAILED]: {
      level: 'medium',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />
    },
    [BulkOperationErrorType.GROUP_ASSIGNMENT_FAILED]: {
      level: 'medium',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />
    },
    [BulkOperationErrorType.VALIDATION_TIMEOUT]: {
      level: 'low',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: <RefreshCw className="h-5 w-5 text-yellow-500" />
    }
  };

  return severityMap[errorType] || severityMap[BulkOperationErrorType.UNKNOWN_ERROR];
};

// ============================================================================
// Main Component
// ============================================================================

export const BulkOperationErrorDisplay: React.FC<BulkOperationErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showDetails = true,
  showSuggestions = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const severity = getErrorSeverity(error.type);
  const userMessage = bulkOperationErrorHandler.getUserFriendlyMessage(error);
  const suggestions = bulkOperationNotificationService.getErrorSuggestions(error);

  const handleRetry = async () => {
    if (!onRetry || !error.retryable) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(timestamp);
  };

  return (
    <div className={`rounded-lg border ${severity.borderColor} ${severity.bgColor} p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {severity.icon}
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${severity.color}`}>
              {getErrorTitle(error.type)}
            </h3>
            <p className={`mt-1 text-sm ${severity.color}`}>
              {userMessage}
            </p>
            {error.timestamp && (
              <p className="mt-1 text-xs text-gray-500">
                Occurred at {formatTimestamp(error.timestamp)}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Retry button */}
          {error.retryable && onRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </>
              )}
            </button>
          )}

          {/* Expand/collapse button */}
          {(showDetails || showSuggestions) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="inline-flex items-center px-2 py-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Suggested solutions:
              </h4>
              <ul className="list-disc list-inside space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error details */}
          {showDetails && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Technical details:
              </h4>
              <div className="bg-gray-100 rounded p-3 text-xs font-mono">
                <div className="space-y-1">
                  <div><span className="font-semibold">Error Type:</span> {error.type}</div>
                  <div><span className="font-semibold">Retryable:</span> {error.retryable ? 'Yes' : 'No'}</div>
                  <div><span className="font-semibold">Recoverable:</span> {error.recoverable ? 'Yes' : 'No'}</div>
                  {error.batchIndex !== undefined && (
                    <div><span className="font-semibold">Batch Index:</span> {error.batchIndex}</div>
                  )}
                  {error.recordIndex !== undefined && (
                    <div><span className="font-semibold">Record Index:</span> {error.recordIndex}</div>
                  )}
                  {error.email && (
                    <div><span className="font-semibold">Email:</span> {error.email}</div>
                  )}
                  {error.details && (
                    <div>
                      <span className="font-semibold">Details:</span>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {typeof error.details === 'string' 
                          ? error.details 
                          : JSON.stringify(error.details, null, 2)
                        }
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Help links */}
          <div className="flex items-center space-x-4 text-sm">
            <a
              href="/admin/support"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Get Help
            </a>
            <a
              href="/docs/bulk-operations"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Documentation
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

const getErrorTitle = (errorType: BulkOperationErrorType): string => {
  const titles: Record<BulkOperationErrorType, string> = {
    [BulkOperationErrorType.FILE_INVALID_FORMAT]: 'Invalid File Format',
    [BulkOperationErrorType.FILE_TOO_LARGE]: 'File Too Large',
    [BulkOperationErrorType.FILE_CORRUPTED]: 'File Corrupted',
    [BulkOperationErrorType.FILE_MALWARE_DETECTED]: 'Security Threat Detected',
    
    [BulkOperationErrorType.VALIDATION_SERVICE_UNAVAILABLE]: 'Validation Service Unavailable',
    [BulkOperationErrorType.VALIDATION_RATE_LIMIT_EXCEEDED]: 'Rate Limit Exceeded',
    [BulkOperationErrorType.VALIDATION_TIMEOUT]: 'Validation Timeout',
    [BulkOperationErrorType.VALIDATION_PARTIAL_FAILURE]: 'Validation Issues',
    
    [BulkOperationErrorType.BATCH_PROCESSING_FAILED]: 'Processing Failed',
    [BulkOperationErrorType.QUEUE_PROCESSING_FAILED]: 'Queue Processing Error',
    [BulkOperationErrorType.DATABASE_CONNECTION_FAILED]: 'Database Error',
    [BulkOperationErrorType.MEMORY_LIMIT_EXCEEDED]: 'Memory Limit Exceeded',
    
    [BulkOperationErrorType.NETWORK_ERROR]: 'Network Error',
    [BulkOperationErrorType.TIMEOUT_ERROR]: 'Request Timeout',
    [BulkOperationErrorType.AUTHENTICATION_FAILED]: 'Authentication Failed',
    [BulkOperationErrorType.PERMISSION_DENIED]: 'Access Denied',
    
    [BulkOperationErrorType.DUPLICATE_HANDLING_FAILED]: 'Duplicate Handling Error',
    [BulkOperationErrorType.SUBSCRIBER_CREATION_FAILED]: 'Subscriber Creation Failed',
    [BulkOperationErrorType.GROUP_ASSIGNMENT_FAILED]: 'Group Assignment Failed',
    
    [BulkOperationErrorType.UNKNOWN_ERROR]: 'Unknown Error'
  };

  return titles[errorType] || 'Error';
};

export default BulkOperationErrorDisplay;