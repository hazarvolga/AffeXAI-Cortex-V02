'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  Download, 
  Filter, 
  Users, 
  Calendar,
  FileText,
  Settings,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ExportFilters, 
  ExportOptions,
  Group,
  Segment,
  SubscriberStatus,
  ExportJobStatus 
} from '@affexai/shared-types';
import bulkExportService, { type ExportJob } from '@/lib/api/bulkExportService';
import { useExportProgress } from '@/hooks/useExportProgress';
import { useAuth } from '@/lib/auth/auth-context';
import type { DateRange } from 'react-day-picker';

interface ExportConfigurationProps {
  onComplete?: (job: ExportJob) => void;
  onCancel?: () => void;
}

interface FieldDefinition {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

interface ExportPreview {
  totalRecords: number;
  sampleRecords?: Record<string, unknown>[];
  estimatedFileSize: string;
}

export function ExportConfiguration({ onComplete, onCancel }: ExportConfigurationProps) {
  const { user } = useAuth();
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>();
  const [filters, setFilters] = useState<ExportFilters>({
    status: [],
    groupIds: [],
    segmentIds: [],
    dateRange: undefined,
    validationStatus: []
  });
  
  const [options, setOptions] = useState<ExportOptions>({
    fields: ['email', 'firstName', 'lastName', 'status'],
    format: 'csv',
    includeMetadata: false,
    batchSize: 1000
  });

  const [availableFields, setAvailableFields] = useState<FieldDefinition[]>([]);
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Mock data for groups and segments - in real app, fetch from API
  const availableGroups: Group[] = [
    { id: '1', name: 'Newsletter Subscribers', description: 'General newsletter subscribers', subscriberCount: 1250, createdAt: new Date(), updatedAt: new Date() },
    { id: '2', name: 'Product Updates', description: 'Users interested in product updates', subscriberCount: 890, createdAt: new Date(), updatedAt: new Date() },
    { id: '3', name: 'VIP Customers', description: 'Premium customers', subscriberCount: 156, createdAt: new Date(), updatedAt: new Date() }
  ];

  const availableSegments: Segment[] = [
    { id: '1', name: 'Active Users', description: 'Users active in last 30 days', subscriberCount: 2100, criteria: 'last_activity > 30 days', openRate: 25.5, clickRate: 3.2, createdAt: new Date(), updatedAt: new Date() },
    { id: '2', name: 'High Engagement', description: 'Users with high email engagement', subscriberCount: 450, criteria: 'open_rate > 40%', openRate: 45.2, clickRate: 8.1, createdAt: new Date(), updatedAt: new Date() }
  ];

  const statusOptions = [
    { value: SubscriberStatus.ACTIVE, label: 'Aktif', color: 'bg-green-100 text-green-800' },
    { value: SubscriberStatus.PENDING, label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
    { value: SubscriberStatus.UNSUBSCRIBED, label: 'Abonelik İptal', color: 'bg-gray-100 text-gray-800' },
    { value: SubscriberStatus.BOUNCED, label: 'Geri Dönen', color: 'bg-red-100 text-red-800' },
    { value: SubscriberStatus.COMPLAINED, label: 'Şikayet', color: 'bg-orange-100 text-orange-800' }
  ];

  const validationStatusOptions = [
    { value: 'valid', label: 'Geçerli', color: 'bg-green-100 text-green-800' },
    { value: 'invalid', label: 'Geçersiz', color: 'bg-red-100 text-red-800' },
    { value: 'risky', label: 'Riskli', color: 'bg-yellow-100 text-yellow-800' }
  ];

  // Use export progress hook
  const {
    job: progressJob,
    isLoading: isProgressLoading,
    error: progressError,
    isPolling
  } = useExportProgress({
    jobId: exportJob?.id || null,
    userId: user?.id ?? '',
    enabled: !!user && (exportJob?.status === ExportJobStatus.PROCESSING || exportJob?.status === ExportJobStatus.PENDING),
    onComplete: (job) => {
      setExportJob(job);
      onComplete?.(job);
    },
    onError: (errorMessage) => {
      setError(errorMessage);
    }
  });

  // Load available fields on mount
  useEffect(() => {
    const loadAvailableFields = async () => {
      try {
        const fields = await bulkExportService.getAvailableFields();
        setAvailableFields(fields);
      } catch (err) {
        console.error('Failed to load available fields:', err);
        // Fallback to default fields
        setAvailableFields([
          { key: 'email', label: 'E-posta', type: 'string', required: true },
          { key: 'firstName', label: 'Ad', type: 'string', required: false },
          { key: 'lastName', label: 'Soyad', type: 'string', required: false },
          { key: 'company', label: 'Şirket', type: 'string', required: false },
          { key: 'phone', label: 'Telefon', type: 'string', required: false },
          { key: 'status', label: 'Durum', type: 'enum', required: false },
          { key: 'location', label: 'Konum', type: 'string', required: false },
          { key: 'subscribedAt', label: 'Abone Tarihi', type: 'date', required: false },
          { key: 'lastUpdated', label: 'Son Güncelleme', type: 'date', required: false },
          { key: 'sent', label: 'Gönderilen', type: 'number', required: false },
          { key: 'opens', label: 'Açılma', type: 'number', required: false },
          { key: 'clicks', label: 'Tıklama', type: 'number', required: false }
        ]);
      }
    };

    loadAvailableFields();
  }, []);

  const handleStatusToggle = (status: SubscriberStatus, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      status: checked 
        ? [...(prev.status || []), status]
        : (prev.status || []).filter(s => s !== status)
    }));
  };

  const handleGroupToggle = (groupId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      groupIds: checked 
        ? [...(prev.groupIds || []), groupId]
        : (prev.groupIds || []).filter(id => id !== groupId)
    }));
  };

  const handleSegmentToggle = (segmentId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      segmentIds: checked 
        ? [...(prev.segmentIds || []), segmentId]
        : (prev.segmentIds || []).filter(id => id !== segmentId)
    }));
  };

  const handleValidationStatusToggle = (status: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      validationStatus: checked 
        ? [...(prev.validationStatus || []), status]
        : (prev.validationStatus || []).filter(s => s !== status)
    }));
  };

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      fields: checked 
        ? [...prev.fields, fieldKey]
        : prev.fields.filter(f => f !== fieldKey)
    }));
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setSelectedDateRange(range);
    const dateRange = range?.from && range.to ? { start: range.from, end: range.to } : undefined;
    setFilters(prev => ({
      ...prev,
      dateRange
    }));
  };

  const loadExportPreview = useCallback(async () => {
    setIsLoadingPreview(true);
    setError(null);
    
    try {
      const preview = await bulkExportService.getExportPreview(filters, options);
      setExportPreview(preview);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Önizleme yüklenemedi');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [filters, options]);

  const handleCreateExport = async () => {
    setIsCreatingJob(true);
    setError(null);
    
    try {
      const job = await bulkExportService.createExportJob({
        filters,
        options
      });
      
      setExportJob(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dışa aktarma işi oluşturulamadı');
    } finally {
      setIsCreatingJob(false);
    }
  };

  const getSelectedFiltersCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.groupIds?.length) count++;
    if (filters.segmentIds?.length) count++;
    if (filters.dateRange) count++;
    if (filters.validationStatus?.length) count++;
    return count;
  };

  const renderFilterSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Abone Filtreleri
          {getSelectedFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-2">
              {getSelectedFiltersCount()} filtre
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Dışa aktarılacak aboneleri filtrelemek için kriterleri seçin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Abone Durumu</Label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(status => (
              <div key={status.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status.value}`}
                  checked={filters.status?.includes(status.value)}
                  onCheckedChange={(checked) => handleStatusToggle(status.value, checked as boolean)}
                />
                <Label htmlFor={`status-${status.value}`}>
                  <Badge variant="secondary" className={cn("text-xs", status.color)}>
                    {status.label}
                  </Badge>
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Groups Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
            <Users className="h-4 w-4" />
            Gruplar
          </Label>
          <div className="space-y-2">
            {availableGroups.map(group => (
              <div key={group.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`group-${group.id}`}
                  checked={filters.groupIds?.includes(group.id)}
                  onCheckedChange={(checked) => handleGroupToggle(group.id, checked as boolean)}
                />
                <Label htmlFor={`group-${group.id}`} className="flex-1">
                  <div className="font-medium">{group.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {group.subscriberCount} abone
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Segments Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Segmentler</Label>
          <div className="space-y-2">
            {availableSegments.map(segment => (
              <div key={segment.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`segment-${segment.id}`}
                  checked={filters.segmentIds?.includes(segment.id)}
                  onCheckedChange={(checked) => handleSegmentToggle(segment.id, checked as boolean)}
                />
                <Label htmlFor={`segment-${segment.id}`} className="flex-1">
                  <div className="font-medium">{segment.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {segment.subscriberCount} abone • %{segment.openRate} açılma oranı
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Date Range Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Tarih Aralığı
          </Label>
          <DatePickerWithRange
            date={selectedDateRange}
            onDateChange={handleDateRangeChange}
          />
        </div>

        <Separator />

        {/* Validation Status Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Doğrulama Durumu</Label>
          <div className="flex flex-wrap gap-2">
            {validationStatusOptions.map(status => (
              <div key={status.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`validation-${status.value}`}
                  checked={filters.validationStatus?.includes(status.value)}
                  onCheckedChange={(checked) => handleValidationStatusToggle(status.value, checked as boolean)}
                />
                <Label htmlFor={`validation-${status.value}`}>
                  <Badge variant="secondary" className={cn("text-xs", status.color)}>
                    {status.label}
                  </Badge>
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFieldSelectionSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Alan Seçimi
          <Badge variant="secondary" className="ml-2">
            {options.fields.length} alan
          </Badge>
        </CardTitle>
        <CardDescription>
          Dışa aktarma dosyasına dahil edilecek alanları seçin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableFields.map(field => (
            <div key={field.key} className="flex items-center space-x-2">
              <Checkbox
                id={`field-${field.key}`}
                checked={options.fields.includes(field.key)}
                onCheckedChange={(checked) => handleFieldToggle(field.key, checked as boolean)}
                disabled={field.required}
              />
              <Label htmlFor={`field-${field.key}`} className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{field.label}</span>
                  {field.required && (
                    <Badge variant="outline" className="text-xs">
                      Zorunlu
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground capitalize">
                  {field.type}
                </div>
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderOptionsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Dışa Aktarma Seçenekleri
        </CardTitle>
        <CardDescription>
          Dosya formatı ve diğer seçenekleri yapılandırın.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="format">Dosya Formatı</Label>
          <Select
            value={options.format}
            onValueChange={(value: 'csv' | 'xlsx') => 
              setOptions(prev => ({ ...prev, format: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV (.csv)</SelectItem>
              <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-metadata"
            checked={options.includeMetadata}
            onCheckedChange={(checked) => 
              setOptions(prev => ({ ...prev, includeMetadata: checked as boolean }))
            }
          />
          <Label htmlFor="include-metadata">
            <div className="font-medium">Metadata Dahil Et</div>
            <div className="text-sm text-muted-foreground">
              Ek abone bilgilerini ve istatistikleri dahil et
            </div>
          </Label>
        </div>

        <div>
          <Label htmlFor="batch-size">
            Batch Boyutu ({options.batchSize})
          </Label>
          <Input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={options.batchSize}
            onChange={(e) => 
              setOptions(prev => ({ 
                ...prev, 
                batchSize: parseInt(e.target.value) 
              }))
            }
            className="mt-2"
          />
          <div className="text-sm text-muted-foreground mt-1">
            Büyük dosyalar için daha küçük batch boyutu kullanın.
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPreviewSection = () => {
    if (!showPreview || !exportPreview) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Dışa Aktarma Önizlemesi
          </CardTitle>
          <CardDescription>
            Seçilen filtrelerle eşleşen kayıt sayısı ve tahmini dosya boyutu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{exportPreview.totalRecords}</div>
              <div className="text-sm text-muted-foreground">Toplam Kayıt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{options.fields.length}</div>
              <div className="text-sm text-muted-foreground">Seçilen Alan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{exportPreview.estimatedFileSize}</div>
              <div className="text-sm text-muted-foreground">Tahmini Boyut</div>
            </div>
          </div>

          {!exportPreview.sampleRecords && (
            <p className="mt-4 text-sm text-muted-foreground">Örnek kayıt önizlemesi henüz desteklenmiyor; kayıt sayısı ve boyut tahmini sunucudan alınır.</p>
          )}
          {exportPreview.sampleRecords && exportPreview.sampleRecords.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm font-medium mb-2 block">Örnek Kayıtlar</Label>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border rounded">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {options.fields.map(fieldKey => {
                        const field = availableFields.find(f => f.key === fieldKey);
                        return (
                          <th key={fieldKey} className="text-left p-2 font-medium">
                            {field?.label || fieldKey}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {exportPreview.sampleRecords.slice(0, 3).map((record, index) => (
                      <tr key={index} className="border-b">
                        {options.fields.map(fieldKey => (
                          <td key={fieldKey} className="p-2">
                            {String(record[fieldKey] ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (exportJob && (exportJob.status === ExportJobStatus.PROCESSING || exportJob.status === ExportJobStatus.PENDING)) {
    const currentJob = progressJob || exportJob;
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Dışa Aktarma İşleniyor</h3>
          <p className="text-muted-foreground">
            Verileriniz hazırlanıyor, lütfen bekleyin...
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">İşlem Durumu</CardTitle>
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
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">İlerleme</span>
              <span className="text-sm text-muted-foreground">
                {currentJob.processedRecords} / {currentJob.totalRecords}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentJob.progressPercentage}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{currentJob.totalRecords}</div>
                <div className="text-sm text-muted-foreground">Toplam Kayıt</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{currentJob.processedRecords}</div>
                <div className="text-sm text-muted-foreground">İşlenen</div>
              </div>
            </div>

            {currentJob.status === ExportJobStatus.PROCESSING && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                İşleniyor...
              </div>
            )}
          </CardContent>
        </Card>

        {(error || progressError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || progressError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Abone Dışa Aktarma</h3>
        <p className="text-muted-foreground">
          Abone verilerinizi CSV veya Excel formatında dışa aktarın.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {renderFilterSection()}
          {renderOptionsSection()}
        </div>
        
        <div className="space-y-6">
          {renderFieldSelectionSection()}
          {renderPreviewSection()}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={loadExportPreview}
          disabled={isLoadingPreview}
        >
          {isLoadingPreview ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Yükleniyor...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Önizleme
            </>
          )}
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
          
          <Button 
            onClick={handleCreateExport}
            disabled={isCreatingJob || options.fields.length === 0}
          >
            {isCreatingJob ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Dışa Aktarmayı Başlat
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}