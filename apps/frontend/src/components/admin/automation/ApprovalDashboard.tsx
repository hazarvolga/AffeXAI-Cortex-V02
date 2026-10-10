'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BccHudTile } from '@/components/brand/BccHudTile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  Users,
  Calendar,
  Activity,
  MessageSquare,
  RefreshCw,
  Zap,
  TrendingDown
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { approvalsService } from '@/lib/api/approvalsService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  AUTO_APPROVED = 'auto_approved',
  EXPIRED = 'expired',
}

export enum ApprovalPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ActionImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

interface ApprovalRequest {
  id: string;
  ruleName: string;
  status: ApprovalStatus;
  priority: ApprovalPriority;
  impactLevel: ActionImpactLevel;
  requestedBy: string;
  requestedAt: Date;
  requestReason?: string;
  pendingActions: Array<{
    type: string;
    description: string;
    estimatedImpact?: {
      affectedUsers?: number;
      affectedRecords?: number;
    };
  }>;
  requiredApprovals: number;
  currentApprovals: number;
  expiresAt?: Date;
  approvalChain?: Array<{
    userName: string;
    action: 'approved' | 'rejected';
    comment?: string;
    timestamp: Date;
  }>;
}

const statusConfig = {
  [ApprovalStatus.PENDING]: {
    label: 'QUEUED',
    color: 'text-[#ff8c00]',
    accent: '#ff8c00',
    icon: Clock,
  },
  [ApprovalStatus.APPROVED]: {
    label: 'COMMITTED',
    color: 'text-[#9df425]',
    accent: '#9df425',
    icon: CheckCircle,
  },
  [ApprovalStatus.REJECTED]: {
    label: 'HALTED',
    color: 'text-[#ff0000]',
    accent: '#ff0000',
    icon: XCircle,
  },
  [ApprovalStatus.AUTO_APPROVED]: {
    label: 'AUTO_EXEC',
    color: 'text-[#9df425]',
    accent: '#9df425',
    icon: CheckCircle,
  },
  [ApprovalStatus.EXPIRED]: {
    label: 'STALE',
    color: 'text-white/40',
    accent: 'rgba(255,255,255,0.2)',
    icon: Clock,
  },
};

const priorityConfig = {
  [ApprovalPriority.URGENT]: {
    label: 'CRITICAL_NODE',
    color: 'bg-[#ff0000]/10 text-[#ff0000] border-[#ff0000]/20',
    pulse: 'shadow-[0_0_8px_#ff0000]',
  },
  [ApprovalPriority.HIGH]: {
    label: 'HIGH_PRIORITY',
    color: 'bg-[#ff8c00]/10 text-[#ff8c00] border-[#ff8c00]/20',
    pulse: 'shadow-[0_0_8px_#ff8c00]',
  },
  [ApprovalPriority.MEDIUM]: {
    label: 'SYSTEM_PRIORITY',
    color: 'bg-white/5 text-white/60 border-white/10',
    pulse: '',
  },
  [ApprovalPriority.LOW]: {
    label: 'IDLE_PRIORITY',
    color: 'bg-white/5 text-white/40 border-white/10',
    pulse: '',
  },
};

export default function ApprovalDashboard() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const data = await approvalsService.getPending();

      setApprovals(data.map(approval => ({
        id: approval.id,
        ruleName: `NODE_${approval.ruleId.slice(0, 8).toUpperCase()}`,
        status: approval.status as ApprovalStatus,
        priority: approval.priority as ApprovalPriority,
        impactLevel: approval.impactLevel as ActionImpactLevel,
        requestedBy: approval.requestedBy,
        requestedAt: new Date(approval.createdAt),
        requestReason: approval.requestReason,
        pendingActions: approval.pendingActions.map(action => ({
          type: action.type,
          description: action.type,
          estimatedImpact: action.estimatedImpact,
        })),
        requiredApprovals: approval.requiredApprovals,
        currentApprovals: approval.currentApprovals,
        expiresAt: approval.expiresAt ? new Date(approval.expiresAt) : undefined,
        approvalChain: approval.approvalChain?.map(chain => ({
          userName: chain.userName,
          action: chain.action,
          comment: chain.comment,
          timestamp: new Date(chain.timestamp),
        })),
      })));
    } catch (error) {
      console.error('Error loading approvals:', error);
      toast.error('Onay talepleri senkronize edilemedi');
    } finally {
      setLoading(false);
    }
  };

  const refreshApprovals = async () => {
    setRefreshing(true);
    await loadApprovals();
    setRefreshing(false);
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;
    try {
      await approvalsService.approve(selectedApproval.id, 'current-user-id', 'Current User', comment);
      toast.success('Onay talebi işlendi (COMMITTED)');
      setReviewDialog(false);
      setComment('');
      await loadApprovals();
    } catch (error) {
      toast.error('İşlem başarısız (HALTED)');
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;
    try {
      await approvalsService.reject(selectedApproval.id, 'current-user-id', 'Current User', comment);
      toast.success('Onay talebi reddedildi (ABORTED)');
      setReviewDialog(false);
      setComment('');
      await loadApprovals();
    } catch (error) {
      toast.error('Red işlemi başarısız (HALTED)');
    }
  };

  const getRemainingTime = (expiresAt?: Date): string => {
    if (!expiresAt) return 'INFINITE_TTL';
    const now = new Date();
    const remaining = expiresAt.getTime() - now.getTime();
    if (remaining <= 0) return 'EXPIRED_SIGNAL';
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}H ${minutes.toString().padStart(2, '0')}M`;
  };

  const pendingApprovals = approvals.filter(a => a.status === ApprovalStatus.PENDING);

  return (
    <div className="space-y-6">
      {/* HUD Telemetry */}
      <div className="grid gap-4 md:grid-cols-4">
        <BccHudTile title="PENDING_COMMITS" subtitle="Awaiting Approval" icon={Clock} accentColor="#ff8c00">
          <div className="text-3xl font-mono tracking-tighter text-[#ff8c00]">{pendingApprovals.length}</div>
        </BccHudTile>

        <BccHudTile title="CRITICAL_LOAD" subtitle="Urgent Priority" icon={AlertTriangle} accentColor="#ff0000">
          <div className="text-3xl font-mono tracking-tighter text-[#ff0000]">
            {pendingApprovals.filter(a => a.priority === ApprovalPriority.URGENT || a.priority === ApprovalPriority.HIGH).length}
          </div>
        </BccHudTile>

        <BccHudTile title="SYTEM_RESILIENCE" subtitle="Avg Stability Ratio" icon={Zap} accentColor="#9df425">
          <div className="text-3xl font-mono tracking-tighter text-[#9df425]">99.2<span className="text-sm ml-1">%</span></div>
        </BccHudTile>

        <BccHudTile title="SIGNAL_INTERRUPTION" subtitle="Rejected Today" icon={TrendingDown} accentColor="rgba(255,255,255,0.4)">
          <div className="text-3xl font-mono tracking-tighter text-white/40">0</div>
        </BccHudTile>
      </div>

      {/* Approval List Grid */}
      <Card className="bg-black/40 border-white/5 backdrop-blur-sm rounded-none bcc-glass overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#ff8c00]" />
        <CardHeader className="border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/80">Pending_Process_Queue</CardTitle>
            <CardDescription className="text-white/40 text-[10px] font-mono mt-1 uppercase tracking-widest leading-relaxed">
              Çalıştırılmadan önce neutral onay bekleyen sistem neuralları
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshApprovals}
            disabled={refreshing || loading}
            className="h-8 border-white/10 bg-transparent text-white/60 hover:bg-white/5 hover:text-white rounded-none text-[10px] font-mono uppercase tracking-widest"
          >
            <RefreshCw className={cn("h-3 w-3 mr-2", refreshing && "animate-spin")} />
            Sync_Matrix
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-[#ff8c00]/20 border-t-[#ff8c00] rounded-full animate-spin" />
                <span className="text-[10px] font-mono text-[#ff8c00] animate-pulse uppercase tracking-[0.4em]">Calibrating_Matrix...</span>
              </div>
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 relative">
                <CheckCircle className="h-8 w-8 text-white/10" />
                <div className="absolute inset-0 bg-[#9df425]/5 rounded-full blur-xl" />
              </div>
              <p className="text-[12px] font-mono text-white/60 uppercase tracking-[0.3em]">Resonance_Clear</p>
              <p className="text-[10px] font-mono text-white/30 mt-2 uppercase tracking-widest">Bekleyen onay bulunmuyor. Tüm sistemler uyumlu.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {pendingApprovals.map((approval) => {
                const statusCfg = statusConfig[approval.status];
                const priorityCfg = priorityConfig[approval.priority];
                const StatusIcon = statusCfg.icon;

                return (
                  <div
                    key={approval.id}
                    className="relative group bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all p-5"
                  >
                    {/* Identity Pulse Accent */}
                    <div className={cn("absolute top-0 left-0 w-1 h-full", priorityCfg.pulse.replace('shadow', 'bg').split('_')[0])} />

                    <div className="space-y-4">
                      {/* Node Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5 text-white/40" />
                            <h3 className="text-[12px] font-mono font-bold text-white/80 tracking-widest uppercase">{approval.ruleName}</h3>
                          </div>
                          {approval.requestReason && (
                            <p className="text-[10px] font-mono text-white/30 uppercase tracking-tight leading-relaxed">
                              {approval.requestReason}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <Badge className={cn("rounded-none border text-[9px] font-mono tracking-widest px-2 py-0.5", priorityCfg.color)}>
                            {priorityCfg.label}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className={cn("h-3 w-3", statusCfg.color)} />
                            <span className={cn("text-[10px] font-mono uppercase tracking-widest", statusCfg.color)}>{statusCfg.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic Mesh */}
                      <div className="grid grid-cols-2 gap-y-3 pt-2">
                        <div className="space-y-1">
                          <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                            <Users className="w-2.5 h-2.5" /> Requested_By
                          </p>
                          <p className="text-[10px] font-mono text-white/60 uppercase">{approval.requestedBy}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-2.5 h-2.5" /> Time_Remaining
                          </p>
                          <p className="text-[10px] font-mono text-[#ff8c00] uppercase">{getRemainingTime(approval.expiresAt)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                            <Activity className="w-2.5 h-2.5" /> Quorum_State
                          </p>
                          <p className="text-[10px] font-mono text-white/60 uppercase">{approval.currentApprovals} / {approval.requiredApprovals}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">TS_Signal</p>
                          <p className="text-[10px] font-mono text-white/40 uppercase">
                            {approval.requestedAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Action Vectors */}
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Neural_Aactions_Pending:</p>
                        {approval.pendingActions.map((action, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Zap className="w-3 h-3 text-white/20" />
                              <span className="text-[10px] font-mono text-white/60 uppercase">{action.description}</span>
                            </div>
                            {action.estimatedImpact && (
                              <div className="text-[9px] font-mono text-[#9df425]/60 bg-[#9df425]/5 border border-[#9df425]/10 px-1.5 py-0.5 uppercase">
                                {action.estimatedImpact.affectedUsers && `Impact: ${action.estimatedImpact.affectedUsers}_Units`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Commit Trigger */}
                      <div className="pt-2">
                        <Button
                          onClick={() => {
                            setSelectedApproval(approval);
                            setReviewDialog(true);
                          }}
                          className="w-full bg-[#9df425] hover:bg-[#9df425]/90 text-black rounded-none h-9 text-[10px] font-mono font-bold uppercase tracking-[.2em]"
                        >
                          :: EXECUTE_REVIEW_MATRIX
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Command Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 rounded-none overflow-hidden bcc-glass p-0">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#9df425]/40 to-transparent" />
          <DialogHeader className="p-6 border-b border-white/5 bg-white/[0.02]">
            <DialogTitle className="text-[14px] font-mono text-white/80 uppercase tracking-[0.3em]">Neural_Review_Command</DialogTitle>
            <DialogDescription className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-2 leading-relaxed">
              Analyzing process node: <span className="text-white/60">{selectedApproval?.ruleName}</span> :: State: Awaiting Decision
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Decision_Context (Optional_Log)</Label>
              <Textarea
                placeholder="PROVISION_NOTES_HERE..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="bg-black border-white/10 rounded-none text-white font-mono text-[12px] focus-visible:ring-[#9df425]/20"
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 bg-white/[0.02] flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setReviewDialog(false)}
              className="text-[10px] font-mono text-white/40 hover:text-white uppercase tracking-widest rounded-none h-10 px-6"
            >
              :: ABORT
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={handleReject}
              className="border-[#ff0000]/20 text-[#ff0000]/60 hover:bg-[#ff0000]/5 hover:text-[#ff0000] rounded-none h-10 px-8 text-[10px] font-mono uppercase tracking-[0.2em]"
            >
              :: HALT_EXECUTION
            </Button>
            <Button
              onClick={handleApprove}
              className="bg-[#9df425] hover:bg-[#9df425]/90 text-black rounded-none h-10 px-10 text-[10px] font-mono font-bold uppercase tracking-[0.2em]"
            >
              :: COMMITT_PROCESS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
