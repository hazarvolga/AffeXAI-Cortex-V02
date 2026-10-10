"use client";

import { useState, useEffect, useRef } from 'react';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, XCircle, AlertTriangle, Mail, Shield, Server, Globe, UserX, Zap,
  TrendingUp, Loader2, Activity, Cpu, Database, Play, Radar, Hexagon, Terminal, Eye, FileText,
  Search, Lock, Unlock, HardDrive, UploadCloud
} from 'lucide-react';

// Get backend API URL - use env variable for production support
function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006/api';
}

interface ValidationLog {
  traceId: string;
  email: string;
  status: 'VALID' | 'RISKY' | 'INVALID' | 'DISPOSABLE';
  latency: string;
  timestamp: string;
}

interface ValidationJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  stats: {
    valid: number;
    risky: number;
    invalid: number;
    disposable: number;
    roleBased: number;
    syntaxError: number;
    typo: number;
  };
  liveLogs?: ValidationLog[];
}

// Mock Data for "System Cluster"
const MOCK_SEGMENTS = [
  { id: 'seg-001', name: 'Active Subscribers (Q1)', count: 4520, risk: 'LOW' },
  { id: 'seg-002', name: 'Cold Leads - Imported', count: 12500, risk: 'HIGH' },
  { id: 'seg-003', name: 'VIP Customers', count: 850, risk: 'LOW' },
  { id: 'grp-001', name: 'Newsletter: Tech Weekly', count: 3200, risk: 'MED' },
  { id: 'grp-002', name: 'Webinar Registrants', count: 156, risk: 'LOW' },
];

function ForensicTargetModal({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (id: string, name: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setScanning(true);
      const timer = setTimeout(() => setScanning(false), 800); // Simulate "Scanning" delay
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const filteredSegments = MOCK_SEGMENTS.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300'>
      <div className="w-[600px] bg-[#0a0a0a] border border-[#9df425]/30 shadow-[0_0_50px_rgba(157,244,37,0.1)] relative overflow-hidden font-mono text-white">
        {/* CRT Scanline Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]" />

        {/* Header */}
        <div className='bg-[#9df425]/10 p-4 border-b border-[#9df425]/20 flex justify-between items-center relative z-20'>
          <div className='flex items-center gap-3'>
            <HardDrive className='h-5 w-5 text-[#9df425]' />
            <div>
              <h3 className='text-xs font-black uppercase tracking-[0.2em] text-[#9df425]'>Database Access Terminal</h3>
              <p className='text-[9px] text-[#9df425]/60'>SECURE CONNECTION ESTABLISHED</p>
            </div>
          </div>
          <button onClick={onClose} className='hover:bg-[#9df425]/20 p-2 rounded-sm transition-colors text-[#9df425]'>
            <XCircle className='h-5 w-5' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 min-h-[400px] flex flex-col relative z-20'>
          {scanning ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 text-[#9df425] animate-spin" />
              <p className="text-xs uppercase tracking-widest text-[#9df425] animate-pulse">Scanning System Directories...</p>
            </div>
          ) : (
            <>
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#9df425]/50" />
                <Input
                  autoFocus
                  placeholder="SEARCH_QUERY: [SEGMENT_ID] OR [NAME]"
                  className="bg-black/50 border-[#9df425]/30 text-[#9df425] pl-10 h-10 rounded-sm focus:border-[#9df425] focus:ring-0 placeholder:text-[#9df425]/30 uppercase tracking-wider text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Results List */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-1 scrollbar-thin scrollbar-thumb-[#9df425]/20 scrollbar-track-transparent max-h-[300px]">
                <div className="grid grid-cols-12 text-[9px] uppercase text-[#9df425]/40 mb-2 px-3">
                  <span className="col-span-2">ID</span>
                  <span className="col-span-6">Name</span>
                  <span className="col-span-2 text-right">Count</span>
                  <span className="col-span-2 text-right">Risk Est.</span>
                </div>
                {filteredSegments.map((seg) => (
                  <div
                    key={seg.id}
                    onClick={() => onSelect(seg.id, seg.name)}
                    className="grid grid-cols-12 items-center p-3 border border-white/5 hover:border-[#9df425] hover:bg-[#9df425]/10 cursor-pointer transition-all group rounded-sm"
                  >
                    <span className="col-span-2 text-[10px] text-white/50 font-mono group-hover:text-[#9df425]">{seg.id}</span>
                    <span className="col-span-6 text-xs text-white group-hover:text-[#9df425] font-bold">{seg.name}</span>
                    <span className="col-span-2 text-right text-xs font-mono text-white/70">{seg.count.toLocaleString()}</span>
                    <span className={cn(
                      "col-span-2 text-right text-[9px] font-bold",
                      seg.risk === 'HIGH' ? "text-red-500" : seg.risk === 'MED' ? "text-[#ff8c00]" : "text-[#9df425]"
                    )}>
                      [{seg.risk}]
                    </span>
                  </div>
                ))}
                {filteredSegments.length === 0 && (
                  <div className="text-center py-10 text-[#9df425]/40 text-xs">
                    NO DIRECTORIES FOUND
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Status */}
        <div className="bg-black p-2 border-t border-[#9df425]/20 flex justify-between text-[8px] uppercase tracking-widest text-[#9df425]/40 relative z-20">
          <span>MEM: 64TB OK</span>
          <span>ENCRYPTION: AES-256</span>
        </div>
      </div>
    </div>
  );
}

export function EmailValidator() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ValidationJob | null>(null);
  const [targetInput, setTargetInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<{ id: string, name: string } | null>(null);
  const [showExternalWarning, setShowExternalWarning] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [job?.liveLogs]);

  // Polling Logic
  useEffect(() => {
    if (jobId && isValidating) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${getBackendUrl()}/email-marketing/validation/${jobId}`);
          if (res.ok) {
            const data = await res.json();
            setJob(data);
            if (data.status === 'completed' || data.status === 'failed') {
              setIsValidating(false);
              if (pollingInterval) clearInterval(pollingInterval);
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 2000); // 2s smart polling
      setPollingInterval(interval);
      return () => clearInterval(interval);
    }
  }, [jobId, isValidating]);

  const startValidation = async (type: 'manual' | 'segment', payload: any) => {
    setIsValidating(true);
    setJob(null); // Reset UI
    try {
      const res = await fetch(`${getBackendUrl()}/email-marketing/validation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type === 'manual' ? { type, emails: [payload] } : { type, targetId: payload.id })
      });
      const data = await res.json();
      setJobId(data.jobId);
    } catch (e) {
      console.error("Start validation error", e);
      setIsValidating(false);
    }
  };

  const handleTargetSelect = (id: string, name: string) => {
    setSelectedTarget({ id, name });
    setModalOpen(false);
  };

  const handleExternalClick = () => {
    setShowExternalWarning(true);
    setTimeout(() => setShowExternalWarning(false), 2000);
  };

  // Render Helpers
  const getProgressColor = (val: number) => {
    if (val > 90) return "bg-[#9df425]"; // Green
    if (val > 50) return "bg-[#ff8c00]"; // Orange
    return "bg-red-500";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">

      <ForensicTargetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleTargetSelect}
      />

      {/* PHASE 1: TARGET ACQUISITION (When no active Job) */}
      {!jobId && (
        <>
          {selectedTarget ? (
            <div className="max-w-md mx-auto animate-in zoom-in-95 duration-500">
              <BccHudTile title="TARGET_LOCKED" subtitle="Ready to Scan" icon="lock" accentColor="#9df425">
                <div className="text-center space-y-4 py-6">
                  <div className="h-16 w-16 mx-auto bg-[#9df425]/10 rounded-full flex items-center justify-center border border-[#9df425]/50 animate-pulse ring-4 ring-[#9df425]/10">
                    <Database className="h-8 w-8 text-[#9df425]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedTarget.name}</h2>
                    <p className="text-xs font-mono text-[#9df425] mt-1">ID: {selectedTarget.id}</p>
                  </div>
                  <div className="flex gap-2 justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedTarget(null)}
                      className="border-white/10 hover:bg-white/5 text-white/50 text-xs rounded-none h-10 px-6"
                    >
                      ABORT
                    </Button>
                    <Button
                      onClick={() => startValidation('segment', selectedTarget)}
                      className="bg-[#9df425] text-black hover:bg-[#8ce61b] font-bold tracking-widest text-xs px-8 rounded-none h-10"
                    >
                      INITIATE_SCAN
                    </Button>
                  </div>
                </div>
              </BccHudTile>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Single Node */}
              <BccHudTile title="SINGLE_NODE" subtitle="Manual Entry" icon="crosshair">
                <div className="space-y-4">
                  <div className="h-32 flex flex-col justify-center items-center text-center space-y-2 opacity-60">
                    <Radar className="h-12 w-12 text-[#ff8c00] animate-pulse" />
                    <p className="text-[10px] uppercase">Awaiting Coordinates</p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: target@domain.com"
                      className="rounded-none bg-white/5 border-white/10 text-[10px] uppercase font-mono focus:border-[#ff8c00]/50"
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && targetInput && startValidation('manual', targetInput)}
                    />
                    <Button
                      onClick={() => startValidation('manual', targetInput)}
                      disabled={!targetInput}
                      className="rounded-none bg-[#ff8c00] text-black hover:bg-[#e67e00] font-bold text-[10px]"
                    >
                      SCAN
                    </Button>
                  </div>
                </div>
              </BccHudTile>

              {/* Card 2: System Cluster */}
              <div onClick={() => setModalOpen(true)}>
                <BccHudTile title="SYSTEM_CLUSTER" subtitle="Segment/Group" icon="layers" className="cursor-pointer hover:border-[#9df425]/50 transition-colors group h-full">
                  <div className="relative h-full min-h-[180px] border border-transparent transition-all p-4 flex flex-col justify-center items-center">
                    <div className="absolute inset-0 bg-[#9df425]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Database className="h-10 w-10 text-[#9df425] mb-3 group-hover:scale-110 transition-transform duration-500" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white">Select Data Source</h4>
                    <p className="text-[9px] text-white/40 mt-1 text-center">Access internal registries</p>
                    <span className="mt-4 text-[9px] text-[#9df425] opacity-0 group-hover:opacity-100 transition-opacity animate-pulse font-mono tracking-widest">ACCESS TERMINAL_</span>
                  </div>
                </BccHudTile>
              </div>

              {/* Card 3: External Payload */}
              <div onClick={handleExternalClick}>
                <BccHudTile
                  title="EXTERNAL_PAYLOAD"
                  subtitle="CSV/JSON Import"
                  icon="upload"
                  className={cn(
                    "cursor-pointer transition-all duration-300 h-full",
                    showExternalWarning ? "border-red-500/50 bg-red-500/5" : "hover:border-blue-500/30"
                  )}
                >
                  <div className="relative h-full min-h-[180px] group border border-transparent transition-all p-4 flex flex-col justify-center items-center">
                    <div className={cn(
                      "absolute inset-0 transition-opacity",
                      showExternalWarning ? "bg-red-500/10 opacity-100" : "bg-blue-500/5 opacity-0 group-hover:opacity-100"
                    )} />

                    {showExternalWarning ? (
                      <div className="text-center animate-pulse">
                        <AlertTriangle className="h-10 w-10 text-red-500 mb-3 mx-auto" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-red-500">ACCESS DENIED</h4>
                        <p className="text-[9px] text-red-400 mt-1">Upload module offline</p>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="h-10 w-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform duration-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">Upload Ledger</h4>
                        <p className="text-[9px] text-white/40 mt-1 text-center">Batch injection protocol</p>
                        <span className="mt-4 text-[9px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono tracking-widest">INITIALIZE UPLOAD_</span>
                      </>
                    )}
                  </div>
                </BccHudTile>
              </div>
            </div>
          )}
        </>
      )}

      {/* PHASE 2: NEURAL SCANNER (Active Job) */}
      {jobId && job && (
        <div className="grid grid-cols-12 gap-6 animate-in slide-in-from-bottom-4 duration-700">

          {/* LEFT: SIGNAL GRID & TELEMETRY */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Global Pulse Gauge */}
            <BccHudTile title="GLOBAL_PULSE" icon="activity">
              <div className="flex flex-col items-center py-6 relative">
                {/* Circular Progress Simulation */}
                <div className="relative h-32 w-32 rounded-full border-4 border-white/5 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#9df425] border-r-[#9df425] border-b-transparent border-l-transparent animate-spin-slow" />
                  <div className="text-center">
                    <span className="text-3xl font-mono font-bold text-white">
                      {job.totalRecords > 0 ? Math.round((job.processedRecords / job.totalRecords) * 100) : 0}%
                    </span>
                    <p className="text-[9px] text-white/40 uppercase">Completion</p>
                  </div>
                </div>
                <div className="mt-6 w-full space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-mono">
                    <span className="text-white/40">Throughput</span>
                    <span className="text-[#9df425]">120/sec</span>
                  </div>
                  <div className="flex justify-between text-[10px] uppercase font-mono">
                    <span className="text-white/40">Est. Time</span>
                    <span className="text-white">00:04:12</span>
                  </div>
                </div>
              </div>
            </BccHudTile>

            {/* Authentication Ledger */}
            <BccHudTile title="AUTH_LEDGER" subtitle="SPF/DKIM/DMARC" icon="shield">
              <div className="space-y-3">
                {['SPF', 'DKIM', 'DMARC'].map(proto => (
                  <div key={proto} className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-2 last:border-0">
                    <span className="text-white/60">{proto}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[85%]" />
                      </div>
                      <span className="text-blue-400">85%</span>
                    </div>
                  </div>
                ))}
              </div>
            </BccHudTile>
          </div>

          {/* CENTER: FORENSIC STREAM & THREAT TOPOLOGY */}
          <div className="col-span-12 lg:col-span-6 space-y-6">
            {/* Threat Topology Map (Heatmap simulation) */}
            <BccHudTile title="THREAT_TOPOLOGY" subtitle="Cluster Risk Analysis" icon="grid_view" className="min-h-[200px]">
              <div className="grid grid-cols-10 gap-1 h-32">
                {Array.from({ length: 50 }).map((_, i) => {
                  // Mock heatmap logic
                  const isRisk = i % 7 === 0;
                  const isSafe = i % 3 === 0;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-[1px] transition-all duration-1000",
                        isRisk ? "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.2)]" :
                          isSafe ? "bg-[#9df425]/10" : "bg-white/5"
                      )}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 text-[8px] font-mono text-white/30 uppercase">
                <span>Sector A-1</span>
                <span>Sector E-10</span>
              </div>
            </BccHudTile>

            {/* Live Forensic Terminal */}
            <div className="bg-black/90 border border-white/10 p-4 font-mono text-[10px] h-[300px] overflow-hidden flex flex-col relative rounded-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
              <div className="absolute top-2 right-4 flex gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-500 font-bold tracking-widest">LIVE_STREAM</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide pr-2 font-mono">
                {job.liveLogs?.map((log, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 border-b border-white/5 pb-1 mb-1 opacity-80 hover:opacity-100 hover:bg-white/5 transition-all cursor-default">
                    <span className="col-span-2 text-white/30 truncate text-[9px]">{log.traceId}</span>
                    <span className="col-span-2 text-white/50 text-[9px]">{log.latency}</span>
                    <span className="col-span-6 text-white truncate font-bold text-[#b0b0b0]" style={{ textShadow: '0 0 5px rgba(255,255,255,0.2)' }}>{log.email}</span>
                    <span className={cn(
                      "col-span-2 font-bold text-right text-[9px]",
                      log.status === 'VALID' ? 'text-[#9df425]' :
                        log.status === 'RISKY' ? 'text-[#ff8c00]' : 'text-red-500'
                    )}>
                      {log.status}
                    </span>
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>

          {/* RIGHT: CLASSIFICATION & ACTION */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Strategic Gap Alert */}
            {(job.stats.risky + job.stats.invalid) > 10 && (
              <div className="p-4 bg-red-950/30 border border-red-500/30 relative overflow-hidden animate-pulse">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                <div className="flex items-start gap-3 relative z-10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1">Strategic Gap</h4>
                    <p className="text-[9px] text-red-400/80 leading-relaxed font-mono">
                      High density of disposable nodes detected. Recommended immediate purge protocols.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hygiene Matrix */}
            <BccHudTile title="HYGIENE_MATRIX" subtitle="Classification Breakdown">
              <div className="space-y-4">
                {[
                  { label: 'VALID_NODES', count: job.stats.valid, color: 'bg-[#9df425]' },
                  { label: 'DISPOSABLE', count: job.stats.disposable, color: 'bg-[#ff8c00]' },
                  { label: 'ROLE_BASED', count: job.stats.roleBased, color: 'bg-blue-500' },
                  { label: 'SYNTAX_ERR', count: job.stats.syntaxError, color: 'bg-red-500' }
                ].map(stat => (
                  <div key={stat.label} className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-white/60">
                      <span>{stat.label}</span>
                      <span className="text-white">{stat.count}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-1000 ease-out", stat.color)}
                        style={{ width: `${job.totalRecords ? (stat.count / job.totalRecords) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </BccHudTile>

            {/* Actions */}
            <div className="space-y-2">
              <Button className="w-full rounded-none bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] font-bold uppercase tracking-widest h-10 text-white transition-all">
                Export Dossier
              </Button>
              <Button
                variant="destructive"
                className="w-full rounded-none bg-red-900/20 border border-red-500/30 hover:bg-red-900/40 text-red-500 text-[9px] font-bold uppercase tracking-widest h-10 transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                disabled={job.status !== 'completed'}
              >
                Purge Invalid Nodes
              </Button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
