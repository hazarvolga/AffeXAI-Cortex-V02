'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  Filter,
  Zap,
  Shield,
  Calendar,
  BarChart3,
  Info,
  Loader2,
  HelpCircle,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  EyeOff,
  Server,
  Activity,
  Terminal,
  Cpu,
  Database,
  Layers,
  Wrench
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';

// --- Static Configuration Definitions ---
const CONFIG_CATEGORIES = [
  { key: 'thresholds', label: 'Thresholds', icon: BarChart3, description: 'Confidence scores & decision boundaries' },
  { key: 'recognition', label: 'Pattern Rec', icon: Brain, description: 'Similarity & NLP parameters' },
  { key: 'processing', label: 'Processing', icon: Zap, description: 'Batch & realtime pipeline rules' },
  { key: 'quality', label: 'Quality', icon: Shield, description: 'Content validation standards' },
  { key: 'sources', label: 'Sources', icon: Database, description: 'Ingestion channel feedback' },
  { key: 'categories', label: 'Taxonomy', icon: Layers, description: 'Auto-categorization logic' },
  { key: 'ai', label: 'Neural Core', icon: Cpu, description: 'LLM model parameters & prompts' },
  { key: 'advanced', label: 'System', icon: Terminal, description: 'Low-level retention & debug' },
];

interface ConfigSection {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  settings: ConfigSetting[];
}

interface ConfigSetting {
  key: string;
  label: string;
  description: string;
  type: 'number' | 'boolean' | 'string' | 'select' | 'range' | 'textarea' | 'multiselect';
  value: any;
  defaultValue: any;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
  };
}

export default function ConfigurationManagementPage() {
  // State
  const [configSections, setConfigSections] = useState<ConfigSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [changedSettings, setChangedSettings] = useState<Set<string>>(new Set());
  const [originalValues, setOriginalValues] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('thresholds');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [aiProviderInfo, setAiProviderInfo] = useState<{
    currentProvider: string;
    currentModel: string;
    available: boolean;
    isReadOnly: boolean;
    globalSettingsUrl: string;
  } | null>(null);
  const [saveProgress, setSaveProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const { toast } = useToast();

  // --- Initialization ---
  useEffect(() => {
    loadConfiguration();
    loadAiProviderInfo();
  }, []);

  const loadAiProviderInfo = async () => {
    try {
      const { FaqLearningService } = await import('@/services/faq-learning.service');
      const data = await FaqLearningService.getAiProviderInfo();
      setAiProviderInfo(data);
    } catch (error) {
      console.warn('AI Info Load Failed:', error);
    }
  };

  const loadConfiguration = async (retryCount = 0) => {
    setIsLoading(true);
    try {
      const { FaqLearningService } = await import('@/services/faq-learning.service');

      // Fetch Config
      const data = await FaqLearningService.getConfig();
      console.log('📦 Config Data Received:', data);

      if (!data || !Array.isArray(data.configurations)) {
        throw new Error('Invalid config response structure');
      }

      // Transform
      const sections = transformToConfigSections(data.configurations);
      setConfigSections(sections);

      // Snapshot for "Reset" and "Unsaved Changes"
      const originalVals: Record<string, any> = {};
      sections.forEach(section => {
        section.settings.forEach(setting => {
          originalVals[`${section.key}-${setting.key}`] = setting.value;
        });
      });
      setOriginalValues(originalVals);

      // Cleanup
      setHasChanges(false);
      setChangedSettings(new Set());

    } catch (error) {
      console.error('Config Load Error:', error);
      toast({
        title: 'Sync Error',
        description: 'Failed to synchronize configuration with neural core.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const transformToConfigSections = (configs: any[]): ConfigSection[] => {
    // Group flat config list by category
    const grouped = configs.reduce((acc, config) => {
      const category = config.category || 'advanced'; // Fallback to advanced
      if (!acc[category]) acc[category] = [];

      acc[category].push({
        key: config.key,
        label: formatLabel(config.key),
        description: config.description || '',
        type: config.type || inferType(config.value),
        value: config.value,
        defaultValue: config.value,
        min: config.min,
        max: config.max,
        step: config.step,
        unit: config.unit,
        options: config.options,
        validation: config.validation
      });
      return acc;
    }, {} as Record<string, ConfigSetting[]>);

    // Map to our STATIC Categories to ensure structure exists
    return CONFIG_CATEGORIES.map(cat => ({
      key: cat.key,
      title: cat.label,
      description: cat.description,
      icon: <cat.icon className="h-4 w-4" />,
      settings: grouped[cat.key] || [] // Empty array if no settings found for this category
    }));
  };

  // --- Utilities ---
  const formatLabel = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  const inferType = (value: any) => typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string';

  // --- Handlers ---
  const updateSettingValue = (sectionKey: string, settingKey: string, value: any) => {
    const settingId = `${sectionKey}-${settingKey}`;

    // 1. Update State
    setConfigSections(prev => prev.map(section =>
      section.key === sectionKey ? {
        ...section,
        settings: section.settings.map(s => s.key === settingKey ? { ...s, value } : s)
      } : section
    ));

    // 2. Track Deltas
    const original = originalValues[settingId];
    const isChanged = JSON.stringify(value) !== JSON.stringify(original);

    setChangedSettings(prev => {
      const next = new Set(prev);
      isChanged ? next.add(settingId) : next.delete(settingId);
      setHasChanges(next.size > 0);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { FaqLearningService } = await import('@/services/faq-learning.service');

      // Flatten all settings
      const payload = configSections.flatMap(section =>
        section.settings.map(s => ({
          configKey: s.key,
          configValue: s.value,
          category: section.key
        }))
      );

      const result = await FaqLearningService.bulkUpdateConfig(payload);

      if (result.success) {
        toast({ title: 'Configuration Synthesized', description: 'Neural parameters updated successfully.', className: 'bg-[#9df425] text-black border-none' });

        // Update "Original" baseline
        const newOriginals: Record<string, any> = {};
        configSections.flatMap(s => s.settings).forEach(s => {
          newOriginals[`${configSections.find(sec => sec.settings.includes(s))?.key}-${s.key}`] = s.value;
        });
        setOriginalValues(newOriginals);
        setChangedSettings(new Set());
        setHasChanges(false);
      }
    } catch (error) {
      toast({ title: 'Write Validation Failed', description: 'Could not commit changes to core.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async (sectionKey: string) => {
    if (!confirm('Reset this sector to factory defaults?')) return;

    setIsResetting(sectionKey);
    try {
      const { FaqLearningService } = await import('@/services/faq-learning.service');
      await FaqLearningService.resetConfigSection(sectionKey);
      await loadConfiguration(); // Reload to get fresh defaults
      toast({ title: 'Sector Reset', description: 'Default parameters restored.' });
    } catch (e) {
      toast({ title: 'Reset Failed', variant: 'destructive' });
    } finally {
      setIsResetting(null);
    }
  };

  // --- Renderers ---
  const renderInput = (section: ConfigSection, setting: ConfigSetting) => {
    const commonProps = {
      id: `${section.key}-${setting.key}`,
      disabled: isSaving,
      'aria-label': setting.label
    };

    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={setting.value}
              onCheckedChange={(v) => updateSettingValue(section.key, setting.key, v)}
              className="data-[state=checked]:bg-[#9df425] data-[state=unchecked]:bg-white/10"
              {...commonProps}
            />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              {setting.value ? 'ENABLE' : 'DISABLE'}
            </span>
          </div>
        );

      case 'range':
        return (
          <div className="space-y-4 w-full max-w-md">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold font-mono text-[#9df425] tracking-tighter">
                {setting.value}<span className="text-base opacity-50">{setting.unit}</span>
              </span>
            </div>
            <Slider
              min={setting.min || 0}
              max={setting.max || 100}
              step={setting.step || 1}
              value={[setting.value]}
              onValueChange={([v]) => updateSettingValue(section.key, setting.key, v)}
              className="[&>.relative>.absolute]:bg-[#9df425]"
              {...commonProps}
            />
            <div className="flex justify-between text-[9px] font-mono text-white/20">
              <span>MIN: {setting.min}</span>
              <span>MAX: {setting.max}</span>
            </div>
          </div>
        );

      case 'select':
        return (
          <Select value={setting.value} onValueChange={(v) => updateSettingValue(section.key, setting.key, v)}>
            <SelectTrigger className="bg-black/40 border-white/10 text-white font-mono text-xs w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a0a] border-white/10">
              {setting.options?.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-white font-mono text-xs focus:bg-white/10">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default: // text, number
        return (
          <div className="relative group">
            <Input
              type={setting.type === 'number' ? 'number' : 'text'}
              value={setting.value}
              onChange={(e) => updateSettingValue(section.key, setting.key, setting.type === 'number' ? Number(e.target.value) : e.target.value)}
              className={`
                bg-black/40 border-white/10 text-white font-mono text-sm 
                focus:border-[#9df425] transition-all
                ${setting.type === 'number' ? 'text-right font-bold text-[#9df425] max-w-[140px]' : 'max-w-md'}
              `}
              {...commonProps}
            />
            {setting.unit && setting.type === 'number' && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/30 pointer-events-none">
                {setting.unit}
              </div>
            )}
          </div>
        );
    }
  };

  // --- Main Render ---
  return (
    <BccEditorialWrapper
      headerTitle="Configuration Matrix"
      headerSubtitle="System Parameters // Neural Weights // Protocols"
      headerBadge="Settings v2.1"
      telemetryData={[
        { label: "Active Vectors", value: `${configSections.reduce((a, s) => a + s.settings.length, 0)}`, suffix: "KEYS" },
        { label: "Uncommitted", value: `${changedSettings.size}`, suffix: "DELTA", color: changedSettings.size > 0 ? "#f97316" : "#ffffff" },
        { label: "Uplink", value: isOnline ? "ESTABLISHED" : "LOST", color: isOnline ? "#9df425" : "#ef4444" }
      ]}
      moduleNav={
        <div className="flex gap-2 items-center">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`
              uppercase tracking-widest font-mono text-[10px] font-bold h-8
              ${hasChanges ? 'bg-[#9df425] text-black hover:bg-[#8ce022]' : 'bg-white/5 text-white/20'}
            `}
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-2" />}
            {isSaving ? 'Synthesizing...' : 'Commit Changes'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col h-full space-y-6 pb-24">

        {/* TAB SYSTEM - STATIC DEFINITION TO PREVENT COLLAPSE */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          {/* Glassmorphic Tab Rail */}
          <div className="sticky top-0 z-20 bg-gradient-to-b from-[#080808] to-transparent pt-2 pb-6">
            <TabsList className="bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 p-1 h-auto flex flex-wrap justify-start gap-1 w-full">
              {CONFIG_CATEGORIES.map(cat => {
                const isActive = activeTab === cat.key;
                const hasDelta = configSections.find(s => s.key === cat.key)?.settings.some(set => changedSettings.has(`${cat.key}-${set.key}`));

                return (
                  <TabsTrigger
                    key={cat.key}
                    value={cat.key}
                    className={`
                      relative flex items-center gap-2 px-4 py-2 rounded-sm border border-transparent transition-all
                      data-[state=active]:bg-[#9df425] data-[state=active]:text-black
                      data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:text-white/60
                    `}
                  >
                    <cat.icon className="h-3 w-3" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">{cat.label}</span>
                    {hasDelta && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative min-h-[400px]">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-[#9df425] mx-auto" />
                  <p className="text-[10px] font-mono uppercase text-white/40">Decrypting Configuration...</p>
                </div>
              </div>
            ) : (
              configSections.map(section => (
                <TabsContent key={section.key} value={section.key} className="space-y-8 animate-in slide-in-from-bottom-2 fade-in duration-300">

                  {/* Category Header */}
                  <div className="flex items-end justify-between border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                        {section.icon}
                        <span className="tracking-tighter">{section.title}</span>
                      </h2>
                      <p className="text-xs font-mono text-white/40 mt-1">{section.description}</p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset(section.key)}
                      disabled={isResetting === section.key}
                      className="text-[10px] uppercase text-white/30 hover:text-red-400 hover:bg-white/5"
                    >
                      Restore Factory Defaults
                    </Button>
                  </div>

                  {/* AI Special Panel */}
                  {section.key === 'ai' && aiProviderInfo && (
                    <div className="grid grid-cols-2 gap-4">
                      <BccHudTile title="Active Model" icon="brain" accentColor="#9df425">
                        <div className="text-xl font-bold font-mono">{aiProviderInfo.currentModel}</div>
                        <div className="text-[10px] text-white/40 uppercase mt-1">{aiProviderInfo.currentProvider} // {aiProviderInfo.available ? 'ONLINE' : 'OFFLINE'}</div>
                      </BccHudTile>
                      <BccHudTile title="Global Override" icon="lock" accentColor="#3b82f6">
                        <div className="text-xs font-mono text-white/60 leading-relaxed">
                          Model selection is managed by the Global Administrator. You may only tune temperature and token limits.
                        </div>
                      </BccHudTile>
                    </div>
                  )}

                  {/* Settings Grid */}
                  {section.settings.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {section.settings.map(setting => {
                        const isModified = changedSettings.has(`${section.key}-${setting.key}`);

                        return (
                          <div
                            key={setting.key}
                            className={`
                              group relative p-6 border transition-all duration-200
                              ${isModified ? 'bg-orange-500/5 border-orange-500/30' : 'bg-[#0a0a0a]/40 border-white/5 hover:border-white/10'}
                            `}
                          >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

                              {/* Label Column */}
                              <div className="flex-1 max-w-sm space-y-2">
                                <Label className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isModified ? 'text-orange-400' : 'text-white/70'}`}>
                                  {setting.label}
                                  {isModified && <Badge variant="outline" className="text-[8px] bg-orange-500/10 border-orange-500/20 text-orange-500 rounded-sm py-0">DELTA</Badge>}
                                </Label>
                                <p className="text-[11px] text-white/30 font-mono leading-relaxed">
                                  {setting.description}
                                </p>
                              </div>

                              {/* Input Column */}
                              <div className="flex-1 flex justify-end items-center">
                                {renderInput(section, setting)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border border-dashed border-white/10 rounded-md p-12 text-center">
                      <Settings className="h-8 w-8 text-white/20 mx-auto mb-4" />
                      <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">No Configuration Keys Found</h3>
                      <p className="text-xs font-mono text-white/20 mt-1">This sector accepts no user-modifiable parameters.</p>
                    </div>
                  )}
                </TabsContent>
              ))
            )}
          </div>
        </Tabs>
      </div>
    </BccEditorialWrapper>
  );
}
