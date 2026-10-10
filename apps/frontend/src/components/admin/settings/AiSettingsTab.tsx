'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, KeyRound, TestTube2, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import settingsService, { AiSettings, AiModel, AiModuleSettings } from '@/lib/api/settingsService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AI_MODELS: { value: AiModel; label: string }[] = [
  { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Faster)' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
];

export default function AiSettingsTab() {
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingModule, setTestingModule] = useState<string | null>(null);
  const { toast } = useToast();

  // Load AI settings from backend
  useEffect(() => {
    loadAiSettings();
  }, []);

  const loadAiSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await settingsService.getAiSettings();
      setAiSettings(settings);
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      toast({
        title: 'Hata',
        description: 'AI ayarları yüklenemedi.',
        variant: 'destructive',
      });
      // Set default values
      setAiSettings({
        useSingleApiKey: false,
        emailMarketing: { model: 'gpt-4o', enabled: true },
        social: { model: 'gpt-4o', enabled: false },
        support: { model: 'gpt-4o', enabled: false },
        analytics: { model: 'gpt-4o', enabled: false },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!aiSettings) return;

    try {
      setIsSaving(true);
      await settingsService.updateAiSettings(aiSettings);
      toast({
        title: 'Başarılı',
        description: 'AI ayarları kaydedildi.',
      });
    } catch (error: any) {
      console.error('Failed to save AI settings:', error);
      toast({
        title: 'Hata',
        description: error.message || 'AI ayarları kaydedilemedi.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async (module: 'emailMarketing' | 'social' | 'support' | 'analytics') => {
    try {
      setTestingModule(module);
      const result = await settingsService.testAiConnection(module);
      
      if (result.success) {
        toast({
          title: 'Bağlantı Başarılı',
          description: result.message,
        });
      } else {
        toast({
          title: 'Bağlantı Başarısız',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      toast({
        title: 'Test Hatası',
        description: error.message || 'Bağlantı test edilemedi.',
        variant: 'destructive',
      });
    } finally {
      setTestingModule(null);
    }
  };

  const updateModuleSettings = (module: keyof Omit<AiSettings, 'useSingleApiKey' | 'global'>, updates: Partial<AiModuleSettings>) => {
    if (!aiSettings) return;
    setAiSettings({
      ...aiSettings,
      [module]: {
        ...aiSettings[module],
        ...updates,
      },
    });
  };

  const updateGlobalSettings = (updates: Partial<AiModuleSettings>) => {
    if (!aiSettings) return;
    setAiSettings({
      ...aiSettings,
      global: {
        ...(aiSettings.global || { model: 'gpt-4o', enabled: true }),
        ...updates,
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!aiSettings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          AI Ayarları
        </CardTitle>
        <CardDescription>
          Projedeki yapay zeka özelliklerinin genel ayarlarını ve varsayılan davranışlarını yönetin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>OpenAI API Key Gerekli</AlertTitle>
          <AlertDescription>
            AI özelliklerini kullanmak için OpenAI API key'inize ihtiyacınız var.{' '}
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Buradan alabilirsiniz
            </a>
            . API key'ler veritabanında şifreli olarak saklanır.
          </AlertDescription>
        </Alert>

        <div className="space-y-8">
          {/* Global API Key Setting */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="single-api-key"
                checked={aiSettings.useSingleApiKey}
                onCheckedChange={(checked) => {
                  setAiSettings({
                    ...aiSettings,
                    useSingleApiKey: Boolean(checked),
                  });
                }}
              />
              <Label htmlFor="single-api-key" className="cursor-pointer">
                Tüm modüller için tek bir API anahtarı kullan
              </Label>
            </div>
            {aiSettings.useSingleApiKey && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="global-api-key">Global API Key</Label>
                  <Input
                    id="global-api-key"
                    type="password"
                    placeholder="sk-proj-..."
                    value={aiSettings.global?.apiKey || ''}
                    onChange={(e) => updateGlobalSettings({ apiKey: e.target.value })}
                    icon={KeyRound}
                  />
                  <p className="text-xs text-muted-foreground">
                    {aiSettings.global?.apiKey && aiSettings.global.apiKey.startsWith('***')
                      ? 'API key kaydedildi (maskelenmiş)'
                      : 'API key buraya yazın'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="global-model">Global Model</Label>
                  <Select
                    value={aiSettings.global?.model || 'gpt-4o'}
                    onValueChange={(value) => updateGlobalSettings({ model: value as AiModel })}
                  >
                    <SelectTrigger id="global-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Email Marketing Module */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Email Marketing</h3>
              <Checkbox
                checked={aiSettings.emailMarketing.enabled}
                onCheckedChange={(checked) => updateModuleSettings('emailMarketing', { enabled: Boolean(checked) })}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="email-api-key">API Key</Label>
                <Input
                  id="email-api-key"
                  type="password"
                  placeholder="sk-proj-..."
                  value={aiSettings.emailMarketing.apiKey || ''}
                  onChange={(e) => updateModuleSettings('emailMarketing', { apiKey: e.target.value })}
                  disabled={aiSettings.useSingleApiKey}
                  icon={KeyRound}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-model">Model Seçimi</Label>
                <Select
                  value={aiSettings.emailMarketing.model}
                  onValueChange={(value) => updateModuleSettings('emailMarketing', { model: value as AiModel })}
                >
                  <SelectTrigger id="email-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="outline"
              type="button"
              onClick={() => handleTestConnection('emailMarketing')}
              disabled={testingModule === 'emailMarketing'}
              className="w-full md:w-auto"
            >
              {testingModule === 'emailMarketing' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube2 className="mr-2 h-4 w-4" />
              )}
              Bağlantıyı Test Et
            </Button>
          </div>

          <Separator />

          {/* Social Media Module */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Social Media</h3>
              <Checkbox
                checked={aiSettings.social.enabled}
                onCheckedChange={(checked) => updateModuleSettings('social', { enabled: Boolean(checked) })}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="social-api-key">API Key</Label>
                <Input
                  id="social-api-key"
                  type="password"
                  placeholder="sk-proj-..."
                  value={aiSettings.social.apiKey || ''}
                  onChange={(e) => updateModuleSettings('social', { apiKey: e.target.value })}
                  disabled={aiSettings.useSingleApiKey}
                  icon={KeyRound}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social-model">Model Seçimi</Label>
                <Select
                  value={aiSettings.social.model}
                  onValueChange={(value) => updateModuleSettings('social', { model: value as AiModel })}
                >
                  <SelectTrigger id="social-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="outline"
              type="button"
              onClick={() => handleTestConnection('social')}
              disabled={testingModule === 'social'}
              className="w-full md:w-auto"
            >
              {testingModule === 'social' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube2 className="mr-2 h-4 w-4" />
              )}
              Bağlantıyı Test Et
            </Button>
          </div>

          <Separator />

          {/* Support Chatbot Module */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Support Chatbot</h3>
              <Checkbox
                checked={aiSettings.support.enabled}
                onCheckedChange={(checked) => updateModuleSettings('support', { enabled: Boolean(checked) })}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="support-api-key">API Key</Label>
                <Input
                  id="support-api-key"
                  type="password"
                  placeholder="sk-proj-..."
                  value={aiSettings.support.apiKey || ''}
                  onChange={(e) => updateModuleSettings('support', { apiKey: e.target.value })}
                  disabled={aiSettings.useSingleApiKey}
                  icon={KeyRound}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-model">Model Seçimi</Label>
                <Select
                  value={aiSettings.support.model}
                  onValueChange={(value) => updateModuleSettings('support', { model: value as AiModel })}
                >
                  <SelectTrigger id="support-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="outline"
              type="button"
              onClick={() => handleTestConnection('support')}
              disabled={testingModule === 'support'}
              className="w-full md:w-auto"
            >
              {testingModule === 'support' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube2 className="mr-2 h-4 w-4" />
              )}
              Bağlantıyı Test Et
            </Button>
          </div>

          <Separator />

          {/* Analytics Module */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Analytics (opsiyonel)</h3>
              <Checkbox
                checked={aiSettings.analytics.enabled}
                onCheckedChange={(checked) => updateModuleSettings('analytics', { enabled: Boolean(checked) })}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="analytics-api-key">API Key</Label>
                <Input
                  id="analytics-api-key"
                  type="password"
                  placeholder="sk-proj-..."
                  value={aiSettings.analytics.apiKey || ''}
                  onChange={(e) => updateModuleSettings('analytics', { apiKey: e.target.value })}
                  disabled={aiSettings.useSingleApiKey}
                  icon={KeyRound}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="analytics-model">Model Seçimi</Label>
                <Select
                  value={aiSettings.analytics.model}
                  onValueChange={(value) => updateModuleSettings('analytics', { model: value as AiModel })}
                >
                  <SelectTrigger id="analytics-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="outline"
              type="button"
              onClick={() => handleTestConnection('analytics')}
              disabled={testingModule === 'analytics'}
              className="w-full md:w-auto"
            >
              {testingModule === 'analytics' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube2 className="mr-2 h-4 w-4" />
              )}
              Bağlantıyı Test Et
            </Button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                AI Ayarlarını Kaydet
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
