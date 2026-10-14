"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Calendar,
  X,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportJob, ExportJobStatus } from "@/lib/api/bulkExportService";
import bulkExportService from "@/lib/api/bulkExportService";
import { confirmDialog } from "@/lib/dialogs/dialog-queue";
import { useAsyncEffect } from "@/hooks/use-async-effect";

interface ExportHistoryProps {
  onViewJob?: (job: ExportJob) => void;
  onNewExport?: () => void;
}

export function ExportHistory({ onViewJob, onNewExport }: ExportHistoryProps) {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingJobs, setDownloadingJobs] = useState<Set<string>>(
    new Set(),
  );
  const [deletingJobs, setDeletingJobs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadJobs = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await bulkExportService.getExportJobs(page, 10);

      if (page === 1) {
        setJobs(response.jobs);
      } else {
        setJobs((prev) => [...prev, ...response.jobs]);
      }

      setTotalJobs(response.total);
      setHasMore(
        response.jobs.length === 10 &&
          jobs.length + response.jobs.length < response.total,
      );
      setCurrentPage(page);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Dışa aktarma geçmişi yüklenemedi",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useAsyncEffect(() => {
    loadJobs();
  }, []);

  const handleDownload = async (job: ExportJob) => {
    if (job.status !== ExportJobStatus.COMPLETED) return;

    const isExpired = !!job.expiresAt && new Date() > new Date(job.expiresAt);
    if (isExpired) return;

    setDownloadingJobs((prev) => new Set(prev).add(job.id));

    try {
      const blob = await bulkExportService.downloadExport(job.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = job.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloadingJobs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(job.id);
        return newSet;
      });
    }
  };

  const handleDelete = async (job: ExportJob) => {
    if (
      !(await confirmDialog({
        title: "Bu dışa aktarma işini silmek istediğinizden emin misiniz?",
        destructive: true,
      }))
    )
      return;

    setDeletingJobs((prev) => new Set(prev).add(job.id));

    try {
      await bulkExportService.cancelExport(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      setTotalJobs((prev) => prev - 1);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingJobs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(job.id);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: ExportJobStatus) => {
    switch (status) {
      case ExportJobStatus.PENDING:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Beklemede
          </Badge>
        );
      case ExportJobStatus.PROCESSING:
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            İşleniyor
          </Badge>
        );
      case ExportJobStatus.COMPLETED:
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Tamamlandı
          </Badge>
        );
      case ExportJobStatus.FAILED:
        return <Badge variant="destructive">Başarısız</Badge>;
      default:
        return <Badge variant="secondary">Bilinmeyen</Badge>;
    }
  };

  const getStatusIcon = (status: ExportJobStatus) => {
    switch (status) {
      case ExportJobStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case ExportJobStatus.PROCESSING:
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case ExportJobStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ExportJobStatus.FAILED:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "Bilinmiyor";

    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Bilinmiyor";
    const d = new Date(date);
    return d.toLocaleString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (job: ExportJob) => {
    return !!job.expiresAt && new Date() > new Date(job.expiresAt);
  };

  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Dışa aktarma geçmişi yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Henüz dışa aktarma yok</h3>
          <p className="text-muted-foreground mb-4">
            İlk dışa aktarmanızı oluşturmak için başlayın.
          </p>
          {onNewExport && (
            <Button onClick={onNewExport}>
              <FileText className="h-4 w-4 mr-2" />
              Yeni Dışa Aktarma
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dışa Aktarma Geçmişi</h3>
          <p className="text-muted-foreground">
            Toplam {totalJobs} dışa aktarma işi
          </p>
        </div>
        {onNewExport && (
          <Button onClick={onNewExport}>
            <FileText className="h-4 w-4 mr-2" />
            Yeni Dışa Aktarma
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <CardTitle className="text-base">{job.fileName}</CardTitle>
                    <CardDescription>
                      {formatDate(job.createdAt)}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(job.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">
                    {job.totalRecords}
                  </div>
                  <div className="text-xs text-muted-foreground">Kayıt</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {job.options?.fields.length ?? "Bilinmiyor"}
                  </div>
                  <div className="text-xs text-muted-foreground">Alan</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {formatFileSize(job.fileSizeBytes)}
                  </div>
                  <div className="text-xs text-muted-foreground">Boyut</div>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="uppercase text-xs">
                    {job.options?.format ?? "Bilinmiyor"}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    Format
                  </div>
                </div>
              </div>

              {/* Progress bar for processing jobs */}
              {(job.status === ExportJobStatus.PROCESSING ||
                job.status === ExportJobStatus.PENDING) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">İlerleme</span>
                    <span className="text-xs text-muted-foreground">
                      {job.processedRecords} / {job.totalRecords}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${job.progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Expiration warning */}
              {job.status === ExportJobStatus.COMPLETED && (
                <div className="mb-4">
                  <div
                    className={cn(
                      "text-xs",
                      isExpired(job) ? "text-red-600" : "text-muted-foreground",
                    )}
                  >
                    {isExpired(job)
                      ? `Süresi doldu: ${formatDate(job.expiresAt)}`
                      : `Son geçerlilik: ${formatDate(job.expiresAt)}`}
                  </div>
                </div>
              )}

              {/* Error message */}
              {job.error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {job.error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {onViewJob && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewJob(job)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detay
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {job.status === ExportJobStatus.COMPLETED &&
                    !isExpired(job) && (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(job)}
                        disabled={downloadingJobs.has(job.id)}
                      >
                        {downloadingJobs.has(job.id) ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            İndiriliyor
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            İndir
                          </>
                        )}
                      </Button>
                    )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(job)}
                    disabled={deletingJobs.has(job.id)}
                  >
                    {deletingJobs.has(job.id) ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => loadJobs(currentPage + 1)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              "Daha Fazla Yükle"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
