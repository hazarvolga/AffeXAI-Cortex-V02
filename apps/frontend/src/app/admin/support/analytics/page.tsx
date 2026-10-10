'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  LineChart,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target
} from 'lucide-react';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analytics yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Destek Analitikleri</h1>
          <p className="text-muted-foreground">
            Ticket performansı ve istatistikleri
          </p>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ticket</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tüm zamanlar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ort. Yanıt Süresi</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.avgResponseTime?.toFixed(1) || 0}sa
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              İlk yanıt süresi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ort. Çözüm Süresi</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.avgResolutionTime?.toFixed(1) || 0}sa
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Çözüme ulaşma süresi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Uyumu</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.slaCompliance?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Hedef: 95%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Ajan Performansı</TabsTrigger>
          <TabsTrigger value="categories">Kategoriler</TabsTrigger>
          <TabsTrigger value="trends">Trendler</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ajan Performans İstatistikleri</CardTitle>
              <CardDescription>
                Destek ekibi performans metrikleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Henüz ajan performans verisi yok
                  </div>
                ) : (
                  agentStats.map((agent, index) => (
                  <div
                    key={agent.agentId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{agent.agentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {agent.assignedTickets} atanan, {agent.resolvedTickets} çözülen
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Yanıt</p>
                        <p className="font-medium">{agent.avgResponseTime}sa</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Çözüm</p>
                        <p className="font-medium">{agent.avgResolutionTime}sa</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">SLA</p>
                        <Badge variant={agent.slaCompliance >= 90 ? 'default' : 'destructive'}>
                          {agent.slaCompliance}%
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Aktif</p>
                        <p className="font-bold text-primary">{agent.activeTickets}</p>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kategori İstatistikleri</CardTitle>
              <CardDescription>
                Ticket dağılımı ve performans metrikleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Henüz kategori verisi yok
                  </div>
                ) : (
                  categoryStats.map((category) => (
                  <div
                    key={category.categoryId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{category.categoryName}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.totalTickets} toplam ticket
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Açık</p>
                        <Badge variant="outline">{category.openTickets}</Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Çözülen</p>
                        <Badge variant="default">{category.resolvedTickets}</Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Ort. Çözüm</p>
                        <p className="font-medium">{category.avgResolutionTime}sa</p>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Oluşturulan Ticketlar</CardTitle>
                <CardDescription>Son 7 gün</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {!trends?.createdTickets || trends.createdTickets.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Veri yok
                    </div>
                  ) : (
                    trends.createdTickets.slice(-7).map((item: any) => (
                    <div key={item.date} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('tr-TR')}
                      </span>
                      <Badge variant="outline">{item.count} ticket</Badge>
                    </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SLA İhlalleri</CardTitle>
                <CardDescription>Son 7 gün</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {!trends?.slaBreaches || trends.slaBreaches.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Veri yok
                    </div>
                  ) : (
                    trends.slaBreaches.slice(-7).map((item: any) => (
                    <div key={item.date} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('tr-TR')}
                      </span>
                      <Badge variant={item.count > 0 ? 'destructive' : 'outline'}>
                        {item.count} ihlal
                      </Badge>
                    </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Durum Dağılımı</CardTitle>
          <CardDescription>Mevcut ticket durumları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {overallStats?.byStatus && Object.entries(overallStats.byStatus).map(([status, count]: [string, any]) => (
              <div key={status} className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-muted-foreground capitalize">{status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
