'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bot, KeyRound, TestTube2, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Mail, Share2, MessageSquare, BarChart3, Sparkles, Activity, Cpu, Zap } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import settingsService, { AiSettings, AiModel, AiModuleSettings, AiProvider, ApiKeyDetectionResult } from '@/lib/api/settingsService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';

// AI Providers
const AI_PROVIDERS = [
  { value: 'openai' as AiProvider, label: 'OpenAI', icon: '🤖', description: 'GPT models from OpenAI' },
  { value: 'anthropic' as AiProvider, label: 'Anthropic', icon: '🧠', description: 'Claude models from Anthropic' },
  { value: 'google' as AiProvider, label: 'Google', icon: '🔍', description: 'Gemini models from Google' },
  { value: 'deepseek' as AiProvider, label: 'DeepSeek', icon: '🔬', description: 'DeepSeek AI models' },
  { value: 'openrouter' as AiProvider, label: 'OpenRouter', icon: '🌐', description: 'Access to multiple models via OpenRouter' },
  { value: 'local' as AiProvider, label: 'Local AI', icon: '🏠', description: 'Local models via Ollama' },
];

// AI Models grouped by provider with recommended flags
const AI_MODELS_BY_PROVIDER: Record<AiProvider, Array<{ value: AiModel; label: string; cost: string; recommended?: boolean }>> = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o', cost: 'High', recommended: true },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', cost: 'High' },
    { value: 'gpt-4', label: 'GPT-4', cost: 'High' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Faster)', cost: 'Low' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Latest)', cost: 'Medium', recommended: true },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', cost: 'High' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', cost: 'Medium' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast)', cost: 'Low' },
  ],
  google: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', cost: 'Low', recommended: true },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', cost: 'Medium' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', cost: 'Medium' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast)', cost: 'Low' },
    { value: 'gemini-pro', label: 'Gemini Pro', cost: 'Medium' },
    { value: 'gemini-pro-vision', label: 'Gemini Pro Vision', cost: 'Medium' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat', cost: 'Low', recommended: true },
    { value: 'deepseek-coder', label: 'DeepSeek Coder', cost: 'Low' },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner', cost: 'Medium' },
  ],
  openrouter: [
    { value: 'openai/gpt-4', label: 'GPT-4 via OpenRouter', cost: 'High', recommended: true },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet via OpenRouter', cost: 'Medium' },
    { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', cost: 'Low' },
  ],
  local: [
    { value: 'llama3.1', label: 'Llama 3.1 (Local)', cost: 'Free', recommended: true },
    { value: 'mistral', label: 'Mistral (Local)', cost: 'Free' },
    { value: 'codellama', label: 'Code Llama (Local)', cost: 'Free' },
  ],
};

// Module metadata for tabs
const MODULES = [
  { key: 'emailMarketing', label: 'Email Marketing', icon: Mail, description: 'AI for email campaigns and content' },
  { key: 'social', label: 'Social Media', icon: Share2, description: 'AI for social media posts' },
  { key: 'support', label: 'Support & Chat', icon: MessageSquare, description: 'Chatbot and FAQ learning' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, description: 'AI insights and analytics' },
] as const;

const AiSettingsLayoutWrapper = ({
  children,
  settings,
  isLoading
}: {
  children: React.ReactNode;
  settings: AiSettings | null;
  isLoading: boolean;
}) => {
  return (
    <BccEditorialWrapper
      theme="tenant-admin"
      headerTitle="Neural Intelligence"
      headerSubtitle="Calibrating autonomous cognitive vectors and model orchestration."
      headerBadge="AI Console"
      telemetryData={isLoading || !settings ? [] : [
        { label: 'CONFIG_SOURCE', value: 'TENANT_DB', color: '#9df425' },
        { label: 'ACTIVE_NODES', value: settings?.useSingleApiKey ? 'UNIFIED' : 'MULTI', color: '#9df425' },
        { label: 'ENABLED_MODULES', value: String(MODULES.filter(({ key }) => settings[key].enabled).length), color: '#9df425' }
      ]}
    >
      <div className="relative z-10 w-full min-h-screen flex flex-col pt-0">
        {children}
      </div>
    </BccEditorialWrapper>
  );
};

export default function AiSettingsPage() {
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [testingModule, setTestingModule] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState('global');
  const { toast } = useToast();

  // Auto-detection state
  const [globalDetection, setGlobalDetection] = useState<ApiKeyDetectionResult | null>(null);
  const [isDetectingGlobal, setIsDetectingGlobal] = useState(false);
  const [moduleDetections, setModuleDetections] = useState<Record<string, ApiKeyDetectionResult | null>>({});
  const [detectingModules, setDetectingModules] = useState<Record<string, boolean>>({});
  const detectionTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const loadAiSettings = useCallback(async () => {
    try {
      const settings = await settingsService.getAiSettings();
      setAiSettings(settings);
      setLoadError(null);
    } catch {
      setAiSettings(null);
      setLoadError('AI yapılandırması yüklenemedi. Sunucu bağlantısını ve yetkinizi kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    settingsService.getAiSettings()
      .then((settings) => {
        if (!active) return;
        setAiSettings(settings);
        setLoadError(null);
      })
      .catch(() => {
        if (!active) return;
        setAiSettings(null);
        setLoadError('AI yapılandırması yüklenemedi. Sunucu bağlantısını ve yetkinizi kontrol edin.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    if (!aiSettings) return;

    try {
      setIsSaving(true);
      await settingsService.updateAiSettings(aiSettings);
      toast({
        title: 'Protocol Updated',
        description: 'Neural configuration saved successfully.',
      });
      // Reload to get masked API keys
      await loadAiSettings();
    } catch (error: any) {
      console.error('Failed to save AI settings:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Could not persist configuration.',
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
          title: 'Handshake Successful',
          description: result.message,
        });
      } else {
        toast({
          title: 'Handshake Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      toast({
        title: 'Test Protocol Error',
        description: error.message || 'Connection test failed.',
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
        ...(aiSettings.global || { model: 'gpt-4o', enabled: true, provider: 'openai' }),
        ...updates,
      },
    });
  };

  // Helper: Get current global provider from settings
  const getCurrentGlobalProvider = (): AiProvider => {
    if (aiSettings?.global?.provider) {
      return aiSettings.global.provider;
    }
    if (aiSettings?.global?.model) {
      return getProviderFromModel(aiSettings.global.model);
    }
    return 'openai';
  };

  // Helper function to get provider from model
  const getProviderFromModel = (model: string): AiProvider => {
    if (model.startsWith('gpt-')) return 'openai';
    if (model.startsWith('claude-')) return 'anthropic';
    if (model.startsWith('gemini-')) return 'google';
    if (model.startsWith('deepseek-')) return 'deepseek';
    if (model.includes('/')) return 'openrouter';
    if (['llama3.1', 'mistral', 'codellama'].includes(model)) return 'local';
    return 'openai';
  };

  // Helper function to get available models for selected provider
  const getAvailableModels = (provider: AiProvider) => {
    return AI_MODELS_BY_PROVIDER[provider] || [];
  };

  // Helper: Get model info (label and cost) from model value
  const getModelInfo = (modelValue: string, provider: AiProvider) => {
    const models = AI_MODELS_BY_PROVIDER[provider] || [];
    const modelInfo = models.find(m => m.value === modelValue);
    return modelInfo || { value: modelValue, label: modelValue, cost: 'Unknown' };
  };

  // Helper: Get cost badge color
  const getCostBadgeClass = (cost: string) => {
    switch (cost) {
      case 'Free': return 'bg-green-500/10 text-green-500 border border-green-500/20';
      case 'Low': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      case 'High': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default: return 'bg-white/10 text-white/60 border border-white/10';
    }
  };

  // Helper: Check if API key is masked
  const isApiKeyMasked = (apiKey: string | undefined): boolean => {
    return Boolean(apiKey && apiKey.startsWith('***'));
  };

  // Auto-detect provider from API key (debounced)
  const detectProviderFromKey = async (apiKey: string, scope: 'global' | string) => {
    if (!apiKey || apiKey.length < 10 || apiKey.startsWith('***')) {
      if (scope === 'global') {
        setGlobalDetection(null);
      } else {
        setModuleDetections(prev => ({ ...prev, [scope]: null }));
      }
      return;
    }

    if (detectionTimeoutRef.current[scope]) {
      clearTimeout(detectionTimeoutRef.current[scope]);
    }

    if (scope === 'global') {
      setIsDetectingGlobal(true);
    } else {
      setDetectingModules(prev => ({ ...prev, [scope]: true }));
    }

    detectionTimeoutRef.current[scope] = setTimeout(async () => {
      try {
        const result = await settingsService.detectProvider(apiKey);

        if (scope === 'global') {
          setGlobalDetection(result);
          if (result.isValid && aiSettings?.global) {
            updateGlobalSettings({
              provider: result.provider,
              model: result.defaultModel,
            });
          }
        } else {
          setModuleDetections(prev => ({ ...prev, [scope]: result }));
          if (result.isValid && aiSettings) {
            if (aiSettings.useSingleApiKey) {
              updateGlobalSettings({
                provider: result.provider,
                model: result.defaultModel,
              });
            } else {
              updateModuleSettings(scope as keyof Omit<AiSettings, 'useSingleApiKey' | 'global'>, {
                provider: result.provider,
                model: result.defaultModel,
              });
            }
          }
        }
      } catch (error) {
        console.error('Auto-detection failed:', error);
      } finally {
        if (scope === 'global') {
          setIsDetectingGlobal(false);
        } else {
          setDetectingModules(prev => ({ ...prev, [scope]: false }));
        }
      }
    }, 500);
  };

  const handleToggleSingleApiKey = (checked: boolean) => {
    if (!aiSettings) return;

    setAiSettings({
      ...aiSettings,
      useSingleApiKey: checked,
      ...(checked ? {
        emailMarketing: { ...aiSettings.emailMarketing, enabled: true },
        social: { ...aiSettings.social, enabled: true },
        support: { ...aiSettings.support, enabled: true },
        analytics: { ...aiSettings.analytics, enabled: true },
      } : {}),
    });
  };

  if (isLoading) {
    return (
      <AiSettingsLayoutWrapper settings={null} isLoading={true}>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full bg-white/5" />
          <Skeleton className="h-64 w-full bg-white/5" />
        </div>
      </AiSettingsLayoutWrapper>
    );
  }

  if (loadError || !aiSettings) {
    return (
      <AiSettingsLayoutWrapper settings={null} isLoading={false}>
        <Alert className="border-red-500/30 bg-red-500/5">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle>AI ayarları kullanılamıyor</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{loadError || 'AI ayarları bulunamadı.'}</span>
            <Button type="button" variant="outline" onClick={() => {
              setIsLoading(true);
              setLoadError(null);
              void loadAiSettings();
            }}>
              Yeniden dene
            </Button>
          </AlertDescription>
        </Alert>
      </AiSettingsLayoutWrapper>
    );
  }

  const currentGlobalProvider = getCurrentGlobalProvider();

  return (
    <AiSettingsLayoutWrapper settings={aiSettings} isLoading={false}>
      <div className="space-y-8 pb-20">

        {/* Top Status Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BccHudTile title="PROVIDER_MODE" subtitle="Architectural Strategy" icon={Bot as any}>
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">
              {aiSettings.useSingleApiKey ? 'UNIFIED' : 'DISTRIBUTED'}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-[10px] uppercase tracking-widest text-[#9df425]">
                {aiSettings.useSingleApiKey ? 'SINGLE_PIPE_DEPLOYMENT' : 'MULTI_NODE_DEPLOYMENT'}
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="single-api-key" className="text-[9px] uppercase tracking-widest text-white/40 cursor-pointer">
                  Use Unified Key
                </Label>
                <Switch
                  id="single-api-key"
                  checked={aiSettings.useSingleApiKey}
                  onCheckedChange={handleToggleSingleApiKey}
                  className="scale-75 data-[state=checked]:bg-[#9df425]"
                />
              </div>
            </div>
          </BccHudTile>

          <BccHudTile title="CONFIGURED_MODULES" subtitle="Enabled AI consumers" icon={Activity as any}>
            <div className="text-3xl font-bold font-mono tracking-tighter text-[#9df425]">
              {MODULES.filter(({ key }) => aiSettings[key].enabled).length} / {MODULES.length}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1 flex items-center gap-2">
              SAVED_TENANT_CONFIGURATION
            </div>
          </BccHudTile>
        </div>

        {/* Configuration Console */}
        <div className="bcc-glass border-none bg-white/[0.01] overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/5 border-b border-white/10 p-1 h-auto w-full justify-start rounded-none">
              <TabsTrigger
                value="global"
                className="data-[state=active]:bg-[#9df425] data-[state=active]:text-black text-[10px] uppercase tracking-widest px-8 py-3 font-bold rounded-none transition-all"
              >
                Global_Core
              </TabsTrigger>
              {MODULES.map((module) => (
                <TabsTrigger
                  key={module.key}
                  value={module.key}
                  className="data-[state=active]:bg-[#9df425] data-[state=active]:text-black text-[10px] uppercase tracking-widest px-8 py-3 font-bold rounded-none transition-all"
                >
                  {module.label.split(' ')[0]}_NODE
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Global Settings */}
            <TabsContent value="global" className="p-8 mt-0 animate-in fade-in duration-500">
              <div className="mb-8 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] font-mono flex items-center gap-3">
                    <div className="w-1 h-4 bg-[#9df425]"></div>
                    Global Intelligence Parameters
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mt-2 ml-4">
                    Base configuration for unassigned autonomous agents.
                  </p>
                </div>
              </div>

              {!aiSettings.useSingleApiKey && (
                <Alert className="mb-0 border-[#ff8c00]/20 bg-[#ff8c00]/5 rounded-none">
                  <AlertCircle className="h-4 w-4 text-[#ff8c00]" />
                  <AlertDescription className="text-[10px] font-mono text-[#ff8c00]/80 uppercase tracking-wider">
                    GLOBAL_OVERRIDE_DISABLED: Modules are operating in distributed mode. Enable &apos;Unified Key&apos; to enforce global settings.
                  </AlertDescription>
                </Alert>
              )}

              {aiSettings.useSingleApiKey && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    {/* Provider Select */}
                    <div className="space-y-3">
                      <Label className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-mono">Inference Provider</Label>
                      <Select
                        value={currentGlobalProvider}
                        onValueChange={(value: AiProvider) => {
                          const models = getAvailableModels(value);
                          const defaultModel = models.find(m => m.recommended)?.value || models[0]?.value;
                          updateGlobalSettings({
                            provider: value,
                            model: defaultModel as AiModel,
                          });
                        }}
                      >
                        <SelectTrigger className="bg-white/[0.03] border-white/10 rounded-none font-mono text-xs h-12 w-full hover:bg-white/[0.05] transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-none">
                          {AI_PROVIDERS.map((provider) => (
                            <SelectItem key={provider.value} value={provider.value} className="font-mono text-[10px] uppercase tracking-wider focus:bg-[#9df425]/20 focus:text-white">
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Model Select */}
                    <div className="space-y-3">
                      <Label className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-mono">Model Architecture</Label>
                      {currentGlobalProvider === 'openrouter' ? (
                        <Input
                          type="text"
                          placeholder="provider/model-name:variant"
                          value={aiSettings.global?.model || ''}
                          onChange={(e) => updateGlobalSettings({ model: e.target.value as AiModel })}
                          className="bg-white/[0.03] border-white/10 rounded-none font-mono text-xs h-12"
                        />
                      ) : (
                        <div className="flex items-center gap-4 p-4 border border-white/5 bg-white/[0.03] rounded-none">
                          <Sparkles className="h-4 w-4 text-[#9df425]" />
                          <span className="font-mono text-xs uppercase tracking-widest text-white/90">
                            {getModelInfo(aiSettings.global?.model || globalDetection?.defaultModel || 'gpt-4o', currentGlobalProvider).label}
                          </span>
                          <Badge variant="outline" className={`ml-auto font-mono text-[9px] rounded-none uppercase tracking-widest ${getCostBadgeClass(getModelInfo(aiSettings.global?.model || globalDetection?.defaultModel || 'gpt-4o', currentGlobalProvider).cost)}`}>
                            {getModelInfo(aiSettings.global?.model || globalDetection?.defaultModel || 'gpt-4o', currentGlobalProvider).cost}_COST
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* API Key */}
                    {currentGlobalProvider !== 'local' && (
                      <div className="space-y-3">
                        <Label className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-mono flex justify-between">
                          <span>Authentication Key</span>
                          <span className="cursor-pointer hover:text-[#9df425] transition-colors" onClick={() => setShowApiKey(!showApiKey)}>
                            [{showApiKey ? "HIDE_SIGIL" : "REVEAL_SIGIL"}]
                          </span>
                        </Label>
                        <div className="relative">
                          <Input
                            type={showApiKey ? 'text' : 'password'}
                            placeholder="sk-..."
                            value={aiSettings.global?.apiKey || ''}
                            onChange={(e) => {
                              const newKey = e.target.value;
                              updateGlobalSettings({ apiKey: newKey });
                              detectProviderFromKey(newKey, 'global');
                            }}
                            className="bg-white/[0.03] border-white/10 rounded-none font-mono text-xs h-12 pr-12"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {isDetectingGlobal ? (
                              <Loader2 className="h-4 w-4 animate-spin text-[#9df425]" />
                            ) : globalDetection?.isValid ? (
                              <CheckCircle2 className="h-4 w-4 text-[#9df425]" />
                            ) : null}
                          </div>
                        </div>
                        {globalDetection && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={`font-mono text-[9px] rounded-none uppercase tracking-widest border-none p-0 ${globalDetection.isValid ? 'text-[#9df425]' : 'text-red-500'}`}>
                              {globalDetection.isValid ? `> VERIFIED: ${globalDetection.providerName}` : '> INVALID_PROTOCOL'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Module Settings Tabs */}
            {MODULES.map((module) => (
              <TabsContent key={module.key} value={module.key} className="p-8 mt-0 animate-in fade-in duration-500">
                <div className="mb-8 flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] font-mono flex items-center gap-3">
                      <div className="w-1 h-4 bg-[#9df425]"></div>
                      {module.label} Neural Node
                    </h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mt-2 ml-4">
                      {module.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 p-2 px-4 border border-white/10">
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">NODE_STATE:</span>
                    <Switch
                      checked={aiSettings[module.key].enabled}
                      onCheckedChange={(checked) => updateModuleSettings(module.key, { enabled: checked })}
                      className="data-[state=checked]:bg-[#9df425] scale-90"
                    />
                  </div>
                </div>

                {aiSettings.useSingleApiKey ? (
                  <div className="p-6 border border-[#9df425]/20 bg-[#9df425]/5 font-mono text-[10px] text-[#9df425] uppercase tracking-widest flex items-center gap-3">
                    <Bot className="w-4 h-4" />
                    <span>Inheriting cognitive infrastructure from GLOBAL_CORE_NODE.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-8">
                      {/* Provider Select */}
                      <div className="space-y-3">
                        <Label className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-mono">Module Provider</Label>
                        <Select
                          value={aiSettings[module.key].provider || 'openai'}
                          onValueChange={(value: AiProvider) => {
                            const models = getAvailableModels(value);
                            const defaultModel = models.find(m => m.recommended)?.value || models[0]?.value;
                            updateModuleSettings(module.key, {
                              provider: value,
                              model: defaultModel as AiModel,
                            });
                          }}
                        >
                          <SelectTrigger className="bg-white/[0.03] border-white/10 rounded-none font-mono text-xs h-12 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-none">
                            {AI_PROVIDERS.map((provider) => (
                              <SelectItem key={provider.value} value={provider.value} className="font-mono text-[10px] uppercase tracking-wider focus:bg-[#9df425]/20 focus:text-white">
                                {provider.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Model Config */}
                      <div className="space-y-3">
                        <Label className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-mono">Model Configuration</Label>
                        {(aiSettings[module.key].provider || 'openai') === 'openrouter' ? (
                          <Input
                            type="text"
                            value={aiSettings[module.key].model || ''}
                            onChange={(e) => updateModuleSettings(module.key, { model: e.target.value as AiModel })}
                            className="bg-white/[0.03] border-white/10 rounded-none font-mono text-xs h-12"
                          />
                        ) : (
                          <div className="flex items-center gap-4 p-4 border border-white/5 bg-white/[0.03] rounded-none">
                            <Sparkles className="h-4 w-4 text-[#9df425]" />
                            <span className="font-mono text-xs uppercase tracking-widest text-white/90">
                              {getModelInfo(aiSettings[module.key].model || moduleDetections[module.key]?.defaultModel || 'gpt-4o', aiSettings[module.key].provider || 'openai').label}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* API Key */}
                      {(aiSettings[module.key].provider || 'openai') !== 'local' && (
                        <div className="space-y-3">
                          <Label className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-mono">Module API Key</Label>
                          <div className="relative">
                            <Input
                              type="password"
                              placeholder="sk-..."
                              value={aiSettings[module.key].apiKey || ''}
                              onChange={(e) => {
                                const newKey = e.target.value;
                                updateModuleSettings(module.key, { apiKey: newKey });
                                detectProviderFromKey(newKey, module.key);
                              }}
                              className="bg-white/[0.03] border-white/10 rounded-none font-mono text-xs h-12 pr-12"
                            />
                            {detectingModules[module.key] && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-[#9df425]" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        onClick={() => handleTestConnection(module.key)}
                        disabled={testingModule === module.key || !aiSettings[module.key].enabled}
                        className="w-full rounded-none border-white/10 bg-white/[0.02] hover:bg-[#9df425] hover:text-black font-mono uppercase tracking-[0.2em] text-[10px] h-12 transition-all"
                      >
                        {testingModule === module.key ? (
                          <Loader2 className="mr-3 h-3 w-3 animate-spin" />
                        ) : (
                          <TestTube2 className="mr-3 h-3 w-3" />
                        )}
                        Execute_Connection_Handshake
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-[0.3em] mb-1">
            PENDING_MODIFICATIONS: {isSaving ? "LOCK" : "IDLE"}
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#9df425] hover:bg-[#8cdb22] text-black font-bold uppercase tracking-[0.3em] font-mono rounded-none h-14 px-10 min-w-[240px] shadow-[0_0_30px_rgba(157,244,37,0.2)] hover:shadow-[0_0_50px_rgba(157,244,37,0.4)] transition-all flex items-center gap-4 group"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>PERSISTING_DATA...</span>
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 fill-current group-hover:scale-110 transition-transform" />
                <span>PERSIST_RESONANCE</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </AiSettingsLayoutWrapper>
  );
}
