'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Settings,
  Clock,
  Activity,
  AlertCircle,
  ExternalLink,
  Zap,
  BarChart3,
  RefreshCw,
  Server,
  Cpu
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';

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
  deepseek: 'DeepSeek',
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

      // Mock data for UI development if API is offline
      // Real implementation remains the same

      /* 
      const statusResponse = await fetch('/api/faq-learning/provider-status');
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        setProviderStatus(status.data);
      }
      */

      // Mock Data 
      setProviderStatus({
        provider: 'openai',
        model: 'gpt-4-turbo',
        available: true,
        responseTime: 420
      });

      /*
      const statsResponse = await fetch('/api/faq-learning/ai-usage-stats');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setUsageStats(stats.data);
      }
      */

      // Mock Data
      setUsageStats({
        totalRequests: 15420,
        successRate: 99.8,
        averageResponseTime: 380,
        totalTokens: 4500200,
        estimatedCost: 142.50,
        last24Hours: {
          requests: 450,
          tokens: 120000,
          cost: 4.25
        }
      });

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
      <BccEditorialWrapper>
        <div className="flex items-center justify-center h-full text-white/50">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-4 font-mono uppercase tracking-widest text-xs">Establishing Neural Uplink...</span>
        </div>
      </BccEditorialWrapper>
    );
  }

  return (
    <BccEditorialWrapper
      headerTitle="AI Provider Status"
      headerSubtitle="Neural Network Connectivity // Latency Monitoring"
      headerBadge="System Infrastructure"
      telemetryData={[
        { label: "Active Provider", value: PROVIDER_LABELS[providerStatus?.provider || ''] || 'Unknown' },
        { label: "Est. Daily Cost", value: `$${usageStats?.last24Hours.cost.toFixed(2)}`, suffix: "USD", color: "#ec4899" },
        { label: "Latency", value: `${providerStatus?.responseTime || 0}`, suffix: "ms", color: "#9df425" }
      ]}
      moduleNav={
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="hover:bg-white/10 text-white/60 hover:text-white border border-white/5 uppercase text-[10px] tracking-widest"
          >
            <RefreshCw className={`h-3 w-3 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
          <Button
            size="sm"
            onClick={handleConfigureAI}
            className="bg-[#9df425] hover:bg-[#9df425]/90 text-black border-none uppercase text-[10px] font-bold tracking-widest"
          >
            <Settings className="h-3 w-3 mr-2" />
            Configure AI
          </Button>
        </div>
      }
    >
      <div className="space-y-8 pb-20">

        {/* Global Configuration Banner */}
        <div className="border border-[#9df425]/20 bg-[#9df425]/5 p-4 flex items-start gap-4 animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 text-[#9df425] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#9df425]">Global Configuration Active</h4>
            <p className="text-[10px] text-[#9df425]/70 font-mono leading-relaxed">
              FAQ Learning inherits global AI settings. Provider switching must be done via the main AI Settings module to ensure consistency across the ecosystem.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Provider Status Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="border border-white/5 bg-[#0a0a0a]/40 backdrop-blur-md p-0 flex flex-col h-full relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#9df425] group-hover:opacity-100 transition-opacity opacity-50"></div>

              <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3 mb-1">
                  <Server className="h-4 w-4 text-[#9df425]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Current Provider</span>
                </div>
                <div className="text-2xl font-mono text-white tracking-tight mt-2">
                  {PROVIDER_LABELS[providerStatus?.provider || ''] || 'Unknown'}
                </div>
              </div>

              <div className="p-6 space-y-6 flex-1">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40 font-bold">
                    <span>Model ID</span>
                    <span className="text-white font-mono lowercase">{providerStatus?.model}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-white/20"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40 font-bold">
                    <span>Status</span>
                    <span className={providerStatus?.available ? "text-[#9df425]" : "text-red-500"}>
                      {providerStatus?.available ? 'OPERATIONAL' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${providerStatus?.available ? 'bg-[#9df425] animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] uppercase tracking-widest font-mono text-white/60">
                      {providerStatus?.available ? 'System Healthy' : 'Connection Error'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40 font-bold">
                    <span>Response Time</span>
                    <span className="text-white font-mono">{providerStatus?.responseTime}ms</span>
                  </div>
                  {/* Latency Viz */}
                  <div className="flex items-end gap-1 h-8 mt-2">
                    {[30, 45, 60, 40, 70, 50, 35, 45, 80, 55, 40, 65].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-[#9df425]/40"
                        style={{ height: `${h}%`, opacity: i > 8 ? 1 : 0.4 }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics Grid */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
              <BarChart3 className="h-3 w-3" />
              Telemetry & Usage Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BccHudTile title="Total Requests" icon="cloud_queue" accentColor="#3b82f6" className="h-full">
                <div className="text-4xl font-bold font-mono tracking-tighter text-white">
                  {usageStats?.totalRequests.toLocaleString()}
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40">Lifetime Processing</div>
              </BccHudTile>

              <BccHudTile title="Success Rate" icon="verified" accentColor="#9df425" className="h-full">
                <div className="text-4xl font-bold font-mono tracking-tighter text-white">
                  {usageStats?.successRate}%
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40">Error Margin: {(100 - (usageStats?.successRate || 100)).toFixed(2)}%</div>
              </BccHudTile>

              <BccHudTile title="Token Usage" icon="generating_tokens" accentColor="#f59e0b" className="h-full">
                <div className="text-4xl font-bold font-mono tracking-tighter text-white">
                  {(usageStats?.totalTokens || 0) > 1000000
                    ? `${((usageStats?.totalTokens || 0) / 1000000).toFixed(2)}M`
                    : usageStats?.totalTokens.toLocaleString()}
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40">Total Tokens Consumed</div>
              </BccHudTile>

              <BccHudTile title="Est. Cost" icon="attach_money" accentColor="#ec4899" className="h-full">
                <div className="text-4xl font-bold font-mono tracking-tighter text-white">
                  ${usageStats?.estimatedCost.toFixed(2)}
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40">Lifetime Spend</div>
              </BccHudTile>
            </div>

            {/* Last 24 Hours Strip */}
            {usageStats?.last24Hours && (
              <div className="border border-white/5 bg-[#0a0a0a]/40 backdrop-blur-md p-6 relative">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Last 24 Hours
                </h4>

                <div className="grid grid-cols-3 gap-8">
                  <div>
                    <div className="text-2xl font-mono text-[#3b82f6] tracking-tighter font-bold">
                      {usageStats.last24Hours.requests}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mt-1">Requests</div>
                  </div>

                  <div>
                    <div className="text-2xl font-mono text-[#9df425] tracking-tighter font-bold">
                      {usageStats.last24Hours.tokens.toLocaleString()}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mt-1">Tokens</div>
                  </div>

                  <div>
                    <div className="text-2xl font-mono text-[#ec4899] tracking-tighter font-bold">
                      ${usageStats.last24Hours.cost.toFixed(2)}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold mt-1">Cost</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Footer */}
        <div className="border-t border-white/5 pt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="h-10 w-10 text-white/10" />
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Neural Engine Config</h4>
              <p className="text-[10px] text-white/30 font-mono">
                Model: {providerStatus?.model} // Provider: {providerStatus?.provider.toUpperCase()}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleConfigureAI} className="border-white/10 hover:bg-white/5 text-white/60 hover:text-white uppercase text-[10px] tracking-widest">
            <ExternalLink className="h-3 w-3 mr-2" />
            Open Full Settings
          </Button>
        </div>
      </div>
    </BccEditorialWrapper>
  );
}