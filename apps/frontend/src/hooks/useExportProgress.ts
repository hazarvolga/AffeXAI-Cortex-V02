import { useState, useEffect, useCallback } from 'react';
import bulkExportService, { ExportJob, ExportJobStatus } from '@/lib/api/bulkExportService';
import { useBulkOperationErrors } from './useBulkOperationErrors';

interface UseExportProgressOptions {
  jobId: string | null;
  userId: string;
  enabled?: boolean;
  onComplete?: (job: ExportJob) => void;
  onError?: (error: string) => void;
  pollInterval?: number;
}

interface UseExportProgressReturn {
  job: ExportJob | null;
  isLoading: boolean;
  error: string | null;
  isPolling: boolean;
  refetch: () => Promise<void>;
  // Enhanced error handling
  errorState: any;
  retryProgress: () => Promise<any>;
  clearError: () => void;
  canRetry: boolean;
}

export function useExportProgress({
  jobId,
  userId,
  enabled = true,
  onComplete,
  onError,
  pollInterval = 2000
}: UseExportProgressOptions): UseExportProgressReturn {
  const [job, setJob] = useState<ExportJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Enhanced error handling
  const { errorState, handleError, retryOperation, clearError } = useBulkOperationErrors(
    userId,
    jobId || undefined,
    'export',
    {
      maxRetries: 3,
      enableNotifications: true,
      enableLogging: true,
      onError: (error) => {
        setError(error.message);
        onError?.(error.message);
      }
    }
  );

  const fetchJobStatus = useCallback(async () => {
    if (!jobId || !enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      clearError(); // Clear any previous errors
      
      const jobData = await retryOperation(async () => {
        return await bulkExportService.getExportStatus(jobId);
      });
      
      setJob(jobData);

      // Check if job is complete or failed
      if (jobData.status === ExportJobStatus.COMPLETED) {
        setIsPolling(false);
        onComplete?.(jobData);
      } else if (jobData.status === ExportJobStatus.FAILED) {
        setIsPolling(false);
        const errorMessage = jobData.error || 'Export failed';
        handleError(new Error(errorMessage), { 
          operation: 'export_status_check',
          jobStatus: jobData.status 
        });
      }
    } catch (err) {
      handleError(err, { 
        operation: 'export_progress_fetch',
        jobId 
      });
      setIsPolling(false);
    } finally {
      setIsLoading(false);
    }
  }, [jobId, enabled, onComplete, retryOperation, handleError, clearError]);

  // Start polling when job is processing
  useEffect(() => {
    if (!jobId || !enabled) {
      setIsPolling(false);
      return;
    }

    // Initial fetch
    fetchJobStatus();

    // Start polling if job is processing
    if (job?.status === ExportJobStatus.PROCESSING || job?.status === ExportJobStatus.PENDING) {
      setIsPolling(true);
      const interval = setInterval(fetchJobStatus, pollInterval);
      
      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    }
  }, [jobId, enabled, job?.status, fetchJobStatus, pollInterval]);

  return {
    job,
    isLoading,
    error,
    isPolling,
    refetch: fetchJobStatus,
    // Enhanced error handling
    errorState,
    retryProgress: () => retryOperation(fetchJobStatus),
    clearError,
    canRetry: errorState.canRetry
  };
}