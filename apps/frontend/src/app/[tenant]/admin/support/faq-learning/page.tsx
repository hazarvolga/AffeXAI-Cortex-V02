'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  RefreshCw,
  Loader2,
  Target,
  MessageSquare,
  Zap,
  Activity,
  Layers,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';

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
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const { FaqLearningService } = await import('@/services/faq-learning.service');
      const data = await FaqLearningService.getDashboardStats();

      if (!data || !data.stats) throw new Error('Invalid dashboard data');

      setStats(data.stats);
      setLearningProgress(data.learningProgress || { fromChat: 0, fromTickets: 0, fromSuggestions: 0, fromKnowledgeBase: 0, fromKnowledgeSources: 0 });
      setQualityMetrics(data.qualityMetrics || { highConfidence: 0, mediumConfidence: 0, lowConfidence: 0 });
      setProviders(data.providers || []);
      setRecentActivity(data.recentActivity || []);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Dashboard load error:', error);
      setIsLoading(false);
    }
  };

  const startLearningPipeline = async () => {
    setIsPipelineActionLoading(true);
    try {
      const { FaqLearningService } = await import('@/services/faq-learning.service');
      const result = await FaqLearningService.startPipeline();
      if (result.success) {
        setStats(prev => ({ ...prev, processingStatus: 'running' }));
        toast.success('PIPELINE_INITIATED', { description: 'Neural ingestion protocols active.' });
        loadDashboardData();
      } else {
        toast.error('PIPELINE_FAILURE', { description: result.message });
      }
    } catch (error) {
      toast.error('SYSTEM_ERROR', { description: 'Pipeline start failed.' });
    } finally {
      setIsPipelineActionLoading(false);
    }
  };

  const stopLearningPipeline = async () => {
    setIsPipelineActionLoading(true);
    try {
      const { FaqLearningService } = await import('@/services/faq-learning.service');
      const result = await FaqLearningService.stopPipeline();
      if (result.success) {
        setStats(prev => ({ ...prev, processingStatus: 'stopped' }));
        toast.success('PIPELINE_HALTED', { description: 'Ingestion protocols suspended.' });
        loadDashboardData();
      } else {
        toast.error('STOP_FAILURE', { description: result.message });
      }
    } catch (error) {
      toast.error('SYSTEM_ERROR', { description: 'Pipeline stop failed.' });
    } finally {
      setIsPipelineActionLoading(false);
    }
  };

  const statusColor = stats.processingStatus === 'running' ? '#9df425' : stats.processingStatus === 'error' ? '#ff0000' : '#ff8c00';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-[#9df425] font-mono text-xs uppercase tracking-widest">
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        Synchronizing_Neural_Cortex...
      </div>
    );
  }

  return (
    <BccEditorialWrapper
      headerTitle="NEURAL_LEARNING"
      headerSubtitle="Automated FAQ generation and knowledge ingestion protocols."
      headerBadge="AI_CORE"
      telemetryData={[
        { label: "INDEXED_FAQS", value: "84" },
        { label: "LEARNING_NODES", value: "14" },
        { label: "SUCCESS_RATE", value: "98.2%", color: "#9df425" },
        { label: "LATENCY", value: "48ms" }
      ]}
    >
      <div className="space-y-8">
        {/* HUD Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BccHudTile title="KNOWLEDGE_NODES" subtitle="Indexed QA Pairs" icon="message_circle">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">{stats.totalFaqs}</div>
            <div className="text-[10px] uppercase tracking-widest text-[#9df425] mt-1">
              +{stats.newFaqsToday} DETECTED_TODAY
            </div>
          </BccHudTile>

          <BccHudTile title="REVIEW_QUEUE" subtitle="Pending Validation" icon="clock">
            <div className="text-3xl font-bold font-mono tracking-tighter text-[#ff8c00]">{stats.pendingReview}</div>
            <div className="text-[10px] uppercase tracking-widest text-[#ff8c00]/60 mt-1">
              AWAITING_AUTH
            </div>
          </BccHudTile>

          <BccHudTile title="ACCURACY_INDEX" subtitle="Mean Confidence Score" icon="zap">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">{stats.averageConfidence}%</div>
            <Progress value={stats.averageConfidence} className="mt-3 h-1 bg-white/5" />
          </BccHudTile>

          <BccHudTile title="PIPELINE_STATUS" subtitle="Ingestion Engine State" icon="activity">
            <div className="flex items-center gap-3">
              <div style={{ color: statusColor }} className="text-xl font-bold font-mono tracking-wider uppercase">
                {stats.processingStatus}
              </div>
              <div
                className={`w-2 h-2 rounded-full animate-pulse`}
                style={{ backgroundColor: statusColor }}
              />
            </div>
            <div className="flex gap-2 mt-4">
              {stats.processingStatus === 'running' ? (
                <Button
                  onClick={stopLearningPipeline}
                  disabled={isPipelineActionLoading}
                  variant="outline"
                  className="h-7 text-[9px] uppercase tracking-[0.15em] border-red-500/50 text-red-500 hover:bg-red-500/10 font-mono bg-transparent rounded-none"
                >
                  {isPipelineActionLoading ? 'HALTING...' : 'HALT_SEQUENCE'}
                </Button>
              ) : (
                <Button
                  onClick={startLearningPipeline}
                  disabled={isPipelineActionLoading}
                  variant="outline"
                  className="h-7 text-[9px] uppercase tracking-[0.15em] border-[#9df425]/50 text-[#9df425] hover:bg-[#9df425]/10 font-mono bg-transparent rounded-none"
                >
                  {isPipelineActionLoading ? 'INIT...' : 'ENGAGE_PROTOCOL'}
                </Button>
              )}
            </div>
          </BccHudTile>
        </div>

        {/* Content Tabs */}
        <div className="border border-white/5 bg-white/[0.02] rounded-sm overflow-hidden">
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b border-white/5 px-6 pt-4 bg-black/20">
              <TabsList className="bg-transparent h-auto p-0 gap-8">
                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#9df425] rounded-none px-0 pb-3 text-[10px] uppercase tracking-[0.2em] text-white/40 data-[state=active]:text-[#9df425] transition-all font-mono">Overview</TabsTrigger>
                <TabsTrigger value="pipeline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#9df425] rounded-none px-0 pb-3 text-[10px] uppercase tracking-[0.2em] text-white/40 data-[state=active]:text-[#9df425] transition-all font-mono">Pipeline_Ops</TabsTrigger>
                <TabsTrigger value="providers" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#9df425] rounded-none px-0 pb-3 text-[10px] uppercase tracking-[0.2em] text-white/40 data-[state=active]:text-[#9df425] transition-all font-mono">Neural_Nodes</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-8">
              <TabsContent value="overview" className="mt-0 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Source Breakdown */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                      <Layers className="w-4 h-4 text-[#9df425]" />
                      <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/80">Source_Inflow_Registry</div>
                    </div>
                    {[
                      { label: "CHAT_LOGS", val: learningProgress.fromChat },
                      { label: "TICKET_SYSTEM", val: learningProgress.fromTickets },
                      { label: "USER_FEEDBACK", val: learningProgress.fromSuggestions },
                      { label: "KNOWLEDGE_BASE", val: learningProgress.fromKnowledgeBase },
                      { label: "EXTERNAL_NODES", val: learningProgress.fromKnowledgeSources },
                    ].map((item) => (
                      <div key={item.label} className="group space-y-2">
                        <div className="flex justify-between text-[9px] uppercase tracking-widest text-white/50 font-mono">
                          <span className="group-hover:text-white transition-colors">{item.label}</span>
                          <span className="text-[#9df425]">{item.val} / {stats.totalFaqs}</span>
                        </div>
                        <Progress value={item.val > 0 ? Math.min((item.val / stats.totalFaqs) * 100, 100) : 0} className="h-1 bg-white/5" />
                      </div>
                    ))}
                  </div>

                  {/* Quality Metrics */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                      <Target className="w-4 h-4 text-[#ff8c00]" />
                      <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/80">Validation_Accuracy_Matrix</div>
                    </div>
                    <div className="grid gap-4">
                      {[
                        { label: "HIGH_CONFIDENCE (85%+)", val: qualityMetrics.highConfidence, color: "bg-[#9df425]" },
                        { label: "MEDIUM_CONFIDENCE (60-84%)", val: qualityMetrics.mediumConfidence, color: "bg-[#ff8c00]" },
                        { label: "LOW_CONFIDENCE (<60%)", val: qualityMetrics.lowConfidence, color: "bg-red-500" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-4 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.color} shadow-[0_0_8px] shadow-current opacity-60 group-hover:opacity-100 transition-opacity`} />
                            <span className="text-[10px] uppercase tracking-widest text-white/60 font-mono group-hover:text-white transition-colors">{item.label}</span>
                          </div>
                          <span className="font-mono text-lg font-bold text-white tracking-tighter">{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pipeline" className="mt-0">
                <div className="p-16 border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-6">
                  <Activity className="h-10 w-10 text-white/10" />
                  <div className="space-y-2">
                    <div className="text-[12px] font-mono uppercase tracking-[0.3em] text-white/40">Advanced_Pipeline_Config</div>
                    <p className="text-[10px] font-mono text-white/20 max-w-xs">Direct shell access required for neural parameter tuning.</p>
                  </div>
                  <Button variant="outline" className="font-mono text-[9px] border-white/10 hover:bg-white/5 hover:text-[#9df425] uppercase tracking-widest px-8 rounded-none">ENGAGE_TERMINAL</Button>
                </div>
              </TabsContent>

              <TabsContent value="providers" className="mt-0">
                <div className="grid gap-4">
                  <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/30 mb-2 px-1">Active_Service_Providers</div>
                  {providers.map((provider) => (
                    <div key={provider.name} className="flex items-center justify-between p-4 border border-white/5 bg-white/[0.01] group hover:border-[#9df425]/20 transition-colors">
                      <div className="flex items-center gap-5">
                        <div className={`w-2 h-2 rounded-full ${provider.available ? 'bg-[#9df425]' : 'bg-red-500'} shadow-[0_0_10px] shadow-current opacity-40`} />
                        <div>
                          <div className="text-[12px] font-bold uppercase tracking-widest text-white font-mono">{provider.name}</div>
                          <div className="text-[9px] uppercase tracking-widest text-white/30 font-mono">{provider.available ? 'PROVISIONED_ONLINE' : 'LINK_TERMINATED'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[12px] font-mono text-[#9df425] tracking-tighter group-hover:scale-110 transition-transform origin-right">{provider.responseTime}ms</div>
                        <div className="text-[8px] uppercase tracking-tighter text-white/10 font-mono">RESPONSE_LATENCY</div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Sidebar Style Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="md:col-span-2 p-6 border border-white/5 bg-white/[0.01] rounded-sm">
            <div className="flex items-center gap-3 mb-4">
              <History className="w-4 h-4 text-white/20" />
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">Operation_Log_Summary</div>
            </div>
            <p className="text-[11px] font-mono text-white/30 leading-relaxed italic">
              "Neural Ingestion engine is currently processing cross-tenant data clusters.
              Confidence thresholds are automatically enforced by the core arbitrator."
            </p>
          </div>
          <div className="p-6 border border-[#9df425]/10 bg-[#9df425]/5 rounded-sm flex flex-col justify-center">
            <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#9df425]/60 mb-1">CORTEX_HEALTH</div>
            <div className="text-xl font-bold font-mono text-[#9df425] tracking-tighter uppercase">STABLE</div>
            <div className="w-full bg-white/5 h-1 mt-3 overflow-hidden">
              <div className="bg-[#9df425] h-full w-[88%] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </BccEditorialWrapper>
  );
}