'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  MousePointer, 
  Eye, 
  Users, 
  TrendingUp,
  Clock,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { TrackingStats as TrackingStatsType } from '@/lib/api/trackingService';

interface TrackingStatsProps {
  stats: TrackingStatsType;
  loading?: boolean;
}

export default function TrackingStats({ stats, loading = false }: TrackingStatsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Tracking</CardTitle>
          <CardDescription>Gerçek zamanlı açılma ve tıklama verileri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatPercentage = (num: number) => `${num.toFixed(2)}%`;
  const formatNumber = (num: number) => num.toLocaleString();

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Email Tracking
        </CardTitle>
        <CardDescription>
          Gerçek zamanlı açılma ve tıklama verileri
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="opens">Açılmalar</TabsTrigger>
            <TabsTrigger value="clicks">Tıklamalar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Overview Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Gönderilen</span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(stats.totalSent)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Açılan</span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(stats.totalOpened)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPercentage(stats.openRate)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Tıklanan</span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(stats.totalClicked)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPercentage(stats.clickRate)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">CTR</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {stats.totalOpened > 0 
                      ? formatPercentage((stats.totalClicked / stats.totalOpened) * 100)
                      : '0.00%'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Click-through rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performans</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Açılma Oranı</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(stats.openRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{formatPercentage(stats.openRate)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tıklama Oranı</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(stats.clickRate * 5, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{formatPercentage(stats.clickRate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Etkileşim</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Benzersiz Açılma</span>
                    <Badge variant="secondary">{formatNumber(stats.uniqueOpens)}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Benzersiz Tıklama</span>
                    <Badge variant="secondary">{formatNumber(stats.uniqueClicks)}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="opens" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Son Açılmalar</CardTitle>
                <CardDescription>
                  En son email açan kullanıcılar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentOpens.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz açılma kaydı yok</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.recentOpens.map((open, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Eye className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{open.recipientEmail}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(open.openedAt).toLocaleString('tr-TR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(open.userAgent || 'desktop')}
                          <span className="text-xs text-muted-foreground">
                            {open.ipAddress || 'Unknown IP'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clicks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Son Tıklamalar</CardTitle>
                <CardDescription>
                  En son link tıklayan kullanıcılar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentClicks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MousePointer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz tıklama kaydı yok</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.recentClicks.map((click, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <MousePointer className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{click.recipientEmail}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(click.clickedAt).toLocaleString('tr-TR')}
                            </p>
                            {click.originalUrl && (
                              <p className="text-xs text-blue-600 truncate max-w-48">
                                {click.originalUrl}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(click.userAgent || 'desktop')}
                          <span className="text-xs text-muted-foreground">
                            {click.ipAddress || 'Unknown IP'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}