'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Download, 
  FileText, 
  BarChart3,
  Users,
  Mail,
  TrendingUp,
  Clock,
  Info,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import bulkImportService, { ImportJob, ImportJobStatus } from '@/lib/api/bulkImportService';
import { ValidationResultsDisplay } from './validation-results-display';

interface ImportResultsDashboardProps {
  job: ImportJob;
  onClose?: () => void;
  onNewImport?: () => void;
}

interface QualityMetrics {
  overallScore: number;
  deliverabilityScore: number;
  riskScore: number;
  duplicateRate: number;
  validationAccuracy: number;
}

export function ImportResultsDashboard({ job, onClose, onNewImport }: ImportResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    // Calculate quality metrics
    if (job.totalRecords > 0) {
      const validRate = (job.validRecords / job.totalRecords) * 100;
      const riskyRate = ((job.riskyRecords || 0) / job.totalRecords) * 100;
      const invalidRate = (job.invalidRecords / job.totalRecords) * 100;
      const duplicateRate = (job.duplicateRecords / job.totalRecords) * 100;

      const overallScore = validRate;
      const deliverabilityScore = Math.max(0, 100 - (riskyRate * 0.5 + invalidRate));
      const riskScore = riskyRate + invalidRate;
      const validationAccuracy = 0; // TODO: Add validationSummary to ImportJob type

      setQualityMetrics({
        overallScore,
        deliverabilityScore,
        riskScore,
        duplicateRate,
        validationAccuracy
      });
    }
  }, [job]);

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const blob = await bulkImportService.downloadReport(job.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import-report-${job.id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Rapor indirilemedi');
    } finally {
      setIsDownloading(false);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            İçe Aktarma Tamamlandı
          </h2>
          <p className="text-muted-foreground">
            {job.fileName} • {new Date(job.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onNewImport}>
            Yeni İçe Aktarma
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Kapat
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{job.totalRecords.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Toplam Kayıt</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{job.validRecords.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Geçerli</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{job.invalidRecords.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Geçersiz</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {qualityMetrics ? `${qualityMetrics.overallScore.toFixed(1)}%` : '-'}
            </div>
            <div className="text-sm text-muted-foreground">Kalite Skoru</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Özet
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Detaylar
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            İşlemler
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Processing Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  İşlem Özeti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Başlangıç:</span>
                  <span>{new Date(job.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bitiş:</span>
                  <span>{job.completedAt ? new Date(job.completedAt).toLocaleString() : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Durum:</span>
                  <Badge className={cn('border', 
                    job.status === ImportJobStatus.COMPLETED 
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                  )}>
                    {job.status.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Validation Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Doğrulama Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Geçerli</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{job.validRecords.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {((job.validRecords / job.totalRecords) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>Riskli</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{job.riskyRecords.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {((job.riskyRecords / job.totalRecords) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Geçersiz</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{job.invalidRecords.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {((job.invalidRecords / job.totalRecords) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span>Tekrar</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{job.duplicateRecords.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {((job.duplicateRecords / job.totalRecords) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quality Metrics */}
          {qualityMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Kalite Metrikleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Badge className={cn('border', getScoreBadgeColor(qualityMetrics.overallScore))}>
                      {qualityMetrics.overallScore.toFixed(1)}%
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">Genel Kalite</div>
                  </div>
                  <div className="text-center">
                    <Badge className={cn('border', getScoreBadgeColor(qualityMetrics.deliverabilityScore))}>
                      {qualityMetrics.deliverabilityScore.toFixed(1)}%
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">Teslimat</div>
                  </div>
                  <div className="text-center">
                    <Badge className={cn('border', getScoreBadgeColor(100 - qualityMetrics.riskScore))}>
                      {qualityMetrics.riskScore.toFixed(1)}%
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">Risk</div>
                  </div>
                  <div className="text-center">
                    <Badge className={cn('border', getScoreBadgeColor(qualityMetrics.validationAccuracy))}>
                      {qualityMetrics.validationAccuracy.toFixed(1)}%
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">Doğruluk</div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-2">
                  {qualityMetrics.overallScore < 80 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Kalite skoru düşük. Geçersiz e-postaları temizlemeyi düşünün.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {qualityMetrics.riskScore > 20 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Yüksek risk oranı tespit edildi. Riskli e-postaları ayrı bir kampanyada test edin.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <ValidationResultsDisplay jobId={job.id} />
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rapor İndirme</CardTitle>
                <CardDescription>
                  Detaylı analiz ve kayıtlar için raporları indirin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleDownloadReport}
                  disabled={isDownloading}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? 'İndiriliyor...' : 'Detaylı Rapor İndir'}
                </Button>

                {downloadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{downloadError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sonraki Adımlar</CardTitle>
                <CardDescription>
                  İçe aktarma sonrası önerilen işlemler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Aboneleri Görüntüle
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Kampanya Oluştur
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </Button>
                
                <Button variant="outline" className="w-full justify-start" onClick={onNewImport}>
                  <Download className="h-4 w-4 mr-2" />
                  Yeni İçe Aktarma
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}