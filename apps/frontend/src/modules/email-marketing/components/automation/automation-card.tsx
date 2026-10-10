/**
 * Automation Card Component
 * Card display for individual automation
 */

'use client';

import { Automation, AutomationStatus, TriggerType } from '@/types/automation';
import { useActivateAutomation, usePauseAutomation } from '@/hooks/use-automation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  Pause,
  Edit,
  Trash2,
  MoreVertical,
  Users,
  Activity,
  Clock,
  CheckCircle2,
  Zap,
  Calendar,
  User,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AutomationCardProps {
  automation: Automation;
  onDelete: (id: string) => void;
  tenant: string;
}

export function AutomationCard({ automation, onDelete, tenant }: AutomationCardProps) {
  const activateMutation = useActivateAutomation();
  const pauseMutation = usePauseAutomation();

  const handleActivate = async () => {
    await activateMutation.mutateAsync({ id: automation.id, registerExisting: false });
  };

  const handlePause = async () => {
    await pauseMutation.mutateAsync({ id: automation.id, cancelPending: false });
  };

  const getStatusConfig = (status: AutomationStatus) => {
    switch (status) {
      case AutomationStatus.ACTIVE:
        return { color: '#9df425', label: 'LINK_ACTIVE' };
      case AutomationStatus.PAUSED:
        return { color: '#ff8c00', label: 'SYNC_PAUSED' };
      case AutomationStatus.DRAFT:
        return { color: '#ffffff66', label: 'INITIALIZING' };
      case AutomationStatus.COMPLETED:
        return { color: '#3b82f6', label: 'TASK_TERMINATED' };
      case AutomationStatus.ARCHIVED:
        return { color: '#ffffff22', label: 'VAULTED_NODE' };
      default:
        return { color: '#ffffff44', label: 'UNKNOWN_STATE' };
    }
  };

  const currentStatus = getStatusConfig(automation.status);

  const getTriggerIcon = (type: TriggerType) => {
    const iconClass = "h-3.5 w-3.5 opacity-40";
    switch (type) {
      case TriggerType.EVENT:
        return <Zap className={iconClass} />;
      case TriggerType.BEHAVIOR:
        return <Activity className={iconClass} />;
      case TriggerType.TIME_BASED:
        return <Calendar className={iconClass} />;
      case TriggerType.ATTRIBUTE:
        return <User className={iconClass} />;
      default:
        return <GitBranch className={iconClass} />;
    }
  };

  const canActivate = automation.status === AutomationStatus.DRAFT || automation.status === AutomationStatus.PAUSED;
  const canPause = automation.status === AutomationStatus.ACTIVE;

  return (
    <div className="group relative bg-[#0a0a0a] border border-white/5 p-5 backdrop-blur-md transition-all duration-300 hover:border-white/10 hover:bg-white/[0.03]">
      {/* Top Protocol Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: currentStatus.color, boxShadow: `0 0 10px ${currentStatus.color}44` }}
          />
          <span className="text-[8px] font-mono font-bold tracking-[0.2em] text-white/40 uppercase">
            {currentStatus.label}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none border border-transparent hover:border-white/10 hover:bg-white/5 transition-all">
              <MoreVertical className="h-3.5 w-3.5 text-white/40" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase text-[9px]">
            <Link href={`/${tenant}/admin/email/automations/${automation.id}`}>
              <DropdownMenuItem className="focus:bg-white/5">
                <Edit className="mr-2 h-3.5 w-3.5 opacity-40" /> NODE_ACCESS
              </DropdownMenuItem>
            </Link>
            <Link href={`/${tenant}/admin/email/automations/${automation.id}/analytics`}>
              <DropdownMenuItem className="focus:bg-white/5">
                <Activity className="mr-2 h-3.5 w-3.5 opacity-40" /> TELEMETRY_FEED
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-white/5" />
            {canActivate && (
              <DropdownMenuItem onClick={handleActivate} className="focus:bg-white/5 text-[#9df425]">
                <Play className="mr-2 h-3.5 w-3.5 opacity-40" /> INITIALIZE_SYNC
              </DropdownMenuItem>
            )}
            {canPause && (
              <DropdownMenuItem onClick={handlePause} className="focus:bg-white/5 text-[#ff8c00]">
                <Pause className="mr-2 h-3.5 w-3.5 opacity-40" /> INTERRUPT_PULSE
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={() => onDelete(automation.id)}
              className="text-red-500 focus:text-red-500 focus:bg-red-500/5"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5 opacity-40" /> PURGE_LATTICE
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {getTriggerIcon(automation.triggerType)}
            <h3 className="text-xs font-bold text-white tracking-widest uppercase truncate">{automation.name}</h3>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2 uppercase tracking-wide">
            {automation.description || 'NODE_DESCRIPTION_UNDEFINED'}
          </p>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5 mt-6">
          <div className="bg-[#0a0a0a] p-3 space-y-1">
            <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest">NODES_MAPPED</div>
            <div className="text-xs font-bold text-white tabular-nums flex items-center gap-1.5">
              <Users className="h-3 w-3 text-white/20" /> {automation.subscriberCount.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#0a0a0a] p-3 space-y-1">
            <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest">PULSES_FIRED</div>
            <div className="text-xs font-bold text-white tabular-nums flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-white/20" /> {automation.executionCount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Path Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-4">
          <div className="flex items-center gap-2 text-[8px] font-mono text-white/40 uppercase tracking-widest">
            <GitBranch className="h-2.5 w-2.5" />
            {automation.workflowSteps.length} NODAL_STEPS
          </div>

          {automation.executionCount > 0 && (
            <div className="text-[8px] font-mono text-[#9df425] font-bold tracking-widest uppercase">
              {automation.successRate.toFixed(1)}%_SIGNAL
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex gap-2 mt-6">
        {canActivate && (
          <Button
            onClick={handleActivate}
            disabled={activateMutation.isPending}
            className="flex-1 rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] font-bold text-[8px] tracking-[0.2em] uppercase h-8 transition-all"
          >
            INITIATE
          </Button>
        )}
        {canPause && (
          <Button
            onClick={handlePause}
            disabled={pauseMutation.isPending}
            variant="outline"
            className="flex-1 rounded-none border-white/10 text-white/60 hover:bg-white/5 font-bold text-[8px] tracking-[0.2em] uppercase h-8 transition-all"
          >
            PAUSE
          </Button>
        )}
        <Button variant="outline" asChild className="flex-1 rounded-none border-white/10 text-white/60 hover:bg-white/5 font-bold text-[8px] tracking-[0.2em] uppercase h-8 transition-all">
          <Link href={`/${tenant}/admin/email/automations/${automation.id}`}>
            CONFIGURE
          </Link>
        </Button>
      </div>
    </div>
  );
}
