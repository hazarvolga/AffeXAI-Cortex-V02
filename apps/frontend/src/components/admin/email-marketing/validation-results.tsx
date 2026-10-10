'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ImportJob, 
  ImportResult, 
  ImportResultStatus,
  ValidationDetails 
} from '@affexai/shared-types';
import bulkImportService from '@/lib/api/bulkImportService';

interface ValidationResultsProps {
  job: ImportJob;
  onRetry?: () => void;
  onDownloadReport?: () => void;
}

interface ValidationStats {
  total: number;
  valid: number;
  invalid: number;
  risky: number;
  duplicates: number;
  imported: number;
}

interface ResultsFilter {
  status: string;
  search: string;
  page: number;
  limit: number;
}

export function ValidationResults({ job, onRetry, onDownloadReport }: ValidationResultsProps) {
  const [results, setResults] = useState<ImportResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ResultsFilter>({
    status: 'all',
    search: '',
    page: 1,
    limit: 50
  });
  const [totalResults, setTotalResults] = useState(0);
  const [selectedResult, setSelectedResult] = useState<ImportResult | null>(null);

  const stats: ValidationStats = {
    total: job.totalRecords,
    valid: job.validRecords,
    invalid: job.invalidRecords,
    risky: job.riskyRecords,
    duplicates: job.duplicateRecords,
    imported: job.validRecords + job.riskyRecords - job.duplicateRecords
  };

  const fetchResults = async () => {
    if (!job.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await bulkImportService.getImportResults(
        job.id,
        filter.page,
        filter.limit
      );
      
      let filteredResults = response.results;
      
      // Apply status filter
      if (filter.status !== 'all') {
        filteredResults = filteredResults.filter(result => result.status === filter.status);
      }
      
      // Apply search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredResults = filteredResults.filter(result =>
          result.email.toLowerCase().includes(searchLower) ||
          result.issues?.some(issue => issue.toLowerCase().includes(searchLower)) ||
          result.suggestions?.some(suggestion => suggestion.toLowerCase().includes(searchLower))
        );
      }
      
      setResults(filteredResults);
      setTotalResults(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sonuçlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [job.id, filter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case ImportResultStatus.VALID:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case ImportResultStatus.INVALID:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case ImportResultStatus.RISKY:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case ImportResultStatus.DUPLICATE:
        return <Copy className="h-4 w-4 text-blue-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      [ImportResultStatus.VALID]: 'default',
      [ImportResultStatus.INVALID]: 'destructive',
      [ImportResultStatus.RISKY]: 'secondary',
      [ImportResultStatus.DUPLICATE]: 'outline'
    } as const;

    const labels = {
      [ImportResultStatus.VALID]: 'Geçerli',
      [ImportResultStatus.INVALID]: 'Geçersiz',
      [ImportResultStatus.RISKY]: 'Riskli',
      [ImportResultStatus.DUPLICATE]: 'Tekrar'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceTrend = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (score >= 60) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Toplam</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
          <div className="text-sm text-muted-foreground">Geçerli</div>
          <div className="text-xs text-muted-foreground">
            %{((stats.valid / stats.total) * 100).toFixed(1)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.risky}</div>
          <div className="text-sm text-muted-foreground">Riskli</div>
          <div className="text-xs text-muted-foreground">
            %{((stats.risky / stats.total) * 100).toFixed(1)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
          <div className="text-sm text-muted-foreground">Geçersiz</div>
          <div className="text-xs text-muted-foreground">
            %{((stats.invalid / stats.total) * 100).toFixed(1)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.duplicates}</div>
          <div className="text-sm text-muted-foreground">Tekrar</div>
          <div className="text-xs text-muted-foreground">
            %{((stats.duplicates / stats.total) * 100).toFixed(1)}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProgressBar = () => {
    const successRate = ((stats.valid + stats.risky) / stats.total) * 100;
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Doğrulama Başarı Oranı</CardTitle>
          <CardDescription>
            Geçerli ve riskli e-postaların toplam oranı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Başarı Oranı</span>
              <span className="font-medium">%{successRate.toFixed(1)}</span>
            </div>
            <Progress value={successRate} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats.valid + stats.risky} başarılı</span>
              <span>{stats.invalid} başarısız</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFilters = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Filtreler</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="E-posta adresi ara..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select
            value={filter.status}
            onValueChange={(value) => setFilter(prev => ({ ...prev, status: value, page: 1 }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value={ImportResultStatus.VALID}>Geçerli</SelectItem>
              <SelectItem value={ImportResultStatus.RISKY}>Riskli</SelectItem>
              <SelectItem value={ImportResultStatus.INVALID}>Geçersiz</SelectItem>
              <SelectItem value={ImportResultStatus.DUPLICATE}>Tekrar</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchResults} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Yenile
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderResultsTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detaylı Sonuçlar</CardTitle>
        <CardDescription>
          {totalResults} sonuçtan {results.length} tanesi gösteriliyor
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Yükleniyor...
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Sonuç bulunamadı
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Güven Skoru</TableHead>
                  <TableHead>İçe Aktarıldı</TableHead>
                  <TableHead>Satır</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      {result.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        {getStatusBadge(result.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getConfidenceTrend(result.confidenceScore)}
                        <span className={cn("font-medium", getConfidenceColor(result.confidenceScore))}>
                          {result.confidenceScore}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {result.imported ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>{result.rowNumber}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedResult(result)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderResultDetail = () => {
    if (!selectedResult) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detay: {selectedResult.email}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedResult(null)}
            className="absolute top-4 right-4"
          >
            ×
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Durum</div>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(selectedResult.status)}
                {getStatusBadge(selectedResult.status)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Güven Skoru</div>
              <div className="flex items-center gap-2 mt-1">
                {getConfidenceTrend(selectedResult.confidenceScore)}
                <span className={cn("font-medium", getConfidenceColor(selectedResult.confidenceScore))}>
                  {selectedResult.confidenceScore}%
                </span>
              </div>
            </div>
          </div>

          {selectedResult.issues && selectedResult.issues.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Sorunlar</div>
              <div className="space-y-1">
                {selectedResult.issues.map((issue, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{issue}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {selectedResult.suggestions && selectedResult.suggestions.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Öneriler</div>
              <div className="space-y-1">
                {selectedResult.suggestions.map((suggestion, index) => (
                  <Alert key={index}>
                    <AlertDescription>{suggestion}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {selectedResult.validationDetails && (
            <div>
              <div className="text-sm font-medium mb-2">Doğrulama Detayları</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Sözdizimi:</span>
                  <span>{selectedResult.validationDetails.syntaxValid ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Domain:</span>
                  <span>{selectedResult.validationDetails.domainExists ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span>MX Kaydı:</span>
                  <span>{selectedResult.validationDetails.mxRecordExists ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tek Kullanımlık:</span>
                  <span>{selectedResult.validationDetails.isDisposable ? '✗' : '✓'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rol Hesabı:</span>
                  <span>{selectedResult.validationDetails.isRoleAccount ? '✗' : '✓'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Yazım Hatası:</span>
                  <span>{selectedResult.validationDetails.hasTypos ? '✗' : '✓'}</span>
                </div>
              </div>
            </div>
          )}

          {selectedResult.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{selectedResult.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {renderStatsCards()}
      {renderProgressBar()}
      
      <Tabs defaultValue="results" className="w-full">
        <TabsList>
          <TabsTrigger value="results">Sonuçlar</TabsTrigger>
          <TabsTrigger value="summary">Özet</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="space-y-6">
          {renderFilters()}
          {selectedResult ? renderResultDetail() : renderResultsTable()}
        </TabsContent>
        
        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>İçe Aktarma Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Dosya Adı</div>
                  <div className="text-sm text-muted-foreground">{job.fileName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">İşlem Tarihi</div>
                  <div className="text-sm text-muted-foreground">
                    {job.createdAt ? new Date(job.createdAt).toLocaleString('tr-TR') : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Tamamlanma Tarihi</div>
                  <div className="text-sm text-muted-foreground">
                    {job.completedAt ? new Date(job.completedAt).toLocaleString('tr-TR') : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">İşlem Süresi</div>
                  <div className="text-sm text-muted-foreground">
                    {job.completedAt && job.createdAt
                      ? `${Math.round((new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()) / 1000)} saniye`
                      : '-'
                    }
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={onDownloadReport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Rapor İndir
                </Button>
                {onRetry && (
                  <Button onClick={onRetry} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tekrar Dene
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}