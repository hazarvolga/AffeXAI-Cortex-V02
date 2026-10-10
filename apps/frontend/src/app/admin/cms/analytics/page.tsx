'use client';

import { useState, useEffect } from 'react';
import { AnalyticsOverviewCards } from '@/components/cms/analytics/analytics-overview-cards';
import { AnalyticsTimelineChart } from '@/components/cms/analytics/analytics-timeline-chart';
import { DeviceDistributionChart } from '@/components/cms/analytics/device-distribution-chart';
import { TopComponentsTable } from '@/components/cms/analytics/top-components-table';
import { TimeRangeFilter } from '@/components/cms/analytics/time-range-filter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, BarChart3 } from 'lucide-react';
import { cmsAnalyticsService } from '@/lib/api/cmsAnalyticsService';
import type { AnalyticsTimeRange, DashboardData } from '@/lib/api/cmsAnalyticsService';

export default function CmsAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('last7days');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await cmsAnalyticsService.getDashboardData({
        timeRange,
        customStartDate: customStartDate?.toISOString(),
        customEndDate: customEndDate?.toISOString(),
      });

      setDashboardData(data);
    } catch (err) {
      console.error('Analytics dashboard fetch error:', err);
      setError('Analytics verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, customStartDate, customEndDate]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleExport = async () => {
    // TODO: Implement export functionality
    console.log('Exporting analytics data...');
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            CMS Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Component etkileşim metrikleri ve kullanıcı davranış analizi
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      {/* Time Range Filter */}
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <AnalyticsOverviewCards
        metrics={dashboardData?.overview || {
          totalViews: 0,
          totalInteractions: 0,
          averageEngagementTime: 0,
          conversionRate: 0,
          changeFromPrevious: {
            views: 0,
            interactions: 0,
            engagementTime: 0,
            conversionRate: 0,
          },
        }}
        isLoading={isLoading}
      />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Timeline Chart */}
        <AnalyticsTimelineChart
          data={dashboardData?.timeline || []}
          isLoading={isLoading}
        />

        {/* Device Distribution */}
        <DeviceDistributionChart
          distribution={dashboardData?.deviceDistribution || {
            mobile: 0,
            tablet: 0,
            desktop: 0,
          }}
          isLoading={isLoading}
        />
      </div>

      {/* Top Components Table */}
      <TopComponentsTable
        components={dashboardData?.topComponents || []}
        isLoading={isLoading}
      />

      {/* Recent Sessions Card */}
      {!isLoading && dashboardData && dashboardData.recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Son Oturumlar</CardTitle>
            <CardDescription>
              En son kullanıcı etkileşim oturumları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.recentSessions.slice(0, 5).map((session: any, index: number) => (
                <div
                  key={session.id || index}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      Oturum #{session.id?.slice(0, 8) || index + 1}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {session.totalInteractions || 0} etkileşim
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.deviceType || 'Bilinmiyor'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && dashboardData && dashboardData.overview.totalViews === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Henüz veri yok</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              CMS component'leriniz henüz kullanıcı etkileşimi almamış. Analytics tracker'ı
              component'lerinize ekleyin ve etkileşimleri takip etmeye başlayın.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
