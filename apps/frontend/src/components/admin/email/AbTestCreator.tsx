'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  Plus, 
  Trash2, 
  TestTube, 
  Target, 
  Clock, 
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import abTestService, { CreateAbTestDto } from '@/lib/api/abTestService';
import { useToast } from '@/hooks/use-toast';

interface AbTestCreatorProps {
  campaignId: string;
  campaignName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTestCreated?: () => void;
}

interface Variant {
  label: string;
  subject: string;
  content: string;
  fromName: string;
  sendTimeOffset: number;
  splitPercentage: number;
}

export default function AbTestCreator({
  campaignId,
  campaignName,
  open,
  onOpenChange,
  onTestCreated
}: AbTestCreatorProps) {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Test Configuration
  const [testType, setTestType] = useState<'subject' | 'content' | 'send_time' | 'from_name' | 'combined'>('subject');
  const [winnerCriteria, setWinnerCriteria] = useState<'open_rate' | 'click_rate' | 'conversion_rate' | 'revenue'>('open_rate');
  const [autoSelectWinner, setAutoSelectWinner] = useState(true);
  const [testDuration, setTestDuration] = useState(24);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [minSampleSize, setMinSampleSize] = useState(100);

  // Variants
  const [variants, setVariants] = useState<Variant[]>([
    {
      label: 'A',
      subject: '',
      content: '',
      fromName: '',
      sendTimeOffset: 0,
      splitPercentage: 50,
    },
    {
      label: 'B',
      subject: '',
      content: '',
      fromName: '',
      sendTimeOffset: 0,
      splitPercentage: 50,
    },
  ]);

  const addVariant = () => {
    if (variants.length >= 5) return;
    
    const nextLabel = String.fromCharCode(65 + variants.length); // A, B, C, D, E
    const newSplitPercentage = Math.floor(100 / (variants.length + 1));
    
    // Redistribute percentages
    const updatedVariants = variants.map(v => ({
      ...v,
      splitPercentage: newSplitPercentage,
    }));
    
    setVariants([
      ...updatedVariants,
      {
        label: nextLabel,
        subject: '',
        content: '',
        fromName: '',
        sendTimeOffset: 0,
        splitPercentage: newSplitPercentage,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) return;
    
    const newVariants = variants.filter((_, i) => i !== index);
    const newSplitPercentage = Math.floor(100 / newVariants.length);
    
    setVariants(newVariants.map(v => ({
      ...v,
      splitPercentage: newSplitPercentage,
    })));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const updateSplitPercentage = (index: number, percentage: number) => {
    const newVariants = [...variants];
    newVariants[index].splitPercentage = percentage;
    
    // Ensure total is 100%
    const total = newVariants.reduce((sum, v) => sum + v.splitPercentage, 0);
    if (total !== 100) {
      // Adjust other variants proportionally
      const remaining = 100 - percentage;
      const otherVariants = newVariants.filter((_, i) => i !== index);
      const otherTotal = otherVariants.reduce((sum, v) => sum + v.splitPercentage, 0);
      
      if (otherTotal > 0) {
        otherVariants.forEach((variant, i) => {
          const otherIndex = newVariants.findIndex(v => v === variant);
          newVariants[otherIndex].splitPercentage = Math.round(
            (variant.splitPercentage / otherTotal) * remaining
          );
        });
      }
    }
    
    setVariants(newVariants);
  };

  const validateTest = () => {
    const errors: string[] = [];
    
    // Check split percentages
    const totalSplit = variants.reduce((sum, v) => sum + v.splitPercentage, 0);
    if (Math.abs(totalSplit - 100) > 0.01) {
      errors.push('Split yüzdeleri toplamı 100% olmalıdır');
    }
    
    // Check variant content based on test type
    if (testType === 'subject') {
      variants.forEach((variant, i) => {
        if (!variant.subject.trim()) {
          errors.push(`Variant ${variant.label} için konu satırı gereklidir`);
        }
      });
    } else if (testType === 'content') {
      variants.forEach((variant, i) => {
        if (!variant.content.trim()) {
          errors.push(`Variant ${variant.label} için içerik gereklidir`);
        }
      });
    } else if (testType === 'from_name') {
      variants.forEach((variant, i) => {
        if (!variant.fromName.trim()) {
          errors.push(`Variant ${variant.label} için gönderen adı gereklidir`);
        }
      });
    }
    
    return errors;
  };

  const handleCreateTest = async () => {
    const errors = validateTest();
    if (errors.length > 0) {
      toast({
        title: 'Validation Hatası',
        description: errors.join(', '),
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setCreating(true);
      
      const testData: CreateAbTestDto = {
        campaignId,
        testType,
        winnerCriteria,
        autoSelectWinner,
        testDuration,
        confidenceLevel,
        minSampleSize,
        variants: variants.map(v => ({
          label: v.label,
          subject: testType === 'subject' ? v.subject : undefined,
          content: testType === 'content' ? v.content : undefined,
          fromName: testType === 'from_name' ? v.fromName : undefined,
          sendTimeOffset: testType === 'send_time' ? v.sendTimeOffset : undefined,
          splitPercentage: v.splitPercentage,
        })),
      };
      
      await abTestService.createAbTest(testData);
      
      toast({
        title: 'A/B Test Oluşturuldu',
        description: 'A/B test başarıyla oluşturuldu ve test edilmeye hazır.',
      });
      
      onOpenChange(false);
      onTestCreated?.();
    } catch (error) {
      console.error('Error creating A/B test:', error);
      toast({
        title: 'Hata',
        description: 'A/B test oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const getTestTypeDescription = () => {
    switch (testType) {
      case 'subject':
        return 'Farklı konu satırlarını test edin ve hangisinin daha yüksek açılma oranı sağladığını görün.';
      case 'content':
        return 'Farklı email içeriklerini test edin ve hangisinin daha iyi performans gösterdiğini öğrenin.';
      case 'send_time':
        return 'Farklı gönderim zamanlarını test edin ve optimal zamanı bulun.';
      case 'from_name':
        return 'Farklı gönderen adlarını test edin ve hangisinin daha güvenilir göründüğünü öğrenin.';
      case 'combined':
        return 'Birden fazla elementi birlikte test edin (konu, içerik, gönderen vb.).';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            A/B Test Oluştur
          </DialogTitle>
          <DialogDescription>
            "{campaignName}" kampanyası için A/B test oluşturun
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1">1. Test Türü</TabsTrigger>
            <TabsTrigger value="2">2. Varyantlar</TabsTrigger>
            <TabsTrigger value="3">3. Ayarlar</TabsTrigger>
          </TabsList>

          <TabsContent value="1" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Test Türü Seçin
                </CardTitle>
                <CardDescription>
                  Hangi elementi test etmek istediğinizi seçin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Test Türü</Label>
                  <Select value={testType} onValueChange={(value: any) => setTestType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subject">Konu Satırı</SelectItem>
                      <SelectItem value="content">Email İçeriği</SelectItem>
                      <SelectItem value="send_time">Gönderim Zamanı</SelectItem>
                      <SelectItem value="from_name">Gönderen Adı</SelectItem>
                      <SelectItem value="combined">Kombine Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {getTestTypeDescription()}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Kazanan Kriterleri</Label>
                  <Select value={winnerCriteria} onValueChange={(value: any) => setWinnerCriteria(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open_rate">Açılma Oranı</SelectItem>
                      <SelectItem value="click_rate">Tıklama Oranı</SelectItem>
                      <SelectItem value="conversion_rate">Dönüşüm Oranı</SelectItem>
                      <SelectItem value="revenue">Gelir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="2" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Test Varyantları
                    </CardTitle>
                    <CardDescription>
                      Test edilecek varyantları oluşturun (2-5 arası)
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addVariant}
                    disabled={variants.length >= 5}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Varyant Ekle
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {variants.map((variant, index) => (
                  <Card key={variant.label} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Varyant {variant.label}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {variant.splitPercentage}% trafik
                        </span>
                      </div>
                      {variants.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Trafik Yüzdesi</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={variant.splitPercentage}
                          onChange={(e) => updateSplitPercentage(index, parseInt(e.target.value) || 0)}
                        />
                      </div>

                      {testType === 'subject' && (
                        <div className="space-y-2">
                          <Label>Konu Satırı</Label>
                          <Input
                            value={variant.subject}
                            onChange={(e) => updateVariant(index, 'subject', e.target.value)}
                            placeholder="Email konu satırı"
                          />
                        </div>
                      )}

                      {testType === 'content' && (
                        <div className="space-y-2">
                          <Label>Email İçeriği</Label>
                          <Textarea
                            value={variant.content}
                            onChange={(e) => updateVariant(index, 'content', e.target.value)}
                            placeholder="Email içeriği"
                            rows={4}
                          />
                        </div>
                      )}

                      {testType === 'from_name' && (
                        <div className="space-y-2">
                          <Label>Gönderen Adı</Label>
                          <Input
                            value={variant.fromName}
                            onChange={(e) => updateVariant(index, 'fromName', e.target.value)}
                            placeholder="Gönderen adı"
                          />
                        </div>
                      )}

                      {testType === 'send_time' && (
                        <div className="space-y-2">
                          <Label>Gönderim Zamanı Offset (dakika)</Label>
                          <Input
                            type="number"
                            value={variant.sendTimeOffset}
                            onChange={(e) => updateVariant(index, 'sendTimeOffset', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                <div className="text-sm text-muted-foreground">
                  Toplam: {variants.reduce((sum, v) => sum + v.splitPercentage, 0)}%
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="3" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Test Ayarları
                </CardTitle>
                <CardDescription>
                  Test süresini ve istatistiksel ayarları yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test Süresi (saat)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="168"
                      value={testDuration}
                      onChange={(e) => setTestDuration(parseInt(e.target.value) || 24)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Güven Seviyesi (%)</Label>
                    <Input
                      type="number"
                      min="90"
                      max="99.9"
                      step="0.1"
                      value={confidenceLevel}
                      onChange={(e) => setConfidenceLevel(parseFloat(e.target.value) || 95)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Örnek Boyutu</Label>
                  <Input
                    type="number"
                    min="50"
                    value={minSampleSize}
                    onChange={(e) => setMinSampleSize(parseInt(e.target.value) || 100)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Her varyant için minimum gönderim sayısı
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-select"
                    checked={autoSelectWinner}
                    onCheckedChange={setAutoSelectWinner}
                  />
                  <Label htmlFor="auto-select">Otomatik kazanan seçimi</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Test süresi dolduğunda ve istatistiksel anlamlılık sağlandığında otomatik olarak kazanan seçilir
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Önceki
              </Button>
            )}
            {currentStep < 3 && (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Sonraki
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            {currentStep === 3 && (
              <Button onClick={handleCreateTest} disabled={creating}>
                <TestTube className="h-4 w-4 mr-2" />
                {creating ? 'Oluşturuluyor...' : 'A/B Test Oluştur'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}