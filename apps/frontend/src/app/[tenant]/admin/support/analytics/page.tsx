'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import {
  BarChart,
  LineChart,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  RefreshCw,
  Inbox,
  Shield,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnalyticsDashboard() {
  const [overallStats, setOverallStats] = useState<any>(null);
  const [agentStats, setAgentStats] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all analytics data
      const [overview, agents, categories, trendsData] = await Promise.all([
        fetch('/api/tickets/analytics/overview').then(r => r.json()).catch(() => ({})),
        fetch('/api/tickets/analytics/agents').then(r => r.json()).catch(() => []),
        fetch('/api/tickets/analytics/categories').then(r => r.json()).catch(() => []),
        fetch('/api/tickets/analytics/trends?period=week').then(r => r.json()).catch(() => ({})),
      ]);

      setOverallStats(overview);
      setAgentStats(Array.isArray(agents) ? agents : []);
      setCategoryStats(Array.isArray(categories) ? categories : []);
      setTrends(trendsData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setOverallStats({});
      setAgentStats([]);
      setCategoryStats([]);
      setTrends({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <BccEditorialWrapper
      headerTitle="DESTEK ANALİTİKLERİ"
      headerSubtitle="Ticket performansı, ajan verimliliği ve SLA metrikleri"
      headerBadge="ANALYTICS"
    >
      <div className="space-y-6">
        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BccHudTile title="TOTAL_TICKETS" subtitle="Tüm Zamanlar" icon="inbox">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">
              {overallStats?.total || 0}
            </div>
          </BccHudTile>

          <BccHudTile title="AVG_RESPONSE" subtitle="İlk Yanıt Süresi" icon="schedule">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">
              {overallStats?.avgResponseTime?.toFixed(1) || 0}<span className="text-sm font-sans text-white/40 ml-1">sa</span>
            </div>
          </BccHudTile>

          <BccHudTile title="AVG_RESOLUTION" subtitle="Ort. Çözüm Süresi" icon="verified">
            <div className="text-3xl font-bold font-mono tracking-tighter text-[#9df425]">
              {overallStats?.avgResolutionTime?.toFixed(1) || 0}<span className="text-sm font-sans text-[#9df425]/60 ml-1">sa</span>
            </div>
          </BccHudTile>

          <BccHudTile title="SLA_COMPLIANCE" subtitle="Hedef: 95%" icon="shield">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">
              {overallStats?.slaCompliance?.toFixed(1) || 0}<span className="text-sm font-sans text-white/40 ml-1">%</span>
            </div>
          </BccHudTile>
        </div>

        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList className="bg-black/20 border border-white/10 h-10 p-1">
            <TabsTrigger value="agents" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">Ajan Performansı</TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">Kategoriler</TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">Trendler</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-4">
            <div className="border border-white/5 bg-white/[0.02] rounded-md p-6">
              <div className="flex flex-col space-y-1.5 mb-6">
                <h3 className="font-semibold leading-none tracking-tight text-white uppercase text-sm">Ajan Performans İstatistikleri</h3>
                <p className="text-sm text-white/40">Destek ekibi performans metrikleri</p>
              </div>
              <div className="space-y-4">
                {agentStats.length === 0 ? (
                  <div className="text-center py-12 text-white/20">
                    Henüz ajan performans verisi yok
                  </div>
                ) : (
                  agentStats.map((agent, index) => (
                    <div
                      key={agent.agentId}
                      className="flex items-center justify-between p-4 border border-white/5 bg-white/[0.01] rounded-lg hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#9df425]/10 text-[#9df425] font-bold font-mono">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-white">{agent.agentName}</p>
                          <p className="text-sm text-white/40">
                            {agent.assignedTickets} atanan, {agent.resolvedTickets} çözülen
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center min-w-[3rem]">
                          <p className="text-[10px] uppercase text-white/30 tracking-wider mb-1">Yanıt</p>
                          <p className="font-medium text-white">{agent.avgResponseTime}sa</p>
                        </div>
                        <div className="text-center min-w-[3rem]">
                          <p className="text-[10px] uppercase text-white/30 tracking-wider mb-1">Çözüm</p>
                          <p className="font-medium text-white">{agent.avgResolutionTime}sa</p>
                        </div>
                        <div className="text-center min-w-[3rem]">
                          <p className="text-[10px] uppercase text-white/30 tracking-wider mb-1">SLA</p>
                          <Badge variant={agent.slaCompliance >= 90 ? 'default' : 'destructive'} className={agent.slaCompliance >= 90 ? 'bg-[#9df425]/10 text-[#9df425] hover:bg-[#9df425]/20 border-0' : ''}>
                            {agent.slaCompliance}%
                          </Badge>
                        </div>
                        <div className="text-center min-w-[3rem]">
                          <p className="text-[10px] uppercase text-white/30 tracking-wider mb-1">Aktif</p>
                          <p className="font-bold text-[#9df425]">{agent.activeTickets}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="border border-white/5 bg-white/[0.02] rounded-md p-6">
              <div className="flex flex-col space-y-1.5 mb-6">
                <h3 className="font-semibold leading-none tracking-tight text-white uppercase text-sm">Kategori İstatistikleri</h3>
                <p className="text-sm text-white/40">Ticket dağılımı ve performans metrikleri</p>
              </div>
              <div className="space-y-4">
                {categoryStats.length === 0 ? (
                  <div className="text-center py-12 text-white/20">
                    Henüz kategori verisi yok
                  </div>
                ) : (
                  categoryStats.map((category) => (
                    <div
                      key={category.categoryId}
                      className="flex items-center justify-between p-4 border border-white/5 bg-white/[0.01] rounded-lg hover:bg-white/[0.03] transition-colors"
                    >
                      <div>
                        <p className="font-medium text-white">{category.categoryName}</p>
                        <p className="text-sm text-white/40">
                          {category.totalTickets} toplam ticket
                        </p>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center min-w-[3rem]">
                          <p className="text-[10px] uppercase text-white/30 tracking-wider mb-1">Açık</p>
                          <Badge variant="outline" className="border-white/10 text-white/60">{category.openTickets}</Badge>
                        </div>
                        <div className="text-center min-w-[3rem]">
                          <p className="text-[10px] uppercase text-white/30 tracking-wider mb-1">Çözülen</p>
                          <Badge variant="default" className="bg-[#9df425]/10 text-[#9df425] hover:bg-[#9df425]/20 border-0">{category.resolvedTickets}</Badge>
                        </div>
                        <div className="text-center min-w-[3rem]">
                          <p className="text-[10px] uppercase text-white/30 tracking-wider mb-1">Ort. Süre</p>
                          <p className="font-medium text-white">{category.avgResolutionTime}sa</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-white/5 bg-white/[0.02] rounded-md p-6">
                <div className="flex flex-col space-y-1.5 mb-6">
                  <h3 className="font-semibold leading-none tracking-tight text-white uppercase text-sm">Oluşturulan Ticketlar</h3>
                  <p className="text-sm text-white/40">Son 7 gün</p>
                </div>
                <div className="space-y-2">
                  {!trends?.createdTickets || trends.createdTickets.length === 0 ? (
                    <div className="text-center py-8 text-white/20 text-sm">
                      Veri yok
                    </div>
                  ) : (
                    trends.createdTickets.slice(-7).map((item: any) => (
                      <div key={item.date} className="flex items-center justify-between p-2 hover:bg-white/[0.02] rounded transition-colors">
                        <span className="text-sm text-white/60">
                          {new Date(item.date).toLocaleDateString('tr-TR')}
                        </span>
                        <Badge variant="outline" className="border-white/10">{item.count} ticket</Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border border-white/5 bg-white/[0.02] rounded-md p-6">
                <div className="flex flex-col space-y-1.5 mb-6">
                  <h3 className="font-semibold leading-none tracking-tight text-white uppercase text-sm">SLA İhlalleri</h3>
                  <p className="text-sm text-white/40">Son 7 gün</p>
                </div>
                <div className="space-y-2">
                  {!trends?.slaBreaches || trends.slaBreaches.length === 0 ? (
                    <div className="text-center py-8 text-white/20 text-sm">
                      Veri yok
                    </div>
                  ) : (
                    trends.slaBreaches.slice(-7).map((item: any) => (
                      <div key={item.date} className="flex items-center justify-between p-2 hover:bg-white/[0.02] rounded transition-colors">
                        <span className="text-sm text-white/60">
                          {new Date(item.date).toLocaleDateString('tr-TR')}
                        </span>
                        <Badge variant={item.count > 0 ? 'destructive' : 'outline'} className={item.count === 0 ? "border-white/10" : ""}>
                          {item.count} ihlal
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </BccEditorialWrapper>
  );
}
