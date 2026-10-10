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
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

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
  const [configSections, setConfigSections] = useState<ConfigSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState<string | null>(null); // Track which section is being reset
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
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  const { toast } = useToast();

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Network connectivity detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
      toast({
        title: 'Bağlantı Yeniden Kuruldu',
        description: 'İnternet bağlantınız geri geldi.',
        variant: 'default',
        duration: 3000
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
      toast({
        title: 'Bağlantı Kesildi',
        description: 'İnternet bağlantınız kesildi. Değişiklikler kaydedilmeyebilir.',
        variant: 'destructive',
        duration: 5000
      });
    };

    // Connection quality detection
    const checkConnectionQuality = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setConnectionQuality('offline');
        return;
      }

      try {
        const start = Date.now();
        await fetch('/api/ping', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        });
        const duration = Date.now() - start;

        setConnectionQuality(duration > 2000 ? 'poor' : 'good');
      } catch {
        setConnectionQuality('poor');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection quality periodically
    const qualityInterval = setInterval(checkConnectionQuality, 30000);
    checkConnectionQuality(); // Initial check

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(qualityInterval);
    };
  }, [toast]);

  useEffect(() => {
    loadConfiguration();
    loadAiProviderInfo();
  }, []);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istediğinizden emin misiniz?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const loadAiProviderInfo = async () => {
    try {
      const { FaqLearningService } = await import('@/services/faq-learning.service');
      const data = await FaqLearningService.getAiProviderInfo();
      setAiProviderInfo(data);
    } catch (error) {
      console.error('Failed to load AI provider info:', error);
    }
  };

  const loadConfiguration = async (retryCount = 0) => {
    setIsLoading(true);

    try {
      const { FaqLearningService } = await import('@/services/faq-learning.service');

      // Add timeout for network requests
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const configPromise = FaqLearningService.getConfig();
      const data = await Promise.race([configPromise, timeoutPromise]) as any;

      // Validate response structure
      if (!data || !Array.isArray(data.configurations)) {
        throw new Error('Invalid response format');
      }

      // Transform API data to config sections
      const sections = transformToConfigSections(data.configurations);

      // Validate that we have at least some configurations
      if (sections.length === 0) {
        throw new Error('No configurations found');
      }

      setConfigSections(sections);

      // Store original values for change tracking
      const originalVals: Record<string, any> = {};
      sections.forEach(section => {
        section.settings.forEach(setting => {
          originalVals[`${section.key}-${setting.key}`] = setting.value;
        });
      });
      setOriginalValues(originalVals);

      // Reset change tracking
      setHasChanges(false);
      setChangedSettings(new Set());
      setValidationErrors({});

      // Success toast for retry scenarios
      if (retryCount > 0) {
        toast({
          title: 'Başarılı',
          description: 'Ayarlar başarıyla yüklendi.',
          variant: 'default'
        });
      }

    } catch (error) {
      console.error('Failed to load configuration:', error);

      // Enhanced error handling with retry logic
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      const isNetworkError = errorMessage.includes('timeout') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('network');

      // Show empty state
      setConfigSections([]);

      // Enhanced error toast with retry option
      toast({
        title: isNetworkError ? 'Bağlantı Hatası' : 'Yükleme Hatası',
        description: (
          <div className="space-y-2">
            <p>
              {isNetworkError
                ? 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.'
                : `Ayarlar yüklenemedi: ${errorMessage}`
              }
            </p>
            {retryCount < 3 && (
              <button
                onClick={() => loadConfiguration(retryCount + 1)}
                className="text-sm underline hover:no-underline"
              >
                Tekrar dene ({3 - retryCount} deneme kaldı)
              </button>
            )}
          </div>
        ),
        variant: 'destructive',
        duration: retryCount < 3 ? 10000 : 5000
      });

      // Auto-retry for network errors (max 3 times)
      if (isNetworkError && retryCount < 2) {
        setTimeout(() => {
          loadConfiguration(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
      }

    } finally {
      setIsLoading(false);
    }
  };

  const transformToConfigSections = (configs: any[]): ConfigSection[] => {
    // Group configurations by category
    const grouped = configs.reduce((acc, config) => {
      const category = config.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
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

    // Ensure all 6 categories exist with proper order
    const orderedCategories = ['thresholds', 'recognition', 'processing', 'quality', 'sources', 'categories', 'ai', 'advanced'];

    return orderedCategories
      .filter(category => grouped[category] && grouped[category].length > 0)
      .map(category => ({
        key: category,
        title: formatCategoryTitle(category),
        description: getCategoryDescription(category),
        icon: getCategoryIcon(category),
        settings: grouped[category]
      }));
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const inferType = (value: any): ConfigSetting['type'] => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    return 'string';
  };

  const formatCategoryTitle = (category: string): string => {
    const titles: Record<string, string> = {
      thresholds: 'Güven Eşikleri',
      recognition: 'Pattern Tanıma',
      processing: 'İşleme Ayarları',
      quality: 'Kalite Kontrol',
      sources: 'Veri Kaynakları',
      categories: 'Kategori Yönetimi',
      ai: 'AI Modeli',
      advanced: 'Gelişmiş Ayarlar'
    };
    return titles[category] || category;
  };

  const getCategoryDescription = (category: string): string => {
    const descriptions: Record<string, string> = {
      thresholds: 'FAQ onay ve yayınlama için güven skorları',
      recognition: 'Pattern tanıma ve benzerlik eşikleri',
      processing: 'Batch işleme ve gerçek zamanlı işleme ayarları',
      quality: 'Kalite kontrol ve doğrulama kuralları',
      sources: 'Chat ve ticket veri kaynağı ayarları',
      categories: 'Otomatik kategori atama ve yönetim',
      ai: 'AI model parametreleri (sadece temperature ve maxTokens)',
      advanced: 'Gelişmiş sistem ayarları ve veri saklama'
    };
    return descriptions[category] || '';
  };

  const getCategoryIcon = (category: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      thresholds: <BarChart3 className="h-5 w-5" />,
      recognition: <Brain className="h-5 w-5" />,
      processing: <Zap className="h-5 w-5" />,
      quality: <Shield className="h-5 w-5" />,
      sources: <Filter className="h-5 w-5" />,
      categories: <Calendar className="h-5 w-5" />,
      ai: <Brain className="h-5 w-5" />,
      advanced: <Settings className="h-5 w-5" />
    };
    return icons[category] || <Settings className="h-5 w-5" />;
  };



  const handleSave = async () => {
    // Check for validation errors
    const hasValidationErrors = Object.values(validationErrors).some(error => error !== '');
    if (hasValidationErrors) {
      toast({
        title: 'Doğrulama Hatası',
        description: 'Lütfen tüm hataları düzeltin ve tekrar deneyin.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    setSaveProgress(0);

    // Show loading toast with progress
    const totalConfigs = configSections.reduce((total, section) => total + section.settings.length, 0);
    const loadingToast = toast({
      title: 'Kaydediliyor...',
      description: (
        <div className="space-y-2">
          <p>{totalConfigs} ayar kaydediliyor</p>
          <Progress value={saveProgress} className="w-full" />
        </div>
      ),
      duration: 0
    });

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setSaveProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    try {
      const { FaqLearningService } = await import('@/services/faq-learning.service');

      // Prepare all configurations for bulk update
      const allConfigs: Array<{
        configKey: string;
        configValue: any;
        description?: string;
        category?: string;
      }> = [];

      for (const section of configSections) {
        for (const setting of section.settings) {
          allConfigs.push({
            configKey: setting.key,
            configValue: setting.value,
            description: setting.description,
            category: section.key
          });
        }
      }

      console.log('💾 Saving configurations:', allConfigs.length, 'items');

      // Bulk save all configurations
      const result = await FaqLearningService.bulkUpdateConfig(allConfigs);

      // Complete progress and dismiss loading toast
      clearInterval(progressInterval);
      setSaveProgress(100);
      setTimeout(() => {
        loadingToast.dismiss?.();
      }, 500);

      if (result.success) {
        // Update UI state after successful save
        setHasChanges(false);
        setChangedSettings(new Set());
        setValidationErrors({}); // Clear validation errors after successful save

        // Update original values to current values to track future changes
        const newOriginalValues: Record<string, any> = {};
        configSections.forEach(section => {
          section.settings.forEach(setting => {
            newOriginalValues[`${section.key}-${setting.key}`] = setting.value;
          });
        });
        setOriginalValues(newOriginalValues);

        // Update default values to current values to track future changes
        setConfigSections(prev =>
          prev.map(section => ({
            ...section,
            settings: section.settings.map(setting => ({
              ...setting,
              defaultValue: setting.value
            }))
          }))
        );

        // Show detailed success message
        if (result.results && Array.isArray(result.results)) {
          const successfulCount = result.results.filter((r: any) => r.success).length;
          const failedCount = result.results.filter((r: any) => !r.success).length;

          if (failedCount > 0) {
            const failedConfigs = result.results
              .filter((r: any) => !r.success)
              .map((r: any) => r.configKey)
              .join(', ');

            toast({
              title: 'Kısmi Başarı',
              description: `${successfulCount} ayar kaydedildi, ${failedCount} ayar başarısız oldu: ${failedConfigs}`,
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Başarılı',
              description: `Tüm ${allConfigs.length} ayar başarıyla kaydedildi`,
              variant: 'default'
            });
          }
        } else {
          toast({
            title: 'Başarılı',
            description: `${allConfigs.length} ayar başarıyla kaydedildi`,
            variant: 'default'
          });
        }
      } else {
        throw new Error(result.message || 'Bulk update failed');
      }

    } catch (error) {
      // Clear progress and dismiss loading toast
      clearInterval(progressInterval);
      setSaveProgress(0);
      loadingToast.dismiss?.();

      console.error('Failed to save configuration:', error);

      // Enhanced error toast with retry option
      toast({
        title: 'Kaydetme Hatası',
        description: (
          <div className="space-y-2">
            <p>{error instanceof Error ? error.message : 'Ayarlar kaydedilemedi.'}</p>
            <button
              onClick={() => handleSave()}
              className="text-sm underline hover:no-underline"
            >
              Tekrar dene
            </button>
          </div>
        ),
        variant: 'destructive',
        duration: 10000 // Longer duration for error messages
      });
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  };

  const handleReset = async (sectionKey: string) => {
    const section = configSections.find(s => s.key === sectionKey);
    if (!section) return;

    const settingsCount = section.settings.length;
    const sectionTitle = section.title;

    // Enhanced confirmation dialog with more details
    const hasUnsavedChanges = section.settings.some(setting => setting.value !== setting.defaultValue);
    const confirmMessage = hasUnsavedChanges
      ? `"${sectionTitle}" kategorisindeki ${settingsCount} ayarı varsayılan değerlere sıfırlamak istediğinizden emin misiniz?\n\n⚠️ Bu kategoride kaydedilmemiş değişiklikleriniz var!\n\nBu işlem:\n• Sadece bu kategorideki ayarları etkiler\n• Diğer kategorilerdeki değişiklikler korunur\n• Geri alınamaz`
      : `"${sectionTitle}" kategorisindeki ${settingsCount} ayarı varsayılan değerlere sıfırlamak istediğinizden emin misiniz?\n\nBu işlem:\n• Sadece bu kategorideki ayarları etkiler\n• Diğer kategorilerdeki değişiklikler korunur\n• Geri alınamaz`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsResetting(sectionKey);

    // Show loading toast
    const loadingToast = toast({
      title: 'Sıfırlanıyor...',
      description: `"${sectionTitle}" kategorisi varsayılan değerlere sıfırlanıyor`,
      duration: 0
    });

    try {
      const { FaqLearningService } = await import('@/services/faq-learning.service');

      console.log(`🔄 Resetting section: ${sectionKey} (${settingsCount} settings)`);

      const result = await FaqLearningService.resetConfigSection(sectionKey);

      // Dismiss loading toast
      loadingToast.dismiss?.();

      if (result.success) {
        // Update form state after reset - get default values for this section
        const defaultConfigs = await getDefaultConfigsForSection(sectionKey);

        // Update only this section's settings to default values
        setConfigSections(prev =>
          prev.map(prevSection =>
            prevSection.key === sectionKey
              ? {
                ...prevSection,
                settings: prevSection.settings.map(setting => {
                  const defaultConfig = defaultConfigs.find(dc => dc.key === setting.key);
                  return defaultConfig
                    ? { ...setting, value: defaultConfig.value, defaultValue: defaultConfig.value }
                    : setting;
                })
              }
              : prevSection
          )
        );

        // Clear validation errors for this section
        const newValidationErrors = { ...validationErrors };
        Object.keys(newValidationErrors).forEach(key => {
          if (key.startsWith(`${sectionKey}-`)) {
            delete newValidationErrors[key];
          }
        });
        setValidationErrors(newValidationErrors);

        // Update original values for the reset section
        const newOriginalValues = { ...originalValues };
        const resetSection = configSections.find(s => s.key === sectionKey);
        if (resetSection) {
          resetSection.settings.forEach(setting => {
            const defaultConfig = defaultConfigs.find(dc => dc.key === setting.key);
            if (defaultConfig) {
              newOriginalValues[`${sectionKey}-${setting.key}`] = defaultConfig.value;
            }
          });
        }
        setOriginalValues(newOriginalValues);

        // Remove this section's changes from changed settings
        setChangedSettings(prev => {
          const newSet = new Set(prev);
          Array.from(prev).forEach(settingId => {
            if (settingId.startsWith(`${sectionKey}-`)) {
              newSet.delete(settingId);
            }
          });
          return newSet;
        });

        // Check if we still have changes in other sections
        const stillHasChanges = Array.from(changedSettings).some(settingId =>
          !settingId.startsWith(`${sectionKey}-`)
        );
        setHasChanges(stillHasChanges);

        toast({
          title: 'Başarılı',
          description: `"${sectionTitle}" kategorisindeki ${settingsCount} ayar varsayılan değerlere sıfırlandı`,
          variant: 'default'
        });

      } else {
        throw new Error(result.message || 'Reset failed');
      }

    } catch (error) {
      // Dismiss loading toast
      loadingToast.dismiss?.();

      console.error('Failed to reset configuration:', error);
      toast({
        title: 'Sıfırlama Hatası',
        description: `"${sectionTitle}" kategorisi sıfırlanamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        variant: 'destructive'
      });
    } finally {
      setIsResetting(null);
    }
  };

  // Helper function to get default configs for a section
  const getDefaultConfigsForSection = async (sectionKey: string) => {
    // This would normally come from the API, but for now we'll use the same defaults as backend
    const defaults: Record<string, Array<{ key: string; value: any }>> = {
      'thresholds': [
        { key: 'minConfidenceForReview', value: 60 },
        { key: 'minConfidenceForAutoPublish', value: 85 }
      ],
      'recognition': [
        { key: 'minPatternFrequency', value: 3 },
        { key: 'similarityThreshold', value: 0.8 }
      ],
      'processing': [
        { key: 'batchSize', value: 100 },
        { key: 'processingInterval', value: 3600 },
        { key: 'enableRealTimeProcessing', value: false },
        { key: 'enableAutoPublishing', value: false },
        { key: 'maxDailyProcessingLimit', value: 1000 }
      ],
      'quality': [
        { key: 'minQuestionLength', value: 10 },
        { key: 'maxQuestionLength', value: 500 },
        { key: 'minAnswerLength', value: 20 }
      ],
      'sources': [
        { key: 'chatSessionMinDuration', value: 300 },
        { key: 'ticketMinResolutionTime', value: 1800 },
        { key: 'requiredSatisfactionScore', value: 4 }
      ],
      'categories': [
        { key: 'excludedCategories', value: [] },
        { key: 'autoCategorizationEnabled', value: true }
      ],
      'ai': [
        { key: 'temperature', value: 0.7 },
        { key: 'maxTokens', value: 1000 }
      ],
      'advanced': [
        { key: 'retentionPeriodDays', value: 365 }
      ]
    };

    return defaults[sectionKey] || [];
  };

  const validateSetting = (setting: ConfigSetting, value: any): string | null => {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      if (setting.validation?.required) {
        return `${setting.label} zorunludur`;
      }
      return null;
    }

    // Type validation with enhanced error messages
    switch (setting.type) {
      case 'number':
      case 'range':
        // Handle string inputs that should be numbers
        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        if (typeof numValue !== 'number' || isNaN(numValue)) {
          return `${setting.label} geçerli bir sayı olmalıdır`;
        }

        // Check for decimal places when step is integer
        if (setting.step && setting.step === 1 && numValue % 1 !== 0) {
          return `${setting.label} tam sayı olmalıdır`;
        }

        // Range validation with context
        if (setting.min !== undefined && numValue < setting.min) {
          const unit = setting.unit || '';
          return `${setting.label} en az ${setting.min}${unit} olmalıdır`;
        }
        if (setting.max !== undefined && numValue > setting.max) {
          const unit = setting.unit || '';
          return `${setting.label} en fazla ${setting.max}${unit} olmalıdır`;
        }

        // Special validation for percentage values
        if (setting.unit === '%' && (numValue < 0 || numValue > 100)) {
          return `${setting.label} 0-100 arasında olmalıdır`;
        }

        // Special validation for confidence scores
        if (setting.key.includes('Confidence') && (numValue < 0 || numValue > 100)) {
          return `Güven skoru 0-100 arasında olmalıdır`;
        }

        // Special validation for temperature (AI setting)
        if (setting.key === 'temperature' && (numValue < 0 || numValue > 2)) {
          return `Sıcaklık değeri 0-2 arasında olmalıdır`;
        }

        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${setting.label} doğru/yanlış değeri olmalıdır`;
        }
        break;

      case 'string':
      case 'textarea':
        if (typeof value !== 'string') {
          return `${setting.label} metin olmalıdır`;
        }
        if (setting.validation?.required && value.trim() === '') {
          return `${setting.label} zorunludur`;
        }
        if (setting.validation?.min && value.length < setting.validation.min) {
          return `${setting.label} en az ${setting.validation.min} karakter olmalıdır`;
        }
        if (setting.validation?.max && value.length > setting.validation.max) {
          return `${setting.label} en fazla ${setting.validation.max} karakter olmalıdır`;
        }
        break;

      case 'multiselect':
        if (!Array.isArray(value)) {
          return `${setting.label} bir liste olmalıdır`;
        }
        // Validate that all selected values are valid options
        if (setting.options && value.some(v => !setting.options?.find(opt => opt.value === v))) {
          return `${setting.label} geçersiz seçenekler içeriyor`;
        }
        break;

      case 'select':
        if (setting.options && !setting.options.find(opt => opt.value === value)) {
          return `${setting.label} geçerli bir seçenek olmalıdır`;
        }
        break;
    }

    return null;
  };

  const updateSettingValue = (sectionKey: string, settingKey: string, value: any) => {
    const settingId = `${sectionKey}-${settingKey}`;

    try {
      // Find the setting for validation
      const section = configSections.find(s => s.key === sectionKey);
      const setting = section?.settings.find(s => s.key === settingKey);

      if (!setting) {
        console.error(`Setting not found: ${settingId}`);
        return;
      }

      // Sanitize and normalize the value based on type
      let normalizedValue = value;

      switch (setting.type) {
        case 'number':
        case 'range':
          // Handle string inputs and edge cases
          if (typeof value === 'string') {
            normalizedValue = value === '' ? setting.min || 0 : parseFloat(value);
          }
          // Clamp value to valid range to prevent invalid states
          if (setting.min !== undefined) {
            normalizedValue = Math.max(normalizedValue, setting.min);
          }
          if (setting.max !== undefined) {
            normalizedValue = Math.min(normalizedValue, setting.max);
          }
          // Round to step if specified
          if (setting.step && setting.step !== 0) {
            normalizedValue = Math.round(normalizedValue / setting.step) * setting.step;
          }
          break;

        case 'string':
        case 'textarea':
          // Ensure string type and trim whitespace
          normalizedValue = String(value || '').trim();
          break;

        case 'multiselect':
          // Ensure array type and remove duplicates
          normalizedValue = Array.isArray(value) ? [...new Set(value)] : [];
          break;

        case 'boolean':
          // Ensure boolean type
          normalizedValue = Boolean(value);
          break;
      }

      // Validate the normalized value
      const error = validateSetting(setting, normalizedValue);
      setValidationErrors(prev => ({
        ...prev,
        [settingId]: error || ''
      }));

      // Update the setting value with error boundary
      setConfigSections(prev => {
        try {
          return prev.map(section =>
            section.key === sectionKey
              ? {
                ...section,
                settings: section.settings.map(s =>
                  s.key === settingKey ? { ...s, value: normalizedValue } : s
                )
              }
              : section
          );
        } catch (updateError) {
          console.error('Error updating config sections:', updateError);
          return prev; // Return previous state on error
        }
      });

      // Track changes with error handling
      try {
        const originalValue = originalValues[settingId];
        const hasChanged = JSON.stringify(normalizedValue) !== JSON.stringify(originalValue);

        setChangedSettings(prev => {
          const newSet = new Set(prev);
          if (hasChanged) {
            newSet.add(settingId);
          } else {
            newSet.delete(settingId);
          }
          return newSet;
        });

        // Update global hasChanges state
        setHasChanges(prev => {
          const newChangedSettings = new Set(changedSettings);
          if (hasChanged) {
            newChangedSettings.add(settingId);
          } else {
            newChangedSettings.delete(settingId);
          }
          return newChangedSettings.size > 0;
        });

      } catch (trackingError) {
        console.error('Error tracking changes:', trackingError);
      }

    } catch (error) {
      console.error('Error updating setting value:', error);

      // Show user-friendly error message
      toast({
        title: 'Güncelleme Hatası',
        description: `${settingKey} güncellenirken bir hata oluştu.`,
        variant: 'destructive',
        duration: 3000
      });
    }
  };

  // Function to restore original values (cancel changes)
  const handleCancelChanges = () => {
    if (!confirm('Tüm değişiklikleri iptal etmek istediğinizden emin misiniz?\n\nBu işlem tüm kaydedilmemiş değişiklikleri geri alır.')) {
      return;
    }

    // Restore original values
    setConfigSections(prev =>
      prev.map(section => ({
        ...section,
        settings: section.settings.map(setting => {
          const originalValue = originalValues[`${section.key}-${setting.key}`];
          return originalValue !== undefined
            ? { ...setting, value: originalValue }
            : setting;
        })
      }))
    );

    // Reset change tracking
    setHasChanges(false);
    setChangedSettings(new Set());
    setValidationErrors({});

    toast({
      title: 'Değişiklikler İptal Edildi',
      description: 'Tüm ayarlar orijinal değerlerine geri döndürüldü',
      variant: 'default'
    });
  };

  const renderSettingInput = (section: ConfigSection, setting: ConfigSetting) => {
    const inputId = `${section.key}-${setting.key}`;
    const errorKey = `${section.key}-${setting.key}`;
    const hasError = validationErrors[errorKey];

    // Enhanced tooltip content
    const getTooltipContent = () => {
      let content = setting.description;
      if (setting.min !== undefined && setting.max !== undefined) {
        content += ` (${setting.min} - ${setting.max}${setting.unit || ''})`;
      }
      if (setting.type === 'range' && setting.step) {
        content += ` Adım: ${setting.step}`;
      }
      return content;
    };

    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch
              id={inputId}
              checked={setting.value}
              onCheckedChange={(checked) => updateSettingValue(section.key, setting.key, checked)}
              aria-label={setting.label}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>{getTooltipContent()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );

      case 'range':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  {setting.value}{setting.unit || ''}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{getTooltipContent()}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {screenSize === 'mobile' && (
                <Input
                  type="number"
                  value={setting.value}
                  onChange={(e) => updateSettingValue(section.key, setting.key, Number(e.target.value))}
                  min={setting.min}
                  max={setting.max}
                  step={setting.step}
                  className="w-20 h-8 text-sm"
                />
              )}
            </div>
            <Slider
              id={inputId}
              min={setting.min}
              max={setting.max}
              step={setting.step}
              value={[setting.value]}
              onValueChange={([value]) => updateSettingValue(section.key, setting.key, value)}
              className="w-full"
              aria-label={setting.label}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{setting.min}{setting.unit || ''}</span>
              <span>{setting.max}{setting.unit || ''}</span>
            </div>
          </div>
        );

      case 'select':
        return (
          <Select
            value={setting.value}
            onValueChange={(value) => updateSettingValue(section.key, setting.key, value)}
          >
            <SelectTrigger id={inputId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <div className="space-y-1">
            <Textarea
              id={inputId}
              value={setting.value}
              onChange={(e) => updateSettingValue(section.key, setting.key, e.target.value)}
              rows={4}
              className={hasError ? 'border-red-500 focus:border-red-500' : ''}
            />
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[errorKey]}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Input
                id={inputId}
                type="number"
                value={setting.value}
                onChange={(e) => updateSettingValue(section.key, setting.key, Number(e.target.value))}
                min={setting.min}
                max={setting.max}
                step={setting.step}
                className={`${screenSize === 'mobile' ? 'max-w-full' : 'max-w-[200px]'} ${hasError ? 'border-red-500 focus:border-red-500' : ''}`}
                aria-label={setting.label}
              />
              {setting.unit && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">{setting.unit}</span>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>{getTooltipContent()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[errorKey]}</p>
            )}
          </div>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {setting.value && Array.isArray(setting.value) && setting.value.map((selectedValue: string) => (
                <Badge key={selectedValue} variant="secondary" className="flex items-center gap-1">
                  {setting.options?.find(opt => opt.value === selectedValue)?.label || selectedValue}
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = setting.value.filter((v: string) => v !== selectedValue);
                      updateSettingValue(section.key, setting.key, newValue);
                    }}
                    className="ml-1 text-xs hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <Select
              value=""
              onValueChange={(value) => {
                if (value && !setting.value.includes(value)) {
                  const newValue = [...(setting.value || []), value];
                  updateSettingValue(section.key, setting.key, newValue);
                }
              }}
            >
              <SelectTrigger id={inputId}>
                <SelectValue placeholder="Kategori seçin..." />
              </SelectTrigger>
              <SelectContent>
                {setting.options?.filter(option => !setting.value?.includes(option.value)).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <div className="space-y-1">
            <Input
              id={inputId}
              type="text"
              value={setting.value}
              onChange={(e) => updateSettingValue(section.key, setting.key, e.target.value)}
              className={hasError ? 'border-red-500 focus:border-red-500' : ''}
            />
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[errorKey]}</p>
            )}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">
              FAQ Learning Ayarları
            </h1>
            {/* Connection status indicator */}
            <div className="flex items-center gap-2">
              <Badge
                variant={connectionQuality === 'offline' ? 'destructive' : connectionQuality === 'poor' ? 'secondary' : 'default'}
                className="text-xs"
              >
                <div className={`w-2 h-2 rounded-full mr-1 ${connectionQuality === 'offline' ? 'bg-red-500' :
                    connectionQuality === 'poor' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                {connectionQuality === 'offline' ? 'Çevrimdışı' :
                  connectionQuality === 'poor' ? 'Yavaş Bağlantı' : 'Çevrimiçi'}
              </Badge>

              {/* Screen size indicator for debugging */}
              {process.env.NODE_ENV === 'development' && (
                <Badge variant="outline" className="text-xs">
                  {screenSize === 'mobile' && <Smartphone className="h-3 w-3 mr-1" />}
                  {screenSize === 'tablet' && <Tablet className="h-3 w-3 mr-1" />}
                  {screenSize === 'desktop' && <Monitor className="h-3 w-3 mr-1" />}
                  {screenSize}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Sistem konfigürasyonu ve öğrenme parametreleri
          </p>
        </div>

        {/* Action buttons - responsive layout */}
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size={screenSize === 'mobile' ? 'sm' : 'default'}
              onClick={() => loadConfiguration()}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {screenSize === 'mobile' ? 'Yenile' : 'Yenile'}
            </Button>
            {hasChanges && (
              <Button
                variant="outline"
                size={screenSize === 'mobile' ? 'sm' : 'default'}
                onClick={handleCancelChanges}
                disabled={isSaving}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {screenSize === 'mobile' ? 'İptal' : 'Değişiklikleri İptal Et'}
              </Button>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={
              !hasChanges ||
              isSaving ||
              !isOnline ||
              Object.values(validationErrors).some(error => error !== '')
            }
            className={`${hasChanges ? 'bg-primary hover:bg-primary/90' : ''} w-full sm:w-auto`}
            size={screenSize === 'mobile' ? 'sm' : 'default'}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {screenSize === 'mobile' ? 'Kaydediliyor...' : `Kaydediliyor... (${changedSettings.size} değişiklik)`}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {screenSize === 'mobile' ? 'Kaydet' : 'Tüm Ayarları Kaydet'}
                {hasChanges && (
                  <Badge variant="secondary" className="ml-2">
                    {changedSettings.size}
                  </Badge>
                )}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Offline Warning */}
      {!isOnline && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Bağlantı Yok</AlertTitle>
          <AlertDescription className="text-red-800">
            İnternet bağlantınız kesildi. Değişiklikler kaydedilemeyecek. Lütfen bağlantınızı kontrol edin.
          </AlertDescription>
        </Alert>
      )}

      {/* Poor Connection Warning */}
      {isOnline && connectionQuality === 'poor' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Yavaş Bağlantı</AlertTitle>
          <AlertDescription className="text-yellow-800">
            İnternet bağlantınız yavaş. Kaydetme işlemi uzun sürebilir.
          </AlertDescription>
        </Alert>
      )}

      {/* Changes Alert */}
      {hasChanges && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">Kaydedilmemiş Değişiklikler</AlertTitle>
          <AlertDescription className="text-orange-800 space-y-2">
            <p>
              {changedSettings.size} ayarda değişiklik yaptınız. Değişiklikleri kaydetmeyi unutmayın.
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {Array.from(changedSettings).slice(0, 5).map(settingId => {
                const [sectionKey, settingKey] = settingId.split('-');
                const section = configSections.find(s => s.key === sectionKey);
                const setting = section?.settings.find(s => s.key === settingKey);
                return setting ? (
                  <Badge key={settingId} variant="outline" className="text-xs">
                    {setting.label}
                  </Badge>
                ) : null;
              })}
              {changedSettings.size > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{changedSettings.size - 5} daha
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {configSections.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ayar Bulunamadı</h3>
            <p className="text-muted-foreground text-center mb-4">
              Henüz hiç ayar yapılandırılmamış. Backend'den ayarlar yüklenemedi.
            </p>
            <Button onClick={() => loadConfiguration()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {configSections.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Responsive tab layout */}
          <div className="space-y-2">
            <TabsList className={`
              ${screenSize === 'mobile'
                ? 'grid grid-cols-2 gap-1 h-auto p-1'
                : screenSize === 'tablet'
                  ? 'grid grid-cols-4 gap-1'
                  : 'grid grid-cols-8 gap-1'
              } w-full
            `}>
              {configSections.map((section) => {
                const sectionHasChanges = section.settings.some(setting =>
                  changedSettings.has(`${section.key}-${setting.key}`)
                );
                return (
                  <TabsTrigger
                    key={section.key}
                    value={section.key}
                    className={`
                      flex items-center gap-1 sm:gap-2 relative text-xs sm:text-sm
                      ${screenSize === 'mobile' ? 'flex-col p-2 h-auto min-h-[60px]' : 'flex-row'}
                    `}
                  >
                    <div className="flex items-center gap-1">
                      {section.icon}
                      <span className={screenSize === 'mobile' ? 'text-center leading-tight' : 'hidden sm:inline'}>
                        {screenSize === 'mobile' ? section.title.split(' ')[0] : section.title}
                      </span>
                    </div>
                    {sectionHasChanges && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Advanced settings toggle for mobile */}
            {screenSize === 'mobile' && (
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">Gelişmiş Görünüm</span>
                </div>
                <Switch
                  checked={showAdvancedSettings}
                  onCheckedChange={setShowAdvancedSettings}
                />
              </div>
            )}
          </div>

          {configSections.map((section) => (
            <TabsContent key={section.key} value={section.key} className="space-y-4">
              {section.key === 'ai' ? (
                // Special AI Model Tab
                <div className="space-y-4">
                  {/* AI Provider Info Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Mevcut AI Sağlayıcısı
                      </CardTitle>
                      <CardDescription>
                        Global AI ayarlarından gelen aktif sağlayıcı bilgileri
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {aiProviderInfo ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Sağlayıcı</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={aiProviderInfo.available ? "default" : "destructive"}>
                                  {aiProviderInfo.currentProvider.toUpperCase()}
                                </Badge>
                                {aiProviderInfo.available ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Model</Label>
                              <div className="mt-1 font-mono text-sm">
                                {aiProviderInfo.currentModel}
                              </div>
                            </div>
                          </div>
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              AI sağlayıcısını ve modelini değiştirmek için{' '}
                              <a
                                href="/admin/ai-settings"
                                className="underline hover:text-primary"
                              >
                                Global AI Ayarları
                              </a>
                              'na gidin. Burada sadece model parametrelerini ayarlayabilirsiniz.
                            </AlertDescription>
                          </Alert>
                        </>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          AI sağlayıcı bilgileri yükleniyor...
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* AI Model Parameters Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {section.icon}
                            Model Parametreleri
                          </CardTitle>
                          <CardDescription>
                            FAQ oluşturma için AI model ayarları
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReset(section.key)}
                        >
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Varsayılana Dön
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {section.settings.map((setting) => (
                        <div key={setting.key} className="space-y-3 pb-6 border-b last:border-0 last:pb-0">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <Label htmlFor={`${section.key}-${setting.key}`} className="text-base font-medium flex items-center gap-2">
                                {setting.label}
                                {setting.validation?.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                                {changedSettings.has(`${section.key}-${setting.key}`) && (
                                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Değiştirildi" />
                                )}
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                {setting.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              {changedSettings.has(`${section.key}-${setting.key}`) && (
                                <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">
                                  Değiştirildi
                                </Badge>
                              )}
                              {setting.value !== setting.defaultValue && !changedSettings.has(`${section.key}-${setting.key}`) && (
                                <Badge variant="secondary">
                                  Varsayılan Değil
                                </Badge>
                              )}
                            </div>
                          </div>
                          {renderSettingInput(section, setting)}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                // Regular Tab
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {section.icon}
                          {section.title}
                        </CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReset(section.key)}
                        disabled={isResetting === section.key}
                      >
                        <RefreshCw className={`mr-2 h-3 w-3 ${isResetting === section.key ? 'animate-spin' : ''}`} />
                        {isResetting === section.key ? 'Sıfırlanıyor...' : 'Varsayılana Dön'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {section.settings.map((setting) => {
                      // Hide advanced settings on mobile unless toggle is on
                      if (screenSize === 'mobile' && !showAdvancedSettings &&
                        ['advanced', 'categories'].includes(section.key)) {
                        return null;
                      }

                      return (
                        <div key={setting.key} className={`
                        space-y-3 pb-6 border-b last:border-0 last:pb-0
                        ${screenSize === 'mobile' ? 'pb-4' : 'pb-6'}
                      `}>
                          <div className={`
                          flex items-start justify-between gap-4
                          ${screenSize === 'mobile' ? 'flex-col gap-2' : 'flex-row'}
                        `}>
                            <div className="space-y-1 flex-1 min-w-0">
                              <Label
                                htmlFor={`${section.key}-${setting.key}`}
                                className={`
                                font-medium flex items-center gap-2 flex-wrap
                                ${screenSize === 'mobile' ? 'text-sm' : 'text-base'}
                              `}
                              >
                                <span className="flex items-center gap-2">
                                  {setting.label}
                                  {setting.validation?.required && (
                                    <span className="text-red-500">*</span>
                                  )}
                                  {changedSettings.has(`${section.key}-${setting.key}`) && (
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Değiştirildi" />
                                  )}
                                </span>
                              </Label>
                              <p className={`
                              text-muted-foreground break-words
                              ${screenSize === 'mobile' ? 'text-xs' : 'text-sm'}
                            `}>
                                {setting.description}
                              </p>
                            </div>

                            {/* Status badges - responsive layout */}
                            <div className={`
                            flex items-center gap-2 flex-shrink-0
                            ${screenSize === 'mobile' ? 'self-start' : 'ml-2'}
                          `}>
                              {changedSettings.has(`${section.key}-${setting.key}`) && (
                                <Badge
                                  variant="outline"
                                  className={`
                                  border-orange-500 text-orange-700 bg-orange-50
                                  ${screenSize === 'mobile' ? 'text-xs px-2 py-1' : ''}
                                `}
                                >
                                  {screenSize === 'mobile' ? 'Değişti' : 'Değiştirildi'}
                                </Badge>
                              )}
                              {setting.value !== setting.defaultValue && !changedSettings.has(`${section.key}-${setting.key}`) && (
                                <Badge
                                  variant="secondary"
                                  className={screenSize === 'mobile' ? 'text-xs px-2 py-1' : ''}
                                >
                                  {screenSize === 'mobile' ? 'Özel' : 'Varsayılan Değil'}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Input container with loading state */}
                          <div className="relative">
                            {isSaving && (
                              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-md flex items-center justify-center z-10">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            )}
                            {renderSettingInput(section, setting)}
                          </div>
                        </div>
                      );
                    }).filter(Boolean)}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Info Card */}
      {configSections.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              Ayarlar Hakkında
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Güven Eşikleri:</strong> FAQ'ların otomatik onaylanması veya incelemeye gönderilmesi için kullanılır.
            </p>
            <p>
              <strong>İşleme Ayarları:</strong> Batch boyutu ve gerçek zamanlı işleme seçeneklerini kontrol eder.
            </p>
            <p>
              <strong>Varsayılan Değerler:</strong> Her kategori için "Varsayılana Dön" butonunu kullanarak varsayılan değerlere dönebilirsiniz.
            </p>
            <p>
              <strong>Değişiklikler:</strong> Tüm değişiklikler "Tüm Ayarları Kaydet" butonuna basılana kadar geçici olarak saklanır.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
