'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Users, 
  Filter,
  Download,
  X,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ImportOptions, 
  ImportResult as ImportResultType
} from '@affexai/shared-types';
import bulkImportService, { ImportJob, ImportJobStatus } from '@/lib/api/bulkImportService';
import { ImportProgressTracker } from './import-progress-tracker';
import { ValidationResultsDisplay } from './validation-results-display';
import { ImportResultsDashboard } from './import-results-dashboard';
import { useImportProgress } from '@/hooks/useImportProgress';
import { useCustomFields, MappingField } from '@/hooks/useCustomFields';
import { useGroupsAndSegments, ImportGroup, ImportSegment } from '@/hooks/useGroupsAndSegments';

// Note: Using ImportJob and ImportJobStatus from bulkImportService as the source of truth

// Animated counter hook
function useAnimatedCounter(targetValue: number, duration: number = 300) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  
  useEffect(() => {
    const start = displayValue;
    const diff = targetValue - start;
    const increment = diff / (duration / 16); // 60fps
    
    if (Math.abs(diff) < 1) {
      setDisplayValue(targetValue);
      return;
    }
    
    const timer = setInterval(() => {
      setDisplayValue(prev => {
        const next = prev + increment;
        if ((increment > 0 && next >= targetValue) || (increment < 0 && next <= targetValue)) {
          clearInterval(timer);
          return targetValue;
        }
        return next;
      });
    }, 16);
    
    return () => clearInterval(timer);
  }, [targetValue, duration]);
  
  return Math.round(displayValue);
}

interface ImportWizardProps {
  onComplete: (result: ImportResultType) => void;
  onCancel: () => void;
}

type WizardStep = 'upload' | 'configure' | 'validate' | 'results';

interface CsvPreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

interface ValidationStats {
  total: number;
  valid: number;
  invalid: number;
  risky: number;
  duplicates: number;
}

export function ImportWizard({ onComplete, onCancel }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreviewData | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    groupIds: [],
    segmentIds: [],
    duplicateHandling: 'skip',
    validationThreshold: 70,
    batchSize: 1000,
    columnMapping: {}
  });
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [validationStats, setValidationStats] = useState<ValidationStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Processing stats tracking
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [lastProcessedCount, setLastProcessedCount] = useState(0);
  const [recordsPerSecond, setRecordsPerSecond] = useState(0);

  // Auth check
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Use custom hooks for data fetching
  const { mappingFields, loading: fieldsLoading, error: fieldsError } = useCustomFields();
  const { groups: availableGroups, segments: availableSegments, loading: groupsLoading, error: groupsError } = useGroupsAndSegments();

  // Memoize callbacks to prevent infinite re-renders
  const handleImportComplete = useCallback((job: ImportJob) => {
    setImportJob(job);
    setValidationStats({
      total: job.totalRecords,
      valid: job.validRecords,
      invalid: job.invalidRecords,
      risky: job.riskyRecords || 0,
      duplicates: job.duplicateRecords
    });
    setCurrentStep('results');
  }, []);

  const handleImportError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  // Use the progress tracking hook
  const {
    job: progressJob,
    isLoading: isProgressLoading,
    error: progressError,
    isPolling
  } = useImportProgress({
    jobId: importJob?.id || null,
    userId: user?.id || '',
    enabled: currentStep === 'validate' && !!importJob?.id,
    onComplete: handleImportComplete,
    onError: handleImportError
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate processing stats when progressJob updates
  useEffect(() => {
    if (!progressJob) return;
    
    const currentProcessed = (progressJob.validRecords || 0) + 
                            (progressJob.riskyRecords || 0) + 
                            (progressJob.invalidRecords || 0) + 
                            (progressJob.duplicateRecords || 0);
    
    // Initialize start time on first update
    if (!startTime && currentProcessed > 0) {
      setStartTime(new Date());
      setLastProcessedCount(currentProcessed);
      return;
    }
    
    // Calculate records per second
    if (startTime && currentProcessed > lastProcessedCount) {
      const elapsed = (Date.now() - startTime.getTime()) / 1000; // seconds
      const rate = currentProcessed / elapsed;
      setRecordsPerSecond(Math.round(rate));
      setLastProcessedCount(currentProcessed);
    }
  }, [progressJob, startTime, lastProcessedCount]);

  // Ensure isProcessing is false when job status becomes completed
  useEffect(() => {
    const current = progressJob || importJob;
    if (current?.status === ImportJobStatus.COMPLETED && isProcessing) {
      setIsProcessing(false);
    }
  }, [progressJob, importJob, isProcessing]);

  // Animated counters for all metrics (must be called at component level, not in render)
  const currentJob = progressJob || importJob;
  
  // Debug log
  useEffect(() => {
    console.log('[ImportWizard] Job state updated:', {
      hasProgressJob: !!progressJob,
      hasImportJob: !!importJob,
      currentJobId: currentJob?.id,
      currentJobStatus: currentJob?.status,
      totalRecords: currentJob?.totalRecords,
      processedRecords: currentJob?.processedRecords,
      validRecords: currentJob?.validRecords,
      isPolling
    });
  }, [progressJob, importJob, currentJob, isPolling]);
  
  const animatedProcessedRecords = useAnimatedCounter(currentJob?.processedRecords || 0, 300);
  const animatedValidRecords = useAnimatedCounter(currentJob?.validRecords || 0, 300);
  const animatedRiskyRecords = useAnimatedCounter(currentJob?.riskyRecords || 0, 300);
  const animatedInvalidRecords = useAnimatedCounter(currentJob?.invalidRecords || 0, 300);
  const animatedDuplicateRecords = useAnimatedCounter(currentJob?.duplicateRecords || 0, 300);

  const steps = [
    { key: 'upload', title: 'Dosya Yükle', icon: Upload },
    { key: 'configure', title: 'Yapılandır', icon: Settings },
    { key: 'validate', title: 'Doğrula', icon: CheckCircle },
    { key: 'results', title: 'Sonuçlar', icon: FileText }
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileSelect(csvFile);
    } else {
      setError('Lütfen geçerli bir CSV dosyası seçin.');
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    
    // Parse CSV for preview
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1, 6).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );
      
      setCsvPreview({
        headers,
        rows,
        totalRows: lines.length - 1
      });

      // Auto-detect column mapping
      const autoMapping: Record<string, string> = {};
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        
        // Check against available mapping fields
        const matchingField = mappingFields.find(field => {
          const fieldKey = field.key.replace('custom_', '');
          const fieldLabel = field.label.toLowerCase();
          
          return (
            lowerHeader.includes(fieldKey) ||
            lowerHeader.includes(fieldLabel) ||
            (fieldKey === 'email' && (lowerHeader.includes('e-mail') || lowerHeader.includes('mail'))) ||
            (fieldKey === 'firstName' && (lowerHeader.includes('first') || lowerHeader.includes('ad'))) ||
            (fieldKey === 'lastName' && (lowerHeader.includes('last') || lowerHeader.includes('soyad'))) ||
            (fieldKey === 'company' && (lowerHeader.includes('şirket') || lowerHeader.includes('firma'))) ||
            (fieldKey === 'phone' && (lowerHeader.includes('telefon') || lowerHeader.includes('tel'))) ||
            (fieldKey === 'location' && (lowerHeader.includes('konum') || lowerHeader.includes('adres')))
          );
        });
        
        if (matchingField) {
          autoMapping[header] = matchingField.key;
        }
      });
      
      setColumnMapping(autoMapping);
      setImportOptions((prev: ImportOptions) => ({ ...prev, columnMapping: autoMapping }));
      
    } catch (err) {
      setError('CSV dosyası okunurken hata oluştu.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleColumnMappingChange = (csvColumn: string, fieldKey: string) => {
    const newMapping = { ...columnMapping };
    
    // Remove this field from other columns
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === fieldKey && key !== csvColumn) {
        delete newMapping[key];
      }
    });
    
    if (fieldKey === 'none') {
      delete newMapping[csvColumn];
    } else {
      newMapping[csvColumn] = fieldKey;
    }
    
    setColumnMapping(newMapping);
    setImportOptions((prev: ImportOptions) => ({ ...prev, columnMapping: newMapping }));
  };

  const handleGroupToggle = (groupId: string, checked: boolean) => {
    setImportOptions((prev: ImportOptions) => ({
      ...prev,
      groupIds: checked 
        ? [...(prev.groupIds || []), groupId]
        : (prev.groupIds || []).filter((id: string) => id !== groupId)
    }));
  };

  const handleSegmentToggle = (segmentId: string, checked: boolean) => {
    setImportOptions((prev: ImportOptions) => ({
      ...prev,
      segmentIds: checked 
        ? [...(prev.segmentIds || []), segmentId]
        : (prev.segmentIds || []).filter((id: string) => id !== segmentId)
    }));
  };

  const startImport = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const job = await bulkImportService.uploadFile({
        file: selectedFile,
        options: importOptions
      });
      
      console.log('[ImportWizard] Job received from backend:', {
        id: job.id,
        status: job.status,
        totalRecords: job.totalRecords,
        processedRecords: job.processedRecords
      });
      
      setImportJob(job);
      setCurrentStep('validate');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata oluştu');
    } finally {
      setIsProcessing(false);
    }
  };



  const handleDownloadReport = async () => {
    if (!importJob) return;
    
    try {
      const blob = await bulkImportService.downloadReport(importJob.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import-report-${importJob.id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Rapor indirilemedi');
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'upload':
        return selectedFile && csvPreview;
      case 'configure':
        return Object.values(columnMapping).includes('email');
      case 'validate': {
        // Consider the polling job (progressJob) as the source of truth during validation
        const current = progressJob || importJob;
        return current?.status === ImportJobStatus.COMPLETED;
      }
      default:
        return false;
    }
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'upload':
        setCurrentStep('configure');
        break;
      case 'configure':
        startImport();
        break;
      case 'validate':
        setCurrentStep('results');
        break;
    }
  };

  const handlePrevious = () => {
    switch (currentStep) {
      case 'configure':
        setCurrentStep('upload');
        break;
      case 'validate':
        setCurrentStep('configure');
        break;
      case 'results':
        setCurrentStep('validate');
        break;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const isActive = step.key === currentStep;
        const isCompleted = steps.findIndex(s => s.key === currentStep) > index;
        const Icon = step.icon;
        
        return (
          <div key={step.key} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
              isActive && "border-primary bg-primary text-primary-foreground",
              isCompleted && "border-green-500 bg-green-500 text-white",
              !isActive && !isCompleted && "border-muted-foreground text-muted-foreground"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="ml-3 text-sm">
              <div className={cn(
                "font-medium",
                isActive && "text-primary",
                isCompleted && "text-green-600"
              )}>
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "w-12 h-0.5 mx-4",
                isCompleted ? "bg-green-500" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">CSV Dosyası Yükleyin</h3>
        <p className="text-muted-foreground">
          Abone bilgilerini içeren CSV dosyanızı seçin veya sürükleyip bırakın.
        </p>
      </div>

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          selectedFile && "border-green-500 bg-green-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {selectedFile ? (
          <div className="space-y-2">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div className="font-medium">{selectedFile.name}</div>
            <div className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="font-medium">CSV dosyası seçin</div>
            <div className="text-sm text-muted-foreground">
              Dosyayı buraya sürükleyin veya tıklayarak seçin
            </div>
          </div>
        )}
      </div>

      {csvPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dosya Önizlemesi</CardTitle>
            <CardDescription>
              İlk 5 satır gösteriliyor. Toplam {csvPreview.totalRows} satır bulundu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {csvPreview.headers.map((header, index) => (
                      <th key={index} className="text-left p-2 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderConfigureStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">İçe Aktarma Ayarları</h3>
        <p className="text-muted-foreground">
          Sütun eşleştirmesi yapın ve içe aktarma seçeneklerini belirleyin.
        </p>
      </div>

      {/* Column Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sütun Eşleştirmesi</CardTitle>
          <CardDescription>
            CSV sütunlarını abone alanlarıyla eşleştirin. Email alanı zorunludur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {csvPreview?.headers.map(header => (
            <div key={header} className="flex items-center gap-4">
              <div className="w-32 font-medium text-sm">{header}</div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Select
                value={columnMapping[header] || 'none'}
                onValueChange={(value) => handleColumnMappingChange(header, value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Eşleştirme</SelectItem>
                  {mappingFields.map(field => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label} {field.required && '*'}
                      {field.key.startsWith('custom_') && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Özel
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Loading state for groups and segments */}
      {(groupsLoading || fieldsLoading) && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Gruplar ve segmentler yükleniyor...
          </AlertDescription>
        </Alert>
      )}

      {/* Error state for groups and segments */}
      {(groupsError || fieldsError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Veri yüklenirken hata oluştu: {groupsError || fieldsError}
          </AlertDescription>
        </Alert>
      )}

      {/* Groups Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Gruplar
          </CardTitle>
          <CardDescription>
            İçe aktarılan abonelerin ekleneceği grupları seçin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableGroups.map(group => (
            <div key={group.id} className="flex items-center space-x-2">
              <Checkbox
                id={`group-${group.id}`}
                checked={importOptions.groupIds?.includes(group.id)}
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
        </CardContent>
      </Card>

      {/* Segments Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Segmentler
          </CardTitle>
          <CardDescription>
            İçe aktarılan abonelerin ekleneceği segmentleri seçin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableSegments.map(segment => (
            <div key={segment.id} className="flex items-center space-x-2">
              <Checkbox
                id={`segment-${segment.id}`}
                checked={importOptions.segmentIds?.includes(segment.id)}
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
        </CardContent>
      </Card>

      {/* Import Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">İçe Aktarma Seçenekleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="duplicate-handling">Tekrar Eden E-postalar</Label>
            <Select
              value={importOptions.duplicateHandling}
              onValueChange={(value: 'skip' | 'update' | 'replace') => 
                setImportOptions((prev: ImportOptions) => ({ ...prev, duplicateHandling: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skip">Atla</SelectItem>
                <SelectItem value="update">Güncelle</SelectItem>
                <SelectItem value="replace">Değiştir</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="validation-threshold">
              Doğrulama Eşiği (%{importOptions.validationThreshold})
            </Label>
            <Input
              type="range"
              min="0"
              max="100"
              value={importOptions.validationThreshold}
              onChange={(e) => 
                setImportOptions((prev: ImportOptions) => ({ 
                  ...prev, 
                  validationThreshold: parseInt(e.target.value) 
                }))
              }
              className="mt-2"
            />
            <div className="text-sm text-muted-foreground mt-1">
              Bu değerin altındaki güven skoruna sahip e-postalar riskli olarak işaretlenir.
            </div>
          </div>
        </CardContent>
      </Card>

      {!Object.values(columnMapping).includes('email') && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Email alanı eşleştirmesi zorunludur. Lütfen bir sütunu email alanıyla eşleştirin.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderValidateStep = () => (
    <div className="space-y-6">
      {/* Multi-Stage Progress Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">İçe Aktarma İşlemi</h3>
            <p className="text-sm text-gray-600 mt-1">
              {(() => {
                const currentJob = progressJob || importJob;
                if (!currentJob) return 'Hazırlanıyor...';
                if (currentJob.status === ImportJobStatus.COMPLETED) return 'İşlem başarıyla tamamlandı!';
                if (currentJob.status === ImportJobStatus.FAILED) return 'İşlem başarısız oldu.';
                return `${currentJob.processedRecords}/${currentJob.totalRecords} kayıt işleniyor...`;
              })()}
            </p>
          </div>
          {isPolling && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Canlı</span>
            </div>
          )}
        </div>

        {/* Stage Progress Indicators */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Dosya Yüklendi</span>
          </div>
          <div className="h-0.5 flex-1 bg-blue-200"></div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors",
            (progressJob || importJob)?.status === ImportJobStatus.PROCESSING 
              ? "bg-blue-100" 
              : (progressJob || importJob)?.status === ImportJobStatus.COMPLETED
                ? "bg-green-100"
                : "bg-gray-100"
          )}>
            <RefreshCw className={cn(
              "h-4 w-4",
              (progressJob || importJob)?.status === ImportJobStatus.PROCESSING && "animate-spin text-blue-600",
              (progressJob || importJob)?.status === ImportJobStatus.COMPLETED && "text-green-600",
              (progressJob || importJob)?.status !== ImportJobStatus.PROCESSING && (progressJob || importJob)?.status !== ImportJobStatus.COMPLETED && "text-gray-400"
            )} />
            <span className={cn(
              "text-xs font-medium",
              (progressJob || importJob)?.status === ImportJobStatus.PROCESSING && "text-blue-700",
              (progressJob || importJob)?.status === ImportJobStatus.COMPLETED && "text-green-700",
              (progressJob || importJob)?.status !== ImportJobStatus.PROCESSING && (progressJob || importJob)?.status !== ImportJobStatus.COMPLETED && "text-gray-500"
            )}>
              Doğrulanıyor
            </span>
          </div>
          <div className="h-0.5 flex-1 bg-gray-200"></div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full",
            (progressJob || importJob)?.status === ImportJobStatus.COMPLETED 
              ? "bg-green-100" 
              : "bg-gray-100"
          )}>
            <CheckCircle className={cn(
              "h-4 w-4",
              (progressJob || importJob)?.status === ImportJobStatus.COMPLETED ? "text-green-600" : "text-gray-400"
            )} />
            <span className={cn(
              "text-xs font-medium",
              (progressJob || importJob)?.status === ImportJobStatus.COMPLETED ? "text-green-700" : "text-gray-500"
            )}>
              Tamamlandı
            </span>
          </div>
        </div>
      </div>

      {(progressJob || importJob) && (
        <>
          {/* Overall Progress */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Genel İlerleme</CardTitle>
                  <CardDescription className="mt-1">
                    {(() => {
                      const currentJob = progressJob || importJob;
                      if (!currentJob) return '';
                      const percentage = currentJob.progressPercentage || 
                        ((currentJob.processedRecords / currentJob.totalRecords) * 100);
                      return `%${percentage.toFixed(1)} tamamlandı`;
                    })()}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {animatedProcessedRecords.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}/{' '}
                      {((progressJob || importJob)?.totalRecords || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">kayıt</div>
                </div>
              </div>
              
              {/* Processing Stats - ETA and Speed */}
              {recordsPerSecond > 0 && (progressJob || importJob)?.status === ImportJobStatus.PROCESSING && (
                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-gray-700">{recordsPerSecond.toLocaleString()}</span>
                    <span className="text-gray-500">kayıt/sn</span>
                  </div>
                  {(() => {
                    const currentJob = progressJob || importJob;
                    if (!currentJob) return null;
                    const remaining = currentJob.totalRecords - currentJob.processedRecords;
                    const etaSeconds = recordsPerSecond > 0 ? Math.ceil(remaining / recordsPerSecond) : 0;
                    const minutes = Math.floor(etaSeconds / 60);
                    const seconds = etaSeconds % 60;
                    
                    if (etaSeconds > 0) {
                      return (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-500">Tahmini kalan:</span>
                          <span className="font-medium text-gray-700">
                            {minutes > 0 ? `${minutes}dk ${seconds}sn` : `${seconds}sn`}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Progress 
                value={(() => {
                  const currentJob = progressJob || importJob;
                  if (!currentJob) return 0;
                  return currentJob.progressPercentage || 
                    ((currentJob.processedRecords / currentJob.totalRecords) * 100);
                })()} 
                className="h-3" 
              />
            </CardContent>
          </Card>

          {/* Category Breakdown with Individual Progress Bars */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Doğrulama Sonuçları</CardTitle>
              <CardDescription>
                Her kategori için detaylı analiz ve ilerleme durumu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const currentJob = progressJob || importJob;
                if (!currentJob) return null;
                const total = (currentJob.totalRecords && currentJob.totalRecords > 0) ? currentJob.totalRecords : 1;
                const validCount = currentJob.validRecords ?? 0;
                const riskyCount = currentJob.riskyRecords ?? 0;
                const invalidCount = currentJob.invalidRecords ?? 0;
                const duplicateCount = currentJob.duplicateRecords ?? 0;
                const processedCount = currentJob.processedRecords ?? 0;
                const progressPct = currentJob.progressPercentage ?? ((processedCount / total) * 100);

                return (
                  <>
                    {/* Valid Emails */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Geçerli Email'ler</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-green-600">
                            {animatedValidRecords.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({((validCount / total) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-green-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-green-500 h-full transition-all duration-300"
                          style={{ width: `${(validCount / total) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Risky Emails */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-700">Riskli Email'ler</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-yellow-600">
                            {animatedRiskyRecords.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({((riskyCount / total) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-yellow-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-yellow-500 h-full transition-all duration-300"
                          style={{ width: `${(riskyCount / total) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Invalid Emails */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-700">Geçersiz Email'ler</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-red-600">
                            {animatedInvalidRecords.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({((invalidCount / total) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-red-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-red-500 h-full transition-all duration-300"
                          style={{ width: `${(invalidCount / total) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Duplicate Emails */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium text-blue-700">Tekrar Eden Email'ler</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-600">
                            {animatedDuplicateRecords.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({((duplicateCount / total) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full transition-all duration-300"
                          style={{ width: `${(duplicateCount / total) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Quality Score */}
                    <div className="mt-6 p-4 rounded-lg bg-gray-900 border text-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Kalite Skoru
                        </span>
                        <div className="flex items-center gap-1">
                          {((validCount / total) * 100) >= 80 ? (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                              Mükemmel
                            </span>
                          ) : ((validCount / total) * 100) >= 60 ? (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                              İyi
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                              Düşük
                            </span>
                          )}
                          <span className="font-bold ml-2">
                            {((validCount / total) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={(validCount / total) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground mt-2">
                        Geçerli email oranına göre hesaplanmıştır
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </>
      )}

      {(error || progressError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || progressError}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderResultsStep = () => {
    const finalJob = progressJob || importJob;
    
    if (!finalJob) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">İçe aktarma bilgileri bulunamadı.</p>
        </div>
      );
    }

    return (
      <ImportResultsDashboard
          job={finalJob}
          onClose={() => onComplete({} as ImportResultType)}
          onNewImport={() => {
            setCurrentStep('upload');
            setImportJob(null);
            setSelectedFile(null);
            setCsvPreview(null);
            setError(null);
          }}
        />
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return renderUploadStep();
      case 'configure':
        return renderConfigureStep();
      case 'validate':
        return renderValidateStep();
      case 'results':
        return renderResultsStep();
      default:
        return null;
    }
  };

  // Auth check
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Yetkilendirme kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Giriş Gerekli</h3>
          <p className="text-muted-foreground mb-4">Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Giriş Yap
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {renderStepIndicator()}
      
      <div className="min-h-[400px]">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <div>
          {currentStep !== 'upload' && currentStep !== 'results' && (
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
          
          {currentStep !== 'results' && (
            <Button 
              onClick={handleNext}
              disabled={!canProceedToNext() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  İşleniyor...
                </>
              ) : currentStep === 'configure' ? (
                <>
                  İçe Aktarmayı Başlat
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  İleri
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}