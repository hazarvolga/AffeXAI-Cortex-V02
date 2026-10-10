'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  Trophy, 
  Clock, 
  Users,
  Mail,
  MousePointer,
  Target,
  AlertCircle,
  CheckCircle,
  Crown,
  Zap
} from 'lucide-react';
import abTestService, { AbTestResults } from '@/lib/api/abTestService';
import { useToast } from '@/hooks/use-toast';

interface AbTestResultsProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWinnerSelected?: () => void;
}

export default function AbTestResultsViewer({
  campaignId,
  open,
  onOpenChange,
  onWinnerSelected
}: AbTestResultsProps) {
  const { toast } = useToast();
  const [results, setResults] = useState<AbTestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectingWinner, setSelectingWinner] = useState(false);

  useEffect(() => {
    if (open && campaignId) {
      fetchResults();
    }
  }, [open, campaignId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const data = await abTestService.getResults(campaignId);
      setResults(data);
    } catch (error) {
      console.error('Error fetching A/B test results:', error);
      toast({
        title: 'Hata',
        description: 'A/B test sonuçları yüklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWinner = async (variantId: string) => {
    try {
      setSelectingWinner(true);
      await abTestService.selectWinner(campaignId, variantId);
      
      toast({
        title: 'Kazanan Seçildi',
        description: 'Kazanan varyant başarıyla seçildi.',
      });
      
      await fetchResults(); // Refresh results
      onWinnerSelected?.();
    } catch (error) {
      console.error('Error selecting winner:', error);
      toast({
        title: 'Hata',
        description: 'Kazanan seçilirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setSelectingWinner(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Taslak</Badge>;
      case 'testing':
        return <Badge variant="default" className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />Test Ediliyor</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Tamamlandı</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVariantBadge = (variant: any, isWinner: boolean) => {
    if (isWinner) {
      return <Badge variant="default" className="bg-yellow-500"><Crown className="w-3 h-3 mr-1" />Kazanan</Badge>;
    }
    
    switch (variant.status) {
      case 'testing':
        return <Badge variant="outline"><Zap className="w-3 h-3 mr-1" />Test Ediliyor</Badge>;
      case 'winner':
        return <Badge variant="default" className="bg-green-500"><Trophy className="w-3 h-3 mr-1" />Kazanan</Badge>;
      case 'loser':
        return <Badge variant="secondary">Kaybeden</Badge>;
      default:
        return <Badge variant="outline">{variant.status}</Badge>;
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBestPerformingVariant = () => {
    if (!results?.variants) return null;
    
    const metric = results.campaign.winnerCriteria;
    let bestVariant = results.variants[0];
    
    results.variants.forEach(variant => {
      switch (metric) {
        case 'open_rate':
          if (variant.openRate > bestVariant.openRate) bestVariant = variant;
          break;
        case 'click_rate':
          if (variant.clickRate > bestVariant.clickRate) bestVariant = variant;
          break;
        case 'conversion_rate':
          if (variant.conversionRate > bestVariant.conversionRate) bestVariant = variant;
          break;
        case 'revenue':
          if (variant.revenue > bestVariant.revenue) bestVariant = variant;
          break;
      }
    });
    
    return bestVariant;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>A/B Test Sonuçları</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Sonuçlar yükleniyor...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!results) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>A/B Test Sonuçları</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">A/B test sonuçları bulunamadı.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const bestVariant = getBestPerformingVariant();
  const isWinnerSelected = results.campaign.selectedWinnerId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            A/B Test Sonuçları
          </DialogTitle>
          <DialogDescription>
            {results.campaign.name} - {results.campaign.testType} testi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Test Özeti</CardTitle>
                  <CardDescription>
                    {results.campaign.testType} testi - {results.campaign.winnerCriteria} kriterine göre
                  </CardDescription>
                </div>
                {getStatusBadge(results.campaign.testStatus)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Test Süresi</p>
                  <p className="text-2xl font-bold">{results.campaign.testDuration}h</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Güven Seviyesi</p>
                  <p className="text-2xl font-bold">{results.campaign.confidenceLevel}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Min. Örnek</p>
                  <p className="text-2xl font-bold">{results.campaign.minSampleSize}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Varyant Sayısı</p>
                  <p className="text-2xl font-bold">{results.variants.length}</p>
                </div>
              </div>

              {results.campaign.sentAt && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Test başlangıcı: {formatDate(results.campaign.sentAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistical Significance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                İstatistiksel Analiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">İstatistiksel Anlamlılık</span>
                  {results.statistics.isSignificant ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Anlamlı
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Anlamlı Değil
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">P-Value</p>
                    <p className="text-lg font-bold">{results.statistics.pValue.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Chi-Square</p>
                    <p className="text-lg font-bold">{results.statistics.chiSquare.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Min. Örnek</p>
                    {results.statistics.hasMinimumSample ? (
                      <Badge variant="default" className="bg-green-500">Yeterli</Badge>
                    ) : (
                      <Badge variant="secondary">Yetersiz</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Kazanan Seçilebilir</p>
                    {results.statistics.canDeclareWinner ? (
                      <Badge variant="default" className="bg-green-500">Evet</Badge>
                    ) : (
                      <Badge variant="secondary">Hayır</Badge>
                    )}
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {results.statistics.message}
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Variant Results */}
          <Card>
            <CardHeader>
              <CardTitle>Varyant Performansı</CardTitle>
              <CardDescription>
                Her varyantın detaylı performans metrikleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.variants.map((variant) => {
                  const isWinner = variant.id === results.campaign.selectedWinnerId;
                  const isBest = bestVariant?.id === variant.id;
                  
                  return (
                    <Card key={variant.id} className={`p-4 ${isWinner ? 'ring-2 ring-yellow-500' : isBest ? 'ring-2 ring-green-500' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-lg font-bold">
                            {variant.label}
                          </Badge>
                          {getVariantBadge(variant, isWinner)}
                          {isBest && !isWinner && (
                            <Badge variant="outline" className="bg-green-50">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              En İyi Performans
                            </Badge>
                          )}
                        </div>
                        
                        {!isWinnerSelected && results.statistics.canDeclareWinner && isBest && (
                          <Button
                            size="sm"
                            onClick={() => handleSelectWinner(variant.id)}
                            disabled={selectingWinner}
                          >
                            <Trophy className="w-4 h-4 mr-2" />
                            Kazanan Seç
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Gönderilen</span>
                          </div>
                          <p className="text-2xl font-bold">{variant.sentCount.toLocaleString()}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Açılma Oranı</span>
                          </div>
                          <p className="text-2xl font-bold">{formatPercentage(variant.openRate)}</p>
                          <p className="text-sm text-muted-foreground">{variant.openedCount} açılma</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MousePointer className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Tıklama Oranı</span>
                          </div>
                          <p className="text-2xl font-bold">{formatPercentage(variant.clickRate)}</p>
                          <p className="text-sm text-muted-foreground">{variant.clickedCount} tıklama</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Dönüşüm Oranı</span>
                          </div>
                          <p className="text-2xl font-bold">{formatPercentage(variant.conversionRate)}</p>
                          <p className="text-sm text-muted-foreground">{variant.conversionCount} dönüşüm</p>
                        </div>
                      </div>

                      {/* Performance comparison bars */}
                      <div className="mt-4 space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Açılma Oranı</span>
                            <span>{formatPercentage(variant.openRate)}</span>
                          </div>
                          <Progress value={variant.openRate} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Tıklama Oranı</span>
                            <span>{formatPercentage(variant.clickRate)}</span>
                          </div>
                          <Progress value={variant.clickRate} className="h-2" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Confidence Intervals */}
          {results.confidenceIntervals && (
            <Card>
              <CardHeader>
                <CardTitle>Güven Aralıkları</CardTitle>
                <CardDescription>
                  %{results.campaign.confidenceLevel} güven seviyesinde performans aralıkları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.confidenceIntervals.map((ci) => (
                    <div key={ci.label} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{ci.label}</Badge>
                        <span className="text-sm font-medium">Varyant {ci.label}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-mono">
                          [{ci.interval.lower.toFixed(2)}% - {ci.interval.upper.toFixed(2)}%]
                        </span>
                        <span className="text-muted-foreground ml-2">
                          ±{ci.interval.margin.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
          <Button onClick={fetchResults}>
            Sonuçları Yenile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}