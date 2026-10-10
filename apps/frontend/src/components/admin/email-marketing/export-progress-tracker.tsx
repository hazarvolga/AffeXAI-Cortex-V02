'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  FileText,
  Calendar,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExportJob, ExportJobStatus } from '@/lib/api/bulkExportService';
import bulkExportService from '@/lib/api/bulkExportService';
import { useExportProgress } from '@/hooks/useExportProgress';
import { useAuth } from '@/lib/auth/auth-context';

interface ExportProgressTrackerProps {
  job: ExportJob;
  onComplete?: (job: ExportJob) => void;
  onCancel?: () => void;
  onNewExport?: () => void;
}

export function ExportProgressTracker({ 
  job, 
  onComplete, 
  onCancel, 
  onNewExport 
}: ExportProgressTrackerProps) {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const {
    job: progressJob,
    isLoading,
    error: progressError,
    isPolling,
    refetch
  } = useExportProgress({
    jobId: job.id,
    userId: user?.id ?? '',
    enabled: !!user && (job.status === ExportJobStatus.PROCESSING || job.status === ExportJobStatus.PENDING),
    onComplete: (completedJob) => {
      onComplete?.(completedJob);
    },
    onError: (errorMessage) => {
      console.error('Export progress error:', errorMessage);
    }
  });

  const [details, setDetails] = useState<ExportJob | null>(null);
  useEffect(() => {
    let active = true;
    bulkExportService.getExportDetails(job.id).then(value => {
      if (active) setDetails(value);
    }).catch(error => {
      if (active) setDownloadError(error instanceof Error ? error.message : 'İşlem detayları yüklenemedi');
    });
    return () => { active = false; };
  }, [job.id]);

  const currentJob = { ...job, ...(details?.id === job.id ? details : {}), ...progressJob };

  const handleDownload = async () => {
    if (currentJob.status !== ExportJobStatus.COMPLETED) return;
    
    setIsDownloading(true);
    setDownloadError(null);
    
    try {
      const blob = await bulkExportService.downloadExport(currentJob.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentJob.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Dosya indirilemedi');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCancelJob = async () => {
    if (currentJob.status !== ExportJobStatus.PROCESSING && currentJob.status !== ExportJobStatus.PENDING) return;
    
    try {
      await bulkExportService.cancelExport(currentJob.id);
      onCancel?.();
    } catch (err) {
      console.error('Failed to cancel export:', err);
    }
  };

  const getStatusBadge = (status: ExportJobStatus) => {
    switch (status) {
      case ExportJobStatus.PENDING:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Beklemede</Badge>;
      case ExportJobStatus.PROCESSING:
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">İşleniyor</Badge>;
      case ExportJobStatus.COMPLETED:
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Tamamlandı</Badge>;
      case ExportJobStatus.FAILED:
        return <Badge variant="destructive">Başarısız</Badge>;
      default:
        return <Badge variant="secondary">Bilinmeyen</Badge>;
    }
  };

  const getStatusIcon = (status: ExportJobStatus) => {
    switch (status) {
      case ExportJobStatus.PENDING:
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case ExportJobStatus.PROCESSING:
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case ExportJobStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case ExportJobStatus.FAILED:
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return 'Bilinmiyor';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Bilinmiyor';
    const d = new Date(date);
    return d.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = currentJob.expiresAt && new Date() > new Date(currentJob.expiresAt);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {getStatusIcon(currentJob.status)}
          <h3 className="text-lg font-semibold">Dışa Aktarma Durumu</h3>
        </div>
        <p className="text-muted-foreground">
          {currentJob.fileName}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">İşlem Detayları</CardTitle>
            {getStatusBadge(currentJob.status)}
          </div>
          <CardDescription>
            {isPolling && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Gerçek zamanlı güncelleniyor...
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {(currentJob.status === ExportJobStatus.PROCESSING || currentJob.status === ExportJobStatus.PENDING) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">İlerleme</span>
                <span className="text-sm text-muted-foreground">
                  {currentJob.processedRecords} / {currentJob.totalRecords}
                </span>
              </div>
              <Progress value={currentJob.progressPercentage} className="w-full" />
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{currentJob.totalRecords}</div>
              <div className="text-sm text-muted-foreground">Toplam Kayıt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currentJob.processedRecords}</div>
              <div className="text-sm text-muted-foreground">İşlenen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentJob.options?.fields.length ?? 'Bilinmiyor'}
              </div>
              <div className="text-sm text-muted-foreground">Alan Sayısı</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatFileSize(currentJob.fileSizeBytes)}
              </div>
              <div className="text-sm text-muted-foreground">Dosya Boyutu</div>
            </div>
          </div>

          {/* Job Details */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dosya Formatı:</span>
              <Badge variant="outline" className="uppercase">
                {currentJob.options?.format ?? 'Bilinmiyor'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Oluşturulma:</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(currentJob.createdAt)}
              </span>
            </div>
            
            {currentJob.completedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tamamlanma:</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(currentJob.completedAt)}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Son Geçerlilik:</span>
              <span className={cn(
                "text-sm",
                isExpired ? "text-red-600" : "text-muted-foreground"
              )}>
                {formatDate(currentJob.expiresAt)}
                {isExpired && " (Süresi dolmuş)"}
              </span>
            </div>
          </div>

          {/* Applied Filters Summary */}
          {Object.keys(currentJob.filters ?? {}).some(key => {
            const value = currentJob.filters?.[key as keyof typeof currentJob.filters];
            return Array.isArray(value) ? value.length > 0 : !!value;
          }) && (
            <div className="space-y-2 pt-4 border-t">
              <span className="text-sm font-medium">Uygulanan Filtreler:</span>
              <div className="flex flex-wrap gap-2">
                {currentJob.filters?.status?.map(status => (
                  <Badge key={status} variant="secondary" className="text-xs">
                    Durum: {status}
                  </Badge>
                ))}
                {currentJob.filters?.groupIds?.map(groupId => (
                  <Badge key={groupId} variant="secondary" className="text-xs">
                    Grup: {groupId}
                  </Badge>
                ))}
                {currentJob.filters?.segmentIds?.map(segmentId => (
                  <Badge key={segmentId} variant="secondary" className="text-xs">
                    Segment: {segmentId}
                  </Badge>
                ))}
                {currentJob.filters?.dateRange && (
                  <Badge variant="secondary" className="text-xs">
                    Tarih Aralığı
                  </Badge>
                )}
                {currentJob.filters?.validationStatus?.map(status => (
                  <Badge key={status} variant="secondary" className="text-xs">
                    Doğrulama: {status}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {(currentJob.error || progressError || downloadError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {currentJob.error || progressError || downloadError}
          </AlertDescription>
        </Alert>
      )}

      {/* Expiration Warning */}
      {currentJob.status === ExportJobStatus.COMPLETED && !isExpired && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            Bu dosya {formatDate(currentJob.expiresAt)} tarihine kadar indirilebilir.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <div>
          {onNewExport && (
            <Button variant="outline" onClick={onNewExport}>
              <FileText className="h-4 w-4 mr-2" />
              Yeni Dışa Aktarma
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {(currentJob.status === ExportJobStatus.PROCESSING || currentJob.status === ExportJobStatus.PENDING) && (
            <Button variant="outline" onClick={handleCancelJob}>
              <X className="h-4 w-4 mr-2" />
              İptal Et
            </Button>
          )}
          
          {currentJob.status === ExportJobStatus.COMPLETED && !isExpired && (
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  İndiriliyor...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Dosyayı İndir
                </>
              )}
            </Button>
          )}
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Kapat
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}