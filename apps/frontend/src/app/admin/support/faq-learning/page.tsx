'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Brain,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Play,
  Pause,
  RefreshCw,
  BarChart3,
  Users,
  MessageSquare,
  Zap
} from 'lucide-react';

interface DashboardStats {
  totalFaqs: number;
  newFaqsToday: number;
  pendingReview: number;
  averageConfidence: number;
  processingStatus: 'running' | 'stopped' | 'error';
  lastRun?: Date;
  nextRun?: Date;
}

interface ProviderStatus {
  name: string;
  available: boolean;
  responseTime?: number;
  lastChecked: Date;
}

interface RecentActivity {
  id: string;
  type: 'faq_generated' | 'review_completed' | 'feedback_received';
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

interface LearningProgress {
  fromChat: number;
  fromTickets: number;
  fromSuggestions: number;
  fromKnowledgeBase: number;
  fromKnowledgeSources: number;
}

interface QualityMetrics {
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
}

export default function FaqLearningDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalFaqs: 0,
    newFaqsToday: 0,
    pendingReview: 0,
    averageConfidence: 0,
    processingStatus: 'stopped'
  });

  const [learningProgress, setLearningProgress] = useState<LearningProgress>({
    fromChat: 0,
    fromTickets: 0,
    fromSuggestions: 0,
    fromKnowledgeBase: 0,
    fromKnowledgeSources: 0
  });

  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0
  });

  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPipelineActionLoading, setIsPipelineActionLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading dashboard data...');
      const { FaqLearningService } = await import('@/services/faq-learning.service');
      const data = await FaqLearningService.getDashboardStats();

      console.log('📊 Dashboard data received:', data);
      console.log('📊 Data type:', typeof data);
      console.log('📊 Data keys:', data ? Object.keys(data) : 'null');
      console.log('📊 Stats:', data?.stats);
      console.log('📊 Learning Progress:', data?.learningProgress);

      // Ensure data structure is correct
      if (!data) {
        throw new Error('No data received from API');
      }

      if (!data.stats) {
        console.error('📊 Missing stats in data. Full data:', JSON.stringify(data, null, 2));
        throw new Error('Invalid dashboard data structure - missing stats');
      }

      setStats(data.stats);
      setLearningProgress(data.learningProgress || { fromChat: 0, fromTickets: 0, fromSuggestions: 0, fromKnowledgeBase: 0, fromKnowledgeSources: 0 });
      setQualityMetrics(data.qualityMetrics || { highConfidence: 0, mediumConfidence: 0, lowConfidence: 0 });
      setProviders(data.providers || []);
      setRecentActivity(data.recentActivity || []);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Dashboard verisi yüklenemedi:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
      // Fallback to empty data on error
      setStats({
        totalFaqs: 0,
        newFaqsToday: 0,
        pendingReview: 0,
        averageConfidence: 0,
        processingStatus: 'stopped'
      });
      setLearningProgress({
        fromChat: 0,
        fromTickets: 0,
        fromSuggestions: 0,
        fromKnowledgeBase: 0,
        fromKnowledgeSources: 0
      });
      setQualityMetrics({
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0
      });
      setProviders([]);
      setRecentActivity([]);
      setIsLoading(false);
    }
  };

  const startLearningPipeline = async () => {
    setIsPipelineActionLoading(true);
    try {
      console.log('🚀 Starting pipeline...');
      toast.loading('Pipeline başlatılıyor...', { id: 'pipeline-action' });

      const { FaqLearningService } = await import('@/services/faq-learning.service');
      const result = await FaqLearningService.startPipeline();

      console.log('🚀 Pipeline start result:', result);

      if (result.success) {
        // Immediately update local state for instant UI feedback
        setStats(prev => ({ ...prev, processingStatus: 'running' }));

        toast.success('✅ Pipeline başarıyla başlatıldı!', {
          id: 'pipeline-action',
          description: 'Sistem aktif olarak yeni verilerden FAQ oluşturuyor',
          duration: 4000
        });
        console.log('✅ Learning pipeline başlatıldı:', result.message);

        // Refresh dashboard data after a short delay
        setTimeout(() => loadDashboardData(), 1000);
      } else {
        toast.error('❌ Pipeline başlatılamadı', {
          id: 'pipeline-action',
          description: result.message || 'İşlem başarısız oldu'
        });
      }
    } catch (error) {
      console.error('❌ Pipeline başlatılamadı:', error);
      toast.error('❌ Pipeline başlatılamadı', {
        id: 'pipeline-action',
        description: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu',
        duration: 5000
      });
    } finally {
      setIsPipelineActionLoading(false);
    }
  };

  const stopLearningPipeline = async () => {
    setIsPipelineActionLoading(true);
    try {
      console.log('⏸️ Stopping pipeline...');
      toast.loading('Pipeline durduruluyor...', { id: 'pipeline-action' });

      const { FaqLearningService } = await import('@/services/faq-learning.service');
      const result = await FaqLearningService.stopPipeline();

      console.log('⏸️ Pipeline stop result:', result);

      if (result.success) {
        // Immediately update local state for instant UI feedback
        setStats(prev => ({ ...prev, processingStatus: 'stopped' }));

        toast.success('✅ Pipeline durduruldu', {
          id: 'pipeline-action',
          description: 'Otomatik FAQ oluşturma devre dışı bırakıldı',
          duration: 4000
        });
        console.log('✅ Learning pipeline durduruldu:', result.message);

        // Refresh dashboard data after a short delay
        setTimeout(() => loadDashboardData(), 1000);
      } else {
        toast.error('❌ Pipeline durdurulamadı', {
          id: 'pipeline-action',
          description: result.message || 'İşlem başarısız oldu'
        });
      }
    } catch (error) {
      console.error('❌ Pipeline durdurulamadı:', error);
      toast.error('❌ Pipeline durdurulamadı', {
        id: 'pipeline-action',
        description: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu',
        duration: 5000
      });
    } finally {
      setIsPipelineActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600';
      case 'stopped': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-4 w-4" />;
      case 'stopped': return <Pause className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Dashboard yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FAQ Öğrenme Sistemi</h1>
          <p className="text-muted-foreground">
            AI destekli otomatik FAQ oluşturma ve yönetim sistemi
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Ayarlar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam FAQ</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFaqs}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newFaqsToday} bugün eklendi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İnceleme Bekleyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Onay bekliyor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Güven</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageConfidence}%</div>
            <Progress value={stats.averageConfidence} className="mt-2" />
          </CardContent>
        </Card>

        <Card className={`border-2 ${stats.processingStatus === 'running'
          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
          : stats.processingStatus === 'error'
            ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
            : 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20'
          }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pipeline Durumu
            </CardTitle>
            <div className={`p-2 rounded-full ${stats.processingStatus === 'running'
              ? 'bg-green-100 dark:bg-green-900'
              : stats.processingStatus === 'error'
                ? 'bg-red-100 dark:bg-red-900'
                : 'bg-yellow-100 dark:bg-yellow-900'
              }`}>
              {getStatusIcon(stats.processingStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full animate-pulse ${stats.processingStatus === 'running'
                ? 'bg-green-500'
                : stats.processingStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
                }`} />
              <div className={`text-2xl font-bold ${getStatusColor(stats.processingStatus)}`}>
                {stats.processingStatus === 'running' ? '🟢 Aktif' :
                  stats.processingStatus === 'stopped' ? '🟡 Durduruldu' : '🔴 Hata'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.processingStatus === 'running'
                ? 'FAQ öğrenme aktif çalışıyor'
                : stats.processingStatus === 'stopped'
                  ? 'Pipeline Kontrolü sekmesinden başlatın'
                  : 'Lütfen sistem yöneticisine başvurun'}
            </p>
            {stats.lastRun && (
              <p className="text-xs text-muted-foreground mt-1">
                Son çalışma: {stats.lastRun.toLocaleTimeString('tr-TR')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Kontrolü</TabsTrigger>
          <TabsTrigger value="providers">AI Sağlayıcılar</TabsTrigger>
          <TabsTrigger value="activity">Son Aktiviteler</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Öğrenme İlerlemesi
                </CardTitle>
                <CardDescription>
                  Son 7 günde oluşturulan FAQ'lar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Chat Verilerinden</span>
                    <span className="font-medium">{learningProgress.fromChat} FAQ</span>
                  </div>
                  <Progress value={learningProgress.fromChat > 0 ? Math.min((learningProgress.fromChat / stats.totalFaqs) * 100, 100) : 0} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ticket Verilerinden</span>
                    <span className="font-medium">{learningProgress.fromTickets} FAQ</span>
                  </div>
                  <Progress value={learningProgress.fromTickets > 0 ? Math.min((learningProgress.fromTickets / stats.totalFaqs) * 100, 100) : 0} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Kullanıcı Önerilerinden</span>
                    <span className="font-medium">{learningProgress.fromSuggestions} FAQ</span>
                  </div>
                  <Progress value={learningProgress.fromSuggestions > 0 ? Math.min((learningProgress.fromSuggestions / stats.totalFaqs) * 100, 100) : 0} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bilgi Bankasından</span>
                    <span className="font-medium">{learningProgress.fromKnowledgeBase} FAQ</span>
                  </div>
                  <Progress value={learningProgress.fromKnowledgeBase > 0 ? Math.min((learningProgress.fromKnowledgeBase / stats.totalFaqs) * 100, 100) : 0} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bilgi Kaynaklarından (AI)</span>
                    <span className="font-medium">{learningProgress.fromKnowledgeSources} FAQ</span>
                  </div>
                  <Progress value={learningProgress.fromKnowledgeSources > 0 ? Math.min((learningProgress.fromKnowledgeSources / stats.totalFaqs) * 100, 100) : 0} />
                </div>
              </CardContent>
            </Card>

            {/* Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Kalite Metrikleri
                </CardTitle>
                <CardDescription>
                  FAQ kalite dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Yüksek Güven
                      </Badge>
                      <span className="text-sm">(85%+)</span>
                    </div>
                    <span className="font-medium">{qualityMetrics.highConfidence} FAQ</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Orta Güven
                      </Badge>
                      <span className="text-sm">(60-84%)</span>
                    </div>
                    <span className="font-medium">{qualityMetrics.mediumConfidence} FAQ</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        Düşük Güven
                      </Badge>
                      <span className="text-sm">(&lt;60%)</span>
                    </div>
                    <span className="font-medium">{qualityMetrics.lowConfidence} FAQ</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Kontrolü</CardTitle>
              <CardDescription>
                Öğrenme pipeline'ını başlatın, durdurun veya yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-6 border-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.processingStatus === 'running'
                    ? 'bg-green-100 dark:bg-green-900/50'
                    : stats.processingStatus === 'error'
                      ? 'bg-red-100 dark:bg-red-900/50'
                      : 'bg-yellow-100 dark:bg-yellow-900/50'
                    }`}>
                    {stats.processingStatus === 'running' ? (
                      <Play className="h-6 w-6 text-green-600 dark:text-green-400 animate-pulse" />
                    ) : stats.processingStatus === 'error' ? (
                      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    ) : (
                      <Pause className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Otomatik Öğrenme Pipeline</h3>
                    <p className="text-sm text-muted-foreground">
                      {stats.processingStatus === 'running'
                        ? '🟢 Sistem aktif olarak çalışıyor - Yeni verilerden FAQ oluşturuluyor'
                        : stats.processingStatus === 'error'
                          ? '🔴 Hata oluştu - Pipeline çalışmıyor'
                          : '🟡 Pipeline durdurulmuş - Başlatmak için butona tıklayın'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {stats.processingStatus === 'running' ? (
                    <Button
                      variant="outline"
                      onClick={stopLearningPipeline}
                      disabled={isPipelineActionLoading}
                      className="bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800"
                    >
                      {isPipelineActionLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Pause className="h-4 w-4 mr-2" />
                      )}
                      {isPipelineActionLoading ? 'Durduruluyor...' : 'Durdur'}
                    </Button>
                  ) : (
                    <Button
                      onClick={startLearningPipeline}
                      disabled={isPipelineActionLoading}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {isPipelineActionLoading ? (
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-5 w-5 mr-2" />
                      )}
                      {isPipelineActionLoading ? 'Başlatılıyor...' : 'Pipeline\'ı Başlat'}
                    </Button>
                  )}
                </div>
              </div>

              {stats.nextRun && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Sonraki otomatik çalışma: {stats.nextRun.toLocaleString('tr-TR')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  Manuel Çalıştır
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  Ayarları Düzenle
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Raporları Görüntüle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Sağlayıcı Durumu</CardTitle>
              <CardDescription>
                Bağlı AI sağlayıcılarının durumu ve performansı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providers.map((provider) => (
                  <div key={provider.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${provider.available ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <h3 className="font-medium">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {provider.available ? 'Aktif' : 'Bağlantı Yok'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {provider.responseTime && (
                        <div className="text-sm font-medium">{provider.responseTime}ms</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {provider.lastChecked.toLocaleTimeString('tr-TR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Son Aktiviteler</CardTitle>
              <CardDescription>
                Sistem tarafından gerçekleştirilen son işlemler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}