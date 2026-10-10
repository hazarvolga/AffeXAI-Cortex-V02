'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, Wand2, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import aiService from '@/lib/api/aiService';
import type { GeneratedEmailBoth } from '@/lib/api/aiService';

interface AiEmailGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (subject: string, bodyHtml: string, alternatives: string[]) => void;
  defaultCampaignName?: string;
}

const TONES = [
  { value: 'professional', label: 'Profesyonel' },
  { value: 'friendly', label: 'Samimi' },
  { value: 'formal', label: 'Resmi' },
  { value: 'casual', label: 'Gündelik' },
  { value: 'enthusiastic', label: 'Heyecanlı' },
  { value: 'informative', label: 'Bilgilendirici' },
];

export default function AiEmailGenerator({
  open,
  onOpenChange,
  onGenerated,
  defaultCampaignName = '',
}: AiEmailGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatingStep, setGeneratingStep] = useState('');
  
  const [campaignName, setCampaignName] = useState(defaultCampaignName);
  const [product, setProduct] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('professional');
  const [keywords, setKeywords] = useState('');
  const [errors, setErrors] = useState<{campaignName?: string}>({});

  // Update campaign name when prop changes
  useEffect(() => {
    if (defaultCampaignName) {
      setCampaignName(defaultCampaignName);
    }
  }, [defaultCampaignName]);

  // Validate form
  const validateForm = () => {
    const newErrors: {campaignName?: string} = {};
    
    if (!campaignName.trim()) {
      newErrors.campaignName = 'Kampanya adı zorunludur';
    } else if (campaignName.trim().length < 3) {
      newErrors.campaignName = 'Kampanya adı en az 3 karakter olmalıdır';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratingStep('Hazırlanıyor...');

    try {
      const keywordsArray = keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      // Simulate progress
      setProgress(20);
      setGeneratingStep('AI modeline bağlanılıyor...');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(40);
      setGeneratingStep('Konu satırı oluşturuluyor...');

      const result: GeneratedEmailBoth = await aiService.generateEmailBoth({
        campaignName: campaignName.trim(),
        product: product.trim() || undefined,
        targetAudience: targetAudience.trim() || undefined,
        tone: tone || undefined,
        keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
      });

      setProgress(80);
      setGeneratingStep('E-posta içeriği hazırlanıyor...');
      await new Promise(resolve => setTimeout(resolve, 300));

      setProgress(100);
      setGeneratingStep('Tamamlandı!');

      // Call the callback with generated content
      onGenerated(result.subject, result.bodyHtml, result.subjectAlternatives);

      // Show success message
      toast({
        title: '✨ Başarılı!',
        description: 'AI ile e-posta içeriği oluşturuldu. Alternatif konu satırlarını görmek için konu alanının altına bakın.',
      });

      // Close dialog
      onOpenChange(false);

      // Reset form
      setCampaignName('');
      setProduct('');
      setTargetAudience('');
      setTone('professional');
      setKeywords('');
      setProgress(0);
      setGeneratingStep('');
      setErrors({});
    } catch (error: any) {
      console.error('AI generation error:', error);
      
      let errorMessage = 'AI ile içerik oluşturulurken bir hata oluştu';
      let errorTitle = 'Hata';
      
      if (error?.message?.includes('API key') || error?.message?.includes('not configured')) {
        errorTitle = 'AI Ayarları Eksik';
        errorMessage = 'AI ayarları yapılmamış. Lütfen önce Ayarlar > AI Ayarları bölümünden OpenAI API anahtarınızı ekleyin.';
      } else if (error?.message?.includes('rate limit') || error?.message?.includes('429')) {
        errorTitle = 'API Limiti';
        errorMessage = 'API kullanım limitine ulaşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin veya OpenAI hesabınıza kredi ekleyin.';
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorTitle = 'Bağlantı Hatası';
        errorMessage = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setGeneratingStep('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI ile E-posta Oluştur
          </DialogTitle>
          <DialogDescription>
            Kampanya bilgilerinizi girin, AI sizin için profesyonel bir e-posta oluştursun.
          </DialogDescription>
        </DialogHeader>

        {isGenerating && (
          <div className="space-y-2 px-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{generatingStep}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {!isGenerating && (
          <Alert className="mx-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              AI, kampanya bilgilerinize göre özelleştirilmiş e-posta içeriği oluşturacak. 
              Daha detaylı bilgi verirseniz daha iyi sonuçlar alırsınız.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4 px-6">
          <div className="grid gap-2">
            <Label htmlFor="ai-campaign-name">
              Kampanya Adı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ai-campaign-name"
              placeholder="Örn: Sonbahar İndirimleri 2024"
              value={campaignName}
              onChange={(e) => {
                setCampaignName(e.target.value);
                if (errors.campaignName) {
                  setErrors({...errors, campaignName: undefined});
                }
              }}
              disabled={isGenerating}
              className={errors.campaignName ? 'border-destructive' : ''}
            />
            {errors.campaignName && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.campaignName}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ai-product">Ürün/Hizmet (Opsiyonel)</Label>
            <Input
              id="ai-product"
              placeholder="Örn: Alüminyum Doğramalar"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ai-audience">Hedef Kitle (Opsiyonel)</Label>
            <Input
              id="ai-audience"
              placeholder="Örn: Müteahhitler ve inşaat firmaları"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ai-tone">Ton</Label>
            <Select value={tone} onValueChange={setTone} disabled={isGenerating}>
              <SelectTrigger id="ai-tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((toneOption) => (
                  <SelectItem key={toneOption.value} value={toneOption.value}>
                    {toneOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ai-keywords">Anahtar Kelimeler (Opsiyonel)</Label>
            <Textarea
              id="ai-keywords"
              placeholder="Virgülle ayırarak girin: kalite, dayanıklılık, uygun fiyat"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={isGenerating}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              İçerikte vurgulanmasını istediğiniz kelimeleri virgülle ayırarak girin
            </p>
          </div>
        </div>

        <DialogFooter className="px-6">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setErrors({});
            }}
            disabled={isGenerating}
          >
            İptal
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || !campaignName.trim()}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Oluştur
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
