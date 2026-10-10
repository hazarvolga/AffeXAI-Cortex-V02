'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImportJob, ImportJobStatus } from '@/lib/api/bulkImportService';
import bulkImportService from '@/lib/api/bulkImportService';

interface ImportProgressTrackerProps {
  jobId: string;
  onComplete?: (job: ImportJob) => void;
  onError?: (error: string) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ProgressStats {
  processed: number;
  total: number;
  valid: number;
  invalid: number;
  risky: number;
  duplicates: number;
  percentage: number;
  rate: number; // records per second
  estimatedTimeRemaining: number; // seconds
}

export function ImportProgressTracker({
  jobId,
  onComplete,
  onError,
  autoRefresh = true,
  refreshInterval = 2000
}: ImportProgressTrackerProps) {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [processingRate, setProcessingRate] = useState<number>(0);

  const calculateStats = useCallback((currentJob: ImportJob): ProgressStats => {
    const processed = currentJob.processedRecords;
    const total = currentJob.totalRecords;
    const percentage = total > 0 ? (processed / total) * 100 : 0;
    
    // Calculate processing rate (records per second)
    let rate = 0;
    let estimatedTimeRemaining = 0;
    
    if (lastUpdate && job) {
      const timeDiff = (new Date().getTime() - lastUpdate.getTime()) / 1000;
      const recordsDiff = processed - job.processedRecords;
      if (timeDiff > 0) {
        rate = recordsDiff / timeDiff;
        setProcessingRate(rate);
      }
    }
    
    if (rate > 0 && processed < total) {
      estimatedTimeRemaining = (total - processed) / rate;
    }

    return {
      processed,
      total,
      valid: currentJob.validRecords,
      invalid: currentJob.invalidRecords,
      risky: currentJob.riskyRecords,
      duplicates: currentJob.duplicateRecords,
      percentage,
      rate: processingRate,
      estimatedTimeRemaining
    };
  }, [job, lastUpdate, processingRate]);

  const fetchJobStatus = useCallback(async () => {
    try {
      setError(null);
      const updatedJob = await bulkImportService.getImportStatus(jobId);
      
      setJob(prevJob => {
        setLastUpdate(new Date());
        return updatedJob;
      });
      
      const newStats = calculateStats(updatedJob);
      setStats(newStats);

      // Handle job completion or failure
      if (updatedJob.status === ImportJobStatus.COMPLETED) {
        onComplete?.(updatedJob);
      } else if (updatedJob.status === ImportJobStatus.FAILED) {
        const errorMsg = updatedJob.error || 'Import job failed';
        setError(errorMsg);
        onError?.(errorMsg);
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch job status';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [jobId, calculateStats, onComplete, onError]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !job || job.status === ImportJobStatus.COMPLETED || job.status === ImportJobStatus.FAILED) {
      return;
    }

    const interval = setInterval(fetchJobStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchJobStatus, job]);

  // Initial fetch
  useEffect(() => {
    fetchJobStatus();
  }, [fetchJobStatus]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getStatusIcon = (status: ImportJobStatus) => {
    switch (status) {
      case ImportJobStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case ImportJobStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      case ImportJobStatus.PROCESSING:
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: ImportJobStatus) => {
    switch (status) {
      case ImportJobStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      case ImportJobStatus.FAILED:
        return 'bg-red-100 text-red-800 border-red-200';
      case ImportJobStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (isLoading && !job) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading import status...</span>
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load import job information.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(job.status)}
              <div>
                <CardTitle className="text-lg">{job.fileName}</CardTitle>
                <CardDescription>
                  Import Job • Started {new Date(job.createdAt).toLocaleString()}
                </CardDescription>
              </div>
            </div>
            <Badge className={cn('border', getStatusColor(job.status))}>
              {job.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Processing Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">
                {stats.processed.toLocaleString()} / {stats.total.toLocaleString()} records
              </span>
            </div>
            
            <Progress value={stats.percentage} className="h-3" />
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{stats.percentage.toFixed(1)}% complete</span>
              {job.status === ImportJobStatus.PROCESSING && stats.rate > 0 && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {stats.rate.toFixed(0)} records/sec
                </span>
              )}
            </div>

            {job.status === ImportJobStatus.PROCESSING && stats.estimatedTimeRemaining > 0 && (
              <div className="text-sm text-muted-foreground text-center">
                Estimated time remaining: {formatTime(stats.estimatedTimeRemaining)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>
              Email validation breakdown and statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Valid</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.valid.toLocaleString()}</div>
                <div className="text-xs text-green-600">
                  {stats.total > 0 ? ((stats.valid / stats.total) * 100).toFixed(1) : 0}%
                </div>
              </div>

              <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">Risky</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{stats.risky.toLocaleString()}</div>
                <div className="text-xs text-yellow-600">
                  {stats.total > 0 ? ((stats.risky / stats.total) * 100).toFixed(1) : 0}%
                </div>
              </div>

              <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Invalid</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.invalid.toLocaleString()}</div>
                <div className="text-xs text-red-600">
                  {stats.total > 0 ? ((stats.invalid / stats.total) * 100).toFixed(1) : 0}%
                </div>
              </div>

              <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Duplicates</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.duplicates.toLocaleString()}</div>
                <div className="text-xs text-blue-600">
                  {stats.total > 0 ? ((stats.duplicates / stats.total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>

            {/* Quality Score */}
            {stats.total > 0 && (
              <div className="mt-6 p-4 rounded-lg bg-gray-50 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Quality Score</span>
                  <div className="flex items-center gap-1">
                    {((stats.valid / stats.total) * 100) >= 80 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-bold">
                      {((stats.valid / stats.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(stats.valid / stats.total) * 100} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Based on valid email addresses vs total processed
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Manual Refresh */}
      {!autoRefresh && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={fetchJobStatus}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Status
          </Button>
        </div>
      )}
    </div>
  );
}