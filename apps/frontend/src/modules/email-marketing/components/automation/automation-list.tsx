/**
 * Automation List Component
 * Lists all automations with filtering and actions
 */

'use client';

import { useState } from 'react';
import { useAutomations, useDeleteAutomation } from '@/hooks/use-automation';
import { AutomationCard } from './automation-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter, Activity, Zap, Users, CheckCircle2, Clock } from 'lucide-react';
import { AutomationStatus, TriggerType } from '@/types/automation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AutomationListProps {
  tenant: string;
}

export function AutomationList({ tenant }: AutomationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AutomationStatus | 'all'>('all');
  const [triggerFilter, setTriggerFilter] = useState<TriggerType | 'all'>('all');

  const { data: automations, isLoading, error } = useAutomations();
  const deleteMutation = useDeleteAutomation();

  // Filter automations
  const filteredAutomations = automations?.filter((automation) => {
    const matchesSearch =
      automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      automation.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || automation.status === statusFilter;

    const matchesTrigger = triggerFilter === 'all' || automation.triggerType === triggerFilter;

    return matchesSearch && matchesStatus && matchesTrigger;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this automation?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (error) {
    console.error('Automation load error:', error);
    return (
      <BccHudTile title="SYSTEM_ERROR" icon="warning" subtitle="Neural link failure">
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 rounded-none">
          <AlertDescription>
            Failed to load automation lattices. Please re-sync terminal.
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 text-xs font-mono opacity-60">
                ERR_CODE: {error instanceof Error ? error.message : 'UNKNOWN_EXCEPTION'}
              </div>
            )}
          </AlertDescription>
        </Alert>
      </BccHudTile>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Registry Controls */}
      <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md">
        <div className="space-y-1">
          <h2 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Lattice_Operations</h2>
          <p className="text-[11px] text-white/60 uppercase tracking-widest font-bold">Protocol Initialization and Sync</p>
        </div>
        <Button asChild className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] font-bold text-[9px] tracking-[0.2em] uppercase px-8 h-10 transition-all">
          <Link href={`/${tenant}/admin/email/automations/new`}>
            <Plus className="mr-2 h-4 w-4" /> INITIALIZE_NEW_PATH
          </Link>
        </Button>
      </div>

      <BccHudTile
        title="AUTOMATION_MATRIX"
        subtitle="Active neural paths and transmission triggers"
        icon="hub"
      >
        <div className="space-y-8">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 bg-white/[0.01] border border-white/5 p-4 backdrop-blur-sm">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" />
              <Input
                placeholder="PROBE LATTICE ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-none bg-white/5 border-white/10 text-[9px] font-mono uppercase tracking-widest focus-visible:ring-[#ff8c00]/40"
              />
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="w-[160px] h-9 rounded-none bg-white/5 border-white/10 text-[9px] font-mono uppercase tracking-widest">
                  <Filter className="mr-2 h-3 w-3 opacity-40" />
                  <SelectValue placeholder="STATE" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase text-[9px]">
                  <SelectItem value="all">ALL_STATES</SelectItem>
                  <SelectItem value={AutomationStatus.DRAFT}>DRAFT_MODE</SelectItem>
                  <SelectItem value={AutomationStatus.ACTIVE}>ACTIVE_LINK</SelectItem>
                  <SelectItem value={AutomationStatus.PAUSED}>PAUSED_SYNC</SelectItem>
                  <SelectItem value={AutomationStatus.COMPLETED}>TERMINATED</SelectItem>
                  <SelectItem value={AutomationStatus.ARCHIVED}>VAULTED</SelectItem>
                </SelectContent>
              </Select>

              <Select value={triggerFilter} onValueChange={(value) => setTriggerFilter(value as any)}>
                <SelectTrigger className="w-[160px] h-9 rounded-none bg-white/5 border-white/10 text-[9px] font-mono uppercase tracking-widest">
                  <Zap className="mr-2 h-3 w-3 opacity-40" />
                  <SelectValue placeholder="TRIGGER" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase text-[9px]">
                  <SelectItem value="all">ALL_TRIGGERS</SelectItem>
                  <SelectItem value={TriggerType.EVENT}>EVENT_PULSE</SelectItem>
                  <SelectItem value={TriggerType.BEHAVIOR}>NODE_RESONANCE</SelectItem>
                  <SelectItem value={TriggerType.TIME_BASED}>TEMPORAL_MARK</SelectItem>
                  <SelectItem value={TriggerType.ATTRIBUTE}>METADATA_SHIFT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid View */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 border border-white/5 bg-white/[0.01] animate-pulse" />
              ))}
            </div>
          ) : filteredAutomations && filteredAutomations.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAutomations.map((automation) => (
                <AutomationCard
                  key={automation.id}
                  automation={automation}
                  onDelete={handleDelete}
                  tenant={tenant}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 gap-6 border border-dashed border-white/5 bg-white/[0.01]">
              <div className="p-4 bg-white/5 rounded-full border border-white/10">
                <Plus className="h-8 w-8 text-white/20" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-[12px] font-mono uppercase tracking-[0.3em] text-white/60 font-bold">Zero active lattices</h3>
                <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] max-w-xs mx-auto">
                  {searchQuery || statusFilter !== 'all' || triggerFilter !== 'all'
                    ? 'No signals match current probe parameters. Adjust filtering protocols.'
                    : 'System is currently dormant. Initialize your first neural path to begin autonomous transmission.'}
                </p>
              </div>
              {!searchQuery && statusFilter === 'all' && triggerFilter === 'all' && (
                <Button asChild className="mt-4 rounded-none border border-[#ff8c00]/40 bg-[#ff8c00]/5 text-[#ff8c00] font-bold text-[9px] tracking-[0.2em] uppercase px-8">
                  <Link href={`/${tenant}/admin/email/automations/new`}>
                    <Plus className="mr-2 h-4 w-4" /> START_FIRST_LINK
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Telemetry Footer */}
          {!isLoading && automations && automations.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-white/[0.02] border border-white/5">
              {[
                { label: 'TOTAL_PATHS', value: automations.length },
                { label: 'ACTIVE_LINKS', value: automations.filter((a) => a.status === AutomationStatus.ACTIVE).length },
                { label: 'TOTAL_NODES', value: automations.reduce((sum, a) => sum + a.subscriberCount, 0).toLocaleString() },
                { label: 'CUMULATIVE_PULSES', value: automations.reduce((sum, a) => sum + a.executionCount, 0).toLocaleString() },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">{stat.label}</div>
                  <div className="text-lg font-bold text-white tabular-nums">{stat.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </BccHudTile>
    </div>
  );
}
