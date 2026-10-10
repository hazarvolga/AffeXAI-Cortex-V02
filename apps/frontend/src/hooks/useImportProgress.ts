import { useState, useEffect, useCallback, useRef } from 'react';
import bulkImportService, { ImportJob, ImportJobStatus } from '@/lib/api/bulkImportService';
import { useBulkOperationErrors } from './useBulkOperationErrors';

interface UseImportProgressOptions {
  jobId: string | null;
  userId: string;
  enabled?: boolean;
  interval?: number;
  onComplete?: (job: ImportJob) => void;
  onError?: (error: string) => void;
}

interface ImportProgressState {
  job: ImportJob | null;
  isLoading: boolean;
  error: string | null;
  isPolling: boolean;
}

export function useImportProgress({
  jobId,
  userId,
  enabled = true,
  interval = 2000,
  onComplete,
  onError
}: UseImportProgressOptions) {
  const [state, setState] = useState<ImportProgressState>({
    job: null,
    isLoading: false,
    error: null,
    isPolling: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false); // Will be set to true on mount
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  
  // Set mounted flag on mount
  useEffect(() => {
    mountedRef.current = true;
    console.log('[useImportProgress] Component mounted');
    return () => {
      mountedRef.current = false;
      console.log('[useImportProgress] Component unmounting');
    };
  }, []);

  // Enhanced error handling
  const { errorState, handleError, retryOperation, clearError } = useBulkOperationErrors(
    userId,
    jobId || undefined,
    'import',
    {
      maxRetries: 3,
      enableNotifications: true,
      enableLogging: true,
      onError: (error) => {
        setState(prev => ({ ...prev, error: error.message }));
        onErrorRef.current?.(error.message);
      }
    }
  );

  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({ ...prev, isPolling: false }));
  }, []);

  const fetchProgress = useCallback(async () => {
    if (!jobId || !enabled || !mountedRef.current) {
      console.log('[useImportProgress] fetchProgress skipped:', { jobId, enabled, mounted: mountedRef.current });
      return;
    }

    try {
      console.log('[useImportProgress] Fetching progress for job:', jobId);
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      clearError(); // Clear any previous errors
      
      // Direct call to bulkImportService (it has its own retry logic)
      const job = await bulkImportService.getImportStatus(jobId);
      
      console.log('[useImportProgress] Job fetched:', {
        id: job.id,
        status: job.status,
        processed: job.processedRecords,
        total: job.totalRecords,
        valid: job.validRecords
      });
      
      if (!mountedRef.current) return;

      setState(prev => ({ ...prev, job, isLoading: false }));

      // Check if job is completed or failed
      if (job.status === ImportJobStatus.COMPLETED) {
        console.log('[useImportProgress] Job completed, stopping polling');
        clearPolling();
        onCompleteRef.current?.(job);
      } else if (job.status === ImportJobStatus.FAILED) {
        console.log('[useImportProgress] Job failed, stopping polling');
        clearPolling();
        const errorMessage = job.error || 'Import işlemi başarısız oldu';
        handleError(new Error(errorMessage), { 
          operation: 'import_status_check',
          jobStatus: job.status 
        });
      }
    } catch (error) {
      console.error('[useImportProgress] Error fetching progress:', error);
      if (!mountedRef.current) return;
      
      handleError(error, { 
        operation: 'import_progress_fetch',
        jobId 
      });
      clearPolling();
    }
  }, [jobId, enabled, clearPolling, handleError, clearError]);

  const startPolling = useCallback(() => {
    if (!jobId || !enabled || intervalRef.current) {
      console.log('[useImportProgress] startPolling skipped:', { jobId, enabled, hasInterval: !!intervalRef.current });
      return;
    }

    console.log('[useImportProgress] Starting polling for job:', jobId, 'interval:', interval);
    setState(prev => ({ ...prev, isPolling: true }));
    
    // Initial fetch
    fetchProgress();
    
    // Start polling
    intervalRef.current = setInterval(fetchProgress, interval);
  }, [jobId, enabled, interval, fetchProgress]);

  const stopPolling = useCallback(() => {
    clearPolling();
  }, [clearPolling]);

  // Start polling when jobId changes or enabled becomes true
  useEffect(() => {
    if (jobId && enabled) {
      startPolling();
    } else {
      clearPolling();
    }

    return () => {
      clearPolling();
    };
  }, [jobId, enabled]); // Removed startPolling and clearPolling from dependencies

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  return {
    job: state.job,
    isLoading: state.isLoading,
    error: state.error,
    isPolling: state.isPolling,
    startPolling,
    stopPolling,
    refetch: fetchProgress,
    // Enhanced error handling
    errorState,
    retryProgress: () => retryOperation(fetchProgress),
    clearError,
    canRetry: errorState.canRetry
  };
}