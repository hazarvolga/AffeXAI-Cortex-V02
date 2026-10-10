'use client';

import { useState } from 'react';
import { HeatmapCanvas } from '@/components/cms/analytics/heatmap-canvas';
import { ComponentSelector } from '@/components/cms/analytics/component-selector';
import { TimeRangeFilter } from '@/components/cms/analytics/time-range-filter';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Map, Download, RefreshCw } from 'lucide-react';
import { cmsAnalyticsService } from '@/lib/api/cmsAnalyticsService';
import type { AnalyticsTimeRange, HeatmapData } from '@/lib/api/cmsAnalyticsService';

export default function HeatmapsPage() {
  const [componentId, setComponentId] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('last7days');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHeatmap = async () => {
    if (!componentId.trim()) {
      setError('Lütfen bir Component ID girin');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await cmsAnalyticsService.getHeatmap({
        componentId: componentId.trim(),
        pageUrl: pageUrl.trim() || undefined,
        timeRange,
        customStartDate: customStartDate?.toISOString(),
        customEndDate: customEndDate?.toISOString(),
      });

      setHeatmapData(data);
    } catch (err) {
      console.error('Heatmap fetch error:', err);
      setError('Heatmap verileri yüklenirken bir hata oluştu. Component ID doğru mu?');
      setHeatmapData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!heatmapData) return;

    // Export heatmap as JSON
    const dataStr = JSON.stringify(heatmapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `heatmap-${heatmapData.componentId}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Map className="h-8 w-8 text-primary" />
            Heatmap Görselleştirme
          </h1>
          <p className="text-muted-foreground mt-1">
            Component etkileşimlerini ısı haritası olarak görüntüleyin
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHeatmap}
            disabled={isLoading || !componentId.trim()}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Yükleniyor...' : 'Heatmap Oluştur'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!heatmapData}
          >
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Component Selector */}
        <ComponentSelector
          componentId={componentId}
          pageUrl={pageUrl}
          onComponentIdChange={setComponentId}
          onPageUrlChange={setPageUrl}
        />

        {/* Time Range Filter */}
        <div className="md:col-span-2">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Zaman Aralığı</h3>
            <TimeRangeFilter
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomDateChange={(start, end) => {
                setCustomStartDate(start);
                setCustomEndDate(end);
              }}
            />
          </div>
        </div>
      </div>

      {/* Heatmap Canvas */}
      <HeatmapCanvas data={heatmapData} isLoading={isLoading} />

      {/* Instructions */}
      {!heatmapData && !isLoading && !error && (
        <div className="bg-muted/50 rounded-lg p-6 space-y-3">
          <h3 className="font-semibold">📖 Nasıl Kullanılır?</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Component ID girin:</strong> Tracking kodunuzda kullandığınız
              benzersiz ID'yi yazın
            </li>
            <li>
              <strong>Sayfa URL (opsiyonel):</strong> Belirli bir sayfadaki heatmap'i
              görmek için URL girin
            </li>
            <li>
              <strong>Zaman aralığı seçin:</strong> Hangi dönemdeki verileri görmek
              istediğinizi belirleyin
            </li>
            <li>
              <strong>"Heatmap Oluştur" butonuna tıklayın:</strong> Veriler yüklenecek
              ve görselleştirilecek
            </li>
          </ol>

          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>İpucu:</strong> Heatmap renkleri, kullanıcıların en çok nereye
              tıkladığını gösterir. Mavi renkler az etkileşim, kırmızı renkler yoğun
              etkileşim anlamına gelir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
