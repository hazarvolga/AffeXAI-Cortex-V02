'use client';

import { useState } from 'react';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Workflow, Webhook, Activity, CheckCircle, Zap, ShieldCheck, Cpu } from 'lucide-react';
import ApprovalDashboard from '@/components/admin/automation/ApprovalDashboard';
import EventLogViewer from '@/components/admin/automation/EventLogViewer';
import { cn } from '@/lib/utils';

const AutomationLayoutWrapper = ({
  children,
  telemetryData
}: {
  children: React.ReactNode;
  telemetryData: any[];
}) => {
  return (
    <BccEditorialWrapper
      theme="tenant-admin"
      headerTitle="Neural Process Command"
      headerSubtitle="Orchestrating systemic automations and cross-module resonance."
      headerBadge="Automation Engine"
      telemetryData={telemetryData}
    >
      <div className="relative z-10 w-full min-h-screen flex flex-col pt-0">
        {children}
      </div>
    </BccEditorialWrapper>
  );
};

export default function AutomationCenterPage() {
  const telemetryResonance = [
    { label: 'ACTIVE_RULES', value: '12', color: '#9df425' },
    { label: 'WEBHOOKS_SIGNAL', value: '8', color: '#ff8c00' },
    { label: 'SUCCESS_QUOTIENT', value: '98.4', suffix: '%', color: '#9df425' },
  ];

  return (
    <AutomationLayoutWrapper telemetryData={telemetryResonance}>
      <div className="space-y-6">
        {/* Tabs Architecture */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between p-1 bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <TabsList className="bg-transparent h-10 gap-2">
              {[
                { value: 'overview', label: 'GENEL_BAKIŞ', icon: Activity },
                { value: 'approvals', label: 'SİSTEM_ONAYLARI', icon: ShieldCheck },
                { value: 'rules', label: 'OTOMASYON_KURALLARI', icon: Workflow },
                { value: 'webhooks', label: 'WEBHOOK_HAVUNU', icon: Webhook },
                { value: 'events', label: 'OLAY_MATRİSİ', icon: Cpu },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-white/5 data-[state=active]:text-[#9df425] text-white/40 text-[10px] font-mono tracking-[0.2em] uppercase h-8 px-4 rounded-none border border-transparent data-[state=active]:border-white/10 transition-all"
                >
                  <tab.icon className="w-3 h-3 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 outline-none">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <BccHudTile title="ACTIVE_RESONANCE" subtitle="Active Rules" icon={Workflow} accentColor="#9df425">
                <div className="text-3xl font-mono tracking-tighter text-[#9df425]">12</div>
              </BccHudTile>

              <BccHudTile title="SIGNAL_INTERPRETERS" subtitle="Webhooks Active" icon={Webhook} accentColor="#ff8c00">
                <div className="text-3xl font-mono tracking-tighter text-[#ff8c00]">8</div>
              </BccHudTile>

              <BccHudTile title="NEURAL_THROUGHPUT" subtitle="Events Processed" icon={Activity} accentColor="#9df425">
                <div className="text-3xl font-mono tracking-tighter text-white">1,248</div>
              </BccHudTile>

              <BccHudTile title="EXECUTION_TRUST" subtitle="Success Rate" icon={Bot} accentColor="#9df425">
                <div className="text-3xl font-mono tracking-tighter text-[#9df425]">98.4<span className="text-sm ml-1">%</span></div>
              </BccHudTile>
            </div>

            {/* Module Status Grid */}
            <Card className="bg-black/40 border-white/5 backdrop-blur-sm rounded-none bcc-glass overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#9df425]" />
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/80">Modül Otomasyon Durumu</CardTitle>
                    <CardDescription className="text-white/40 text-[10px] font-mono mt-1 uppercase">Platform modüllerinin gerçek zamanlı neural bağları</CardDescription>
                  </div>
                  <div className="h-6 px-2 bg-[#9df425]/10 border border-[#9df425]/20 flex items-center">
                    <span className="text-[9px] font-mono text-[#9df425] animate-pulse uppercase tracking-widest">Live_Matrix</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {[
                    { name: 'ETKİNLİK_YÖNETİMİ', status: 'SYNCHRONIZED', events: 4, icon: Activity },
                    { name: 'EP_PAZARLAMA', status: 'ACTIVE_LINK', events: 5, icon: Bot },
                    { name: 'SERTİFİKA_MATRİSİ', status: 'READY', events: 3, icon: ShieldCheck },
                    { name: 'CMS_ENGINE', status: 'SYNCHRONIZED', events: 4, icon: Workflow },
                    { name: 'MEDYA_RESORCE', status: 'IDLE_POLLING', events: 2, icon: Cpu },
                  ].map((module) => (
                    <div key={module.name} className="flex items-center justify-between p-4 bg-white/[0.01] hover:bg-white/[0.03] transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#9df425]/30 transition-all">
                          <module.icon className="w-3.5 h-3.5 text-white/40 group-hover:text-[#9df425]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-white/80">{module.name}</p>
                          <p className="text-[9px] text-white/30 font-mono mt-0.5 uppercase tracking-tighter">{module.events} Neural_Entry_Types</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 bg-[#9df425] rounded-full shadow-[0_0_8px_#9df425]" />
                        <span className="text-[10px] font-mono text-[#9df425]/80 uppercase tracking-widest">
                          {module.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-4 outline-none">
            <ApprovalDashboard />
          </TabsContent>

          {/* Automation Rules Tab */}
          <TabsContent value="rules" className="space-y-4 outline-none">
            <Card className="bg-black/40 border-white/5 backdrop-blur-sm rounded-none bcc-glass h-[500px] flex items-center justify-center relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="text-center space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto relative group">
                  <Workflow className="h-8 w-8 text-white/20 group-hover:text-[#9df425] transition-all" />
                  <div className="absolute inset-0 bg-[#9df425]/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all" />
                </div>
                <div>
                  <p className="text-[12px] font-mono text-white/60 uppercase tracking-[0.3em]">Neural_Link_Unavailable</p>
                  <p className="text-[10px] font-mono text-white/30 mt-2 uppercase tracking-widest leading-relaxed">
                    Henüz otomasyon kuralı tanımlanmadı. Sistem neuralları bekliyor.
                  </p>
                </div>
                <div className="pt-2">
                  <button className="h-9 px-6 bg-transparent border border-white/10 hover:border-[#9df425]/30 text-[10px] font-mono uppercase tracking-[0.2em] transition-all hover:bg-[#9df425]/5 text-white/60 hover:text-[#9df425]">
                    :: INITIALIZE_NEW_LINK
                  </button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-4 outline-none">
            <Card className="bg-black/40 border-white/5 backdrop-blur-sm rounded-none bcc-glass h-[500px] flex items-center justify-center relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="text-center space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto relative group">
                  <Webhook className="h-8 w-8 text-white/20 group-hover:text-[#ff8c00] transition-all" />
                  <div className="absolute inset-0 bg-[#ff8c00]/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all" />
                </div>
                <div>
                  <p className="text-[12px] font-mono text-white/60 uppercase tracking-[0.3em]">Signal_Relay_Null</p>
                  <p className="text-[10px] font-mono text-white/30 mt-2 uppercase tracking-widest leading-relaxed">
                    Platform olaylarını dış dünyaya bağlamak için webhook ekosistemini başlatın.
                  </p>
                </div>
                <div className="pt-2">
                  <button className="h-9 px-6 bg-transparent border border-white/10 hover:border-[#ff8c00]/30 text-[10px] font-mono uppercase tracking-[0.2em] transition-all hover:bg-[#ff8c00]/5 text-white/60 hover:text-[#ff8c00]">
                    :: PROVISION_WEBHOOK_SIGNAL
                  </button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Event Log Tab */}
          <TabsContent value="events" className="space-y-4 outline-none">
            <EventLogViewer />
          </TabsContent>
        </Tabs>
      </div>
    </AutomationLayoutWrapper>
  );
}
