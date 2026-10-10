'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  MousePointer,
  DollarSign,
  Target,
  Trophy,
  TestTube,
  Download,
  RefreshCw,
  Calendar,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import analyticsService, {
  AnalyticsDashboardData,
  OverviewMetrics
} from '@/lib/api/analyticsService';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';

// Chart components
import SubscriberGrowthChart from '@/components/admin/analytics/SubscriberGrowthChart';
import EngagementChart from '@/components/admin/analytics/EngagementChart';
import RevenueChart from '@/components/admin/analytics/RevenueChart';
import CampaignPerformanceTable from '@/components/admin/analytics/CampaignPerformanceTable';

import { useParams } from 'next/navigation';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { EmailModuleNav } from '@/components/admin/email/EmailModuleNav';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const { tenant } = useParams();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('day');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
      const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

      const data = await analyticsService.getDashboardData(startDate, endDate, period);
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Analytics verileri yüklenirken bir hata oluştu.');
      toast({
        title: 'Hata',
        description: 'Analytics verileri yüklenemedi.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);

    toast({
      title: 'Güncellendi',
      description: 'Analytics verileri başarıyla güncellendi.',
    });
  };

  const handleExport = async (type: 'campaigns' | 'subscribers' | 'engagement' | 'revenue') => {
    try {
      const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
      const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

      const blob = await analyticsService.exportData(type, 'csv', startDate, endDate);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'İndirildi',
        description: `${type} verileri başarıyla indirildi.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Hata',
        description: 'Veri indirme işlemi başarısız.',
        variant: 'destructive',
      });
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-GB').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-[#9df425]" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-white/20" />;
    }
  };

  return (
    <BccEditorialWrapper
      headerTitle="Transmission Telemetry"
      headerBadge="Metrics"
      moduleNav={<EmailModuleNav />}
      telemetryData={[
        { label: "SIGNAL_STRENGTH", value: dashboardData ? formatPercentage(dashboardData.overview.averageOpenRate) : "0%", color: "#9df425" },
        { label: "NODE_PROPAGATION", value: dashboardData ? formatPercentage(dashboardData.overview.subscriberGrowthRate) : "0%", color: "#ff8c00" },
        { label: "YIELD_REVENUE", value: dashboardData ? formatCurrency(dashboardData.overview.totalRevenue) : "$0.00", color: "#9df425" },
        { label: "PACKET_INTEGRITY", value: "99.9%", color: "#ffffff" }
      ]}
    >
      <div className="space-y-12 animate-in fade-in duration-700">
        {/* Analytics Control Interface */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md text-white font-mono uppercase">
          <div className="space-y-1">
            <h2 className="text-[10px] text-white/40 uppercase tracking-[0.3em]">Telemetry_Protocol</h2>
            <p className="text-[11px] text-white/60 tracking-widest font-bold">Configure temporal window for signal analysis</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={handleRefresh} disabled={refreshing} className="rounded-none border border-white/5 bg-white/5 text-[9px] font-bold uppercase tracking-widest px-4 h-10 hover:text-[#ff8c00]">
              <RefreshCw className={`h-3.5 w-3.5 mr-2 opacity-40 ${refreshing ? 'animate-spin' : ''}`} /> RELOAD_FEED
            </Button>
            <div className="h-10 w-px bg-white/10 hidden sm:block" />
            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger className="w-36 rounded-none bg-white/[0.03] border-white/10 text-[10px] font-mono tracking-widest h-10 uppercase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase text-[9px]">
                <SelectItem value="day" className="focus:bg-white/5">DIURNAL</SelectItem>
                <SelectItem value="week" className="focus:bg-white/5">SEPTENARY</SelectItem>
                <SelectItem value="month" className="focus:bg-white/5">LUNAR_CYCLE</SelectItem>
                <SelectItem value="quarter" className="focus:bg-white/5">QUADRANT</SelectItem>
                <SelectItem value="year" className="focus:bg-white/5">ANNULAR</SelectItem>
              </SelectContent>
            </Select>
            <div className="bg-white/[0.03] border border-white/10 p-0 h-10 flex items-center">
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                className="border-none bg-transparent h-full text-[10px] font-mono tracking-widest uppercase hover:bg-white/5 transition-all px-4"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-48">
            <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-[#ff8c00] animate-pulse">Synchronizing Resonance Data...</div>
          </div>
        ) : error || !dashboardData ? (
          <div className="flex flex-col items-center justify-center py-48 gap-6 border border-white/5 bg-white/[0.01]">
            <div className="text-[11px] font-mono text-red-500 uppercase tracking-widest">{error || 'RES_SYNC_FAILURE'}</div>
            <Button variant="outline" className="rounded-none border-white/10 text-[10px] uppercase tracking-widest px-8" onClick={fetchDashboardData}>
              RE-INITIALIZE
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Core Resonance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <BccHudTile title="SIGNAL_COUNT" subtitle="Total dispatch protocols" icon="podcasts">
                <div className="text-3xl font-bold text-white tracking-tighter tabular-nums mb-2">
                  {formatNumber(dashboardData.overview.totalCampaigns)}
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest">ACTIVE_STREAMS:</span>
                  <Badge variant="outline" className="rounded-none border-[#9df425]/20 bg-[#9df425]/5 text-[#9df425] text-[10px] tabular-nums">
                    {dashboardData.overview.activeCampaigns}
                  </Badge>
                </div>
              </BccHudTile>

              <BccHudTile title="NODE_EXPANSION" subtitle="Registry growth dynamics" icon="diversity_3">
                <div className="text-3xl font-bold text-white tracking-tighter tabular-nums mb-2">
                  {formatNumber(dashboardData.overview.totalSubscribers)}
                </div>
                <div className="flex items-center gap-2 border-t border-white/5 pt-3 mt-4">
                  {getTrendIcon(dashboardData.overview.engagementTrend)}
                  <span className="text-[10px] text-white/60 font-mono tracking-widest">
                    {formatPercentage(dashboardData.overview.subscriberGrowthRate)} VELOCITY
                  </span>
                </div>
              </BccHudTile>

              <BccHudTile title="MEAN_RESONANCE" subtitle="Open/Click signal average" icon="analytics">
                <div className="text-3xl font-bold text-[#9df425] tracking-tighter tabular-nums mb-2">
                  {formatPercentage(dashboardData.overview.averageOpenRate)}
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest">CLICK_SIGNAL:</span>
                  <span className="text-[10px] text-white/80 font-mono font-bold tracking-widest">{formatPercentage(dashboardData.overview.averageClickRate)}</span>
                </div>
              </BccHudTile>

              <BccHudTile title="YIELD_ANALYSIS" subtitle="Financial propagation value" icon="monetization_on">
                <div className="text-3xl font-bold text-[#ff8c00] tracking-tighter tabular-nums mb-2">
                  {formatCurrency(dashboardData.overview.totalRevenue)}
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest">AB_PROTOCOL_HITS:</span>
                  <span className="text-[10px] text-white/80 font-mono font-bold tracking-widest">{dashboardData.overview.activeAbTests} ACTIVE</span>
                </div>
              </BccHudTile>
            </div>

            {/* Analytical Deep Dive */}
            <Tabs defaultValue="overview" className="space-y-10">
              <TabsList className="bg-[#0a0a0a] border border-white/5 p-1 rounded-none h-auto flex flex-wrap">
                {[
                  { id: 'overview', label: 'MACRO_OVERVIEW' },
                  { id: 'campaigns', label: 'SIGNAL_LOG' },
                  { id: 'subscribers', label: 'NODE_DYNAMICS' },
                  { id: 'engagement', label: 'INTERACTION_HEAT' },
                  { id: 'revenue', label: 'EQUITY_YIELD' },
                  { id: 'abtests', label: 'ALGO_SAMPLES' },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="rounded-none border-none py-3 px-6 text-[9px] font-bold uppercase tracking-[0.2em] text-white/20 data-[state=active]:text-[#9df425] data-[state=active]:bg-[#9df425]/5 hover:text-white/60 transition-all font-mono"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="space-y-8 mt-0 outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <BccHudTile title="GROWTH_VORTEX" subtitle="Time-series subscriber acquisition" icon="query_stats">
                    <div className="p-4 bg-white/[0.01] border border-white/5 min-h-[300px] flex items-center justify-center">
                      <SubscriberGrowthChart data={dashboardData.subscriberGrowth} />
                    </div>
                  </BccHudTile>

                  <BccHudTile title="INTERACTION_DENSITY" subtitle="Signal engagement variance" icon="bar_chart">
                    <div className="p-4 bg-white/[0.01] border border-white/5 min-h-[300px] flex items-center justify-center">
                      <EngagementChart data={dashboardData.emailEngagement} />
                    </div>
                  </BccHudTile>
                </div>

                <BccHudTile
                  title="TOP_PERFORMING_SIGNALS"
                  subtitle="Dispatches ranked by macro-resonance score"
                  icon="military_tech"
                  headerAction={
                    <Button variant="outline" size="sm" onClick={() => handleExport('campaigns')} className="rounded-none border-white/10 bg-white/5 text-[8px] font-bold uppercase h-7 px-4">
                      <Download className="h-3 w-3 mr-2 opacity-40" /> EXPORT_DATA
                    </Button>
                  }
                >
                  <div className="border border-white/5 overflow-hidden font-mono uppercase text-[9px]">
                    <CampaignPerformanceTable campaigns={dashboardData.topCampaigns} />
                  </div>
                </BccHudTile>
              </TabsContent>

              <TabsContent value="campaigns" className="mt-0 outline-none">
                <BccHudTile
                  title="FULL_SIGNAL_LOG"
                  subtitle="Comprehensive performance matrix of all dispatches"
                  icon="history_edu"
                  headerAction={
                    <Button variant="outline" size="sm" onClick={() => handleExport('campaigns')} className="rounded-none border-white/10 bg-white/5 text-[8px] font-bold uppercase h-7 px-4">
                      <Download className="h-3 w-3 mr-2 opacity-40" /> EXPORT_LOG
                    </Button>
                  }
                >
                  <div className="border border-white/5 overflow-hidden font-mono uppercase text-[9px]">
                    <CampaignPerformanceTable
                      campaigns={dashboardData.campaignAnalytics.map(c => ({
                        campaignId: c.campaignId,
                        campaignName: c.campaignName,
                        sentAt: c.sentAt,
                        openRate: c.openRate,
                        clickRate: c.clickRate,
                        conversionRate: c.conversionRate,
                        revenue: c.revenue,
                        score: (c.openRate + c.clickRate + c.conversionRate) / 3
                      }))}
                      showAllColumns={true}
                    />
                  </div>
                </BccHudTile>
              </TabsContent>

              <TabsContent value="subscribers" className="mt-0 outline-none">
                <BccHudTile
                  title="NODE_DYNAMICS_REPORT"
                  subtitle="Advanced breakdown of subscriber churn and acquisition"
                  icon="group_work"
                  headerAction={
                    <Button variant="outline" size="sm" onClick={() => handleExport('subscribers')} className="rounded-none border-white/10 bg-white/5 text-[8px] font-bold uppercase h-7 px-4">
                      <Download className="h-3 w-3 mr-2 opacity-40" /> EXPORT_DYNAMICS
                    </Button>
                  }
                >
                  <div className="p-6 bg-white/[0.01] border border-white/5 min-h-[400px]">
                    <SubscriberGrowthChart data={dashboardData.subscriberGrowth} showDetails={true} />
                  </div>
                </BccHudTile>
              </TabsContent>

              <TabsContent value="engagement" className="mt-0 outline-none">
                <BccHudTile
                  title="SIGNAL_INTERACTION_MATRIX"
                  subtitle="Deep-packet analysis of user open/click behavior"
                  icon="leak_add"
                  headerAction={
                    <Button variant="outline" size="sm" onClick={() => handleExport('engagement')} className="rounded-none border-white/10 bg-white/5 text-[8px] font-bold uppercase h-7 px-4">
                      <Download className="h-3 w-3 mr-2 opacity-40" /> EXPORT_SIGNAL
                    </Button>
                  }
                >
                  <div className="p-6 bg-white/[0.01] border border-white/5 min-h-[400px]">
                    <EngagementChart data={dashboardData.emailEngagement} showDetails={true} />
                  </div>
                </BccHudTile>
              </TabsContent>

              <TabsContent value="revenue" className="mt-0 outline-none">
                <BccHudTile
                  title="PROPAGATION_EQUITY_FLOW"
                  subtitle="Monetary yield trajectory of transmission streams"
                  icon="account_balance_wallet"
                  headerAction={
                    <Button variant="outline" size="sm" onClick={() => handleExport('revenue')} className="rounded-none border-white/10 bg-white/5 text-[8px] font-bold uppercase h-7 px-4">
                      <Download className="h-3 w-3 mr-2 opacity-40" /> EXPORT_YIELD
                    </Button>
                  }
                >
                  <div className="p-6 bg-white/[0.01] border border-white/5 min-h-[400px]">
                    <RevenueChart data={dashboardData.revenueMetrics} />
                  </div>
                </BccHudTile>
              </TabsContent>

              <TabsContent value="abtests" className="mt-0 outline-none">
                <BccHudTile title="ALGORITHMIC_SAMPLE_VARIANTS" subtitle="Performance of competing transmission protocols" icon="science">
                  <div className="space-y-4">
                    {dashboardData.abTestSummary.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 gap-6 border border-dashed border-white/5 bg-white/[0.01]">
                        <TestTube className="h-10 w-10 text-white/10" />
                        <div className="text-center space-y-2">
                          <h3 className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/60 font-bold">Zero samples detected</h3>
                          <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">
                            Initialize transmission A/B protocols to optimize signal yield.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 font-mono uppercase">
                        {dashboardData.abTestSummary.map((test) => (
                          <div key={test.testId} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/10 group hover:border-[#9df425]/40 transition-all">
                            <div className="space-y-1">
                              <h4 className="text-[11px] font-bold text-white group-hover:text-[#9df425] transition-colors">{test.campaignName}</h4>
                              <p className="text-[9px] text-white/30 tracking-widest">
                                PROTO: {test.testType} // EPOCH: {format(new Date(test.createdAt), 'dd.MM.yyyy')}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              {test.status === 'completed' && test.improvementPercentage && (
                                <Badge variant="outline" className="rounded-none border-[#9df425]/20 bg-[#9df425]/5 text-[#9df425] text-[9px] tracking-widest">
                                  <Trophy className="w-3 h-3 mr-2 opacity-60" />
                                  +{test.improvementPercentage.toFixed(1)}% YIELD_GAIN
                                </Badge>
                              )}
                              <Badge variant="outline" className={cn(
                                "rounded-none text-[9px] tracking-widest",
                                test.status === 'completed' ? "border-white/10 text-white/40" : "border-[#ff8c00]/40 text-[#ff8c00] bg-[#ff8c00]/5 animate-pulse"
                              )}>
                                {test.status === 'completed' ? 'SYNC_COMPLETE' : 'SIGNAL_LIVE'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </BccHudTile>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </BccEditorialWrapper>
  );
}