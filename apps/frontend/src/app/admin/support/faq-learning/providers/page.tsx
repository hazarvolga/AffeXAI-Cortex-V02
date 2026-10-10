'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Settings, 
  TrendingUp,
  Clock,
  Activity,
  AlertCircle,
  ExternalLink,
  Sparkles,
  DollarSign,
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProviderStatus {
  provider: string;
  model: string;
  available: boolean;
  responseTime?: number;
}

interface UsageStats {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  totalTokens: number;
  estimatedCost: number;
  last24Hours: {
    requests: number;
    tokens: number;
    cost: number;
  };
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google AI',
  openrouter: 'OpenRouter',
};

export default function ProvidersPage() {
  const router = useRouter();
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProviderData = async () => {
    try {
      setRefreshing(true);
      
      // Get current provider status from FAQ learning API
      const statusResponse = await fetch('/api/faq-learning/provider-status');
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        setProviderStatus(status.data);
      }

      // Get usage statistics
      const statsResponse = await fetch('/api/faq-learning/ai-usage-stats');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setUsageStats(stats.data);
      }
    } catch (error) {
      console.error('Failed to load provider data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProviderData();
  }, []);

  const handleRefresh = () => {
    loadProviderData();
  };

  const handleConfigureAI = () => {
    router.push('/admin/ai-settings');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">AI Provider Status</h1>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Provider Status</h1>
          <p className="text-muted-foreground mt-2">
            Monitor AI provider performance and usage statistics for FAQ Learning
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleConfigureAI}>
            <Settings className="h-4 w-4 mr-2" />
            Configure AI Settings
          </Button>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Global AI Configuration</AlertTitle>
        <AlertDescription>
          FAQ Learning uses the global AI provider settings. To change the AI provider or model, 
          use the AI Settings page in the main navigation.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Provider Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Current AI Provider
            </CardTitle>
            <CardDescription>
              Active AI provider and model for FAQ generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {providerStatus ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Provider:</span>
                  <Badge variant={providerStatus.available ? "default" : "destructive"}>
                    {PROVIDER_LABELS[providerStatus.provider] || providerStatus.provider}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Model:</span>
                  <span className="text-sm font-mono">{providerStatus.model}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <div className="flex items-center gap-2">
                    {providerStatus.available ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {providerStatus.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
                {providerStatus.responseTime && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Response Time:</span>
                    <span className="text-sm">{providerStatus.responseTime}ms</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Unable to load provider status
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
            <CardDescription>
              AI usage metrics for FAQ Learning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usageStats ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{usageStats.totalRequests}</div>
                    <div className="text-sm text-muted-foreground">Total Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{usageStats.successRate}%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{usageStats.averageResponseTime}ms</div>
                    <div className="text-sm text-muted-foreground">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{usageStats.totalTokens.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Tokens</div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Estimated Cost:</span>
                    <span className="text-lg font-bold">${usageStats.estimatedCost.toFixed(2)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No usage statistics available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last 24 Hours Stats */}
      {usageStats?.last24Hours && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Last 24 Hours
            </CardTitle>
            <CardDescription>
              Recent AI usage activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {usageStats.last24Hours.requests}
                </div>
                <div className="text-sm text-muted-foreground">Requests</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {usageStats.last24Hours.tokens.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  ${usageStats.last24Hours.cost.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Help */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            FAQ Learning uses the global AI configuration from the AI Settings page. 
            You can configure AI providers, models, and API keys there.
          </p>
          <Button variant="outline" onClick={handleConfigureAI} className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open AI Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}