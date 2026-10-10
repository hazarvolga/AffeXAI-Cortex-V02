'use client';

import { useState, useEffect, useCallback } from 'react';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { LogsConsole } from '@/components/logs/LogsConsole';
import { Activity, AlertTriangle, Info, XCircle, Filter, Download, RefreshCw, BarChart3, Database, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { systemLogsService, LogStats, SystemLog } from '@/lib/api/systemLogsService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LogsLayoutWrapper = ({
    children,
    telemetryData
}: {
    children: React.ReactNode;
    telemetryData: any[];
}) => {
    return (
        <BccEditorialWrapper
            theme="tenant-admin"
            headerTitle="Black Box Intelligence"
            headerSubtitle="Synthesizing systemic perturbations and neural dispatch logs."
            headerBadge="Log Stream"
            telemetryData={telemetryData}
        >
            <div className="relative z-10 w-full min-h-screen flex flex-col pt-0">
                {children}
            </div>
        </BccEditorialWrapper>
    );
};

export default function SystemLogsPage() {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [severityFilter, setSeverityFilter] = useState<string>('ALL');
    const [moduleFilter, setModuleFilter] = useState<string>('ALL');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<LogStats>({ info: 0, warn: 0, error: 0, debug: 0, total: 0 });
    const [eps, setEps] = useState(0);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const [logsRes, statsRes] = await Promise.all([
                systemLogsService.getSystemLogs({
                    level: severityFilter !== 'ALL' ? severityFilter : undefined,
                    context: moduleFilter !== 'ALL' ? moduleFilter : undefined,
                    limit: 1000,
                }),
                systemLogsService.getStats()
            ]);

            setLogs(logsRes.items);
            setTotalLogs(logsRes.total);
            setStats(statsRes);

            // Calculate EPS (simple simulation based on last 24h total)
            setEps(Math.floor(statsRes.total / 86400 * 100) / 100);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            toast.error('Failed to connect to event stream');
        } finally {
            setLoading(false);
        }
    }, [severityFilter, moduleFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleRefresh = () => {
        fetchLogs();
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `system-logs-${new Date().toISOString()}.json`;
        link.click();
        toast.success('Logs exported successfully');
    };

    const errorRate = (stats?.total || 0) > 0 ? (((stats?.error || 0) / (stats?.total || 1)) * 100).toFixed(2) : '0.00';

    const telemetryResonance = [
        { label: 'EVENTS_PER_SEC', value: (eps || 0).toString(), color: '#9df425' },
        { label: 'ERROR_QUOTIENT', value: errorRate, suffix: '%', color: '#ff0000' },
        { label: 'TOTAL_VECTORS', value: (stats?.total || 0).toLocaleString(), color: '#ff8c00' },
    ];

    const modules = ['ALL', 'SYSTEM', 'API', 'AUTH', 'DATABASE', 'EMAIL', 'WORKER'];

    return (
        <LogsLayoutWrapper telemetryData={telemetryResonance}>
            <div className="space-y-6">
                {/* Control Panel */}
                <div className="flex items-center justify-between gap-4 p-4 bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-4">
                        {/* Severity Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-3 h-3 text-white/40" />
                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Severity:</span>
                            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                <SelectTrigger className="w-32 h-8 bg-black border-white/10 rounded-none text-[10px] uppercase font-mono">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-black border-white/10 rounded-none">
                                    <SelectItem value="ALL" className="text-[10px] uppercase font-mono">All</SelectItem>
                                    <SelectItem value="INFO" className="text-[10px] uppercase font-mono text-[#9df425]">Info</SelectItem>
                                    <SelectItem value="WARN" className="text-[10px] uppercase font-mono text-[#ff8c00]">Warn</SelectItem>
                                    <SelectItem value="ERROR" className="text-[10px] uppercase font-mono text-[#ff0000]">Error</SelectItem>
                                    <SelectItem value="DEBUG" className="text-[10px] uppercase font-mono text-white/40">Debug</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Module Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Module:</span>
                            <Select value={moduleFilter} onValueChange={setModuleFilter}>
                                <SelectTrigger className="w-32 h-8 bg-black border-white/10 rounded-none text-[10px] uppercase font-mono">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-black border-white/10 rounded-none">
                                    {modules.map(mod => (
                                        <SelectItem key={mod} value={mod} className="text-[10px] uppercase font-mono">
                                            {mod}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            View: <span className="text-white">{logs.length.toLocaleString()}</span> / Total: <span className="text-white">{totalLogs.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                            className="h-8 bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-none text-[10px] uppercase tracking-widest font-mono"
                        >
                            <RefreshCw className={cn("w-3 h-3 mr-1.5", loading && "animate-spin")} />
                            Refresh
                        </Button>
                        <Button
                            onClick={handleExport}
                            variant="outline"
                            size="sm"
                            className="h-8 bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-none text-[10px] uppercase tracking-widest font-mono"
                        >
                            <Download className="w-3 h-3 mr-1.5" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Telemetry HUD */}
                <div className="grid grid-cols-4 gap-4">
                    <BccHudTile title="INFO_SIGNALS" subtitle="Operational Quiescence" icon={Info} accentColor="#9df425">
                        <div className="text-3xl font-mono tracking-tighter text-[#9df425]">
                            {(stats?.info || 0).toLocaleString()}
                        </div>
                    </BccHudTile>

                    <BccHudTile title="WARN_SIGNALS" subtitle="System Friction" icon={AlertTriangle} accentColor="#ff8c00">
                        <div className="text-3xl font-mono tracking-tighter text-[#ff8c00]">
                            {(stats?.warn || 0).toLocaleString()}
                        </div>
                    </BccHudTile>

                    <BccHudTile title="ERROR_SIGNALS" subtitle="Critical Failures" icon={XCircle} accentColor="#ff0000">
                        <div className="text-3xl font-mono tracking-tighter text-[#ff0000]">
                            {(stats?.error || 0).toLocaleString()}
                        </div>
                    </BccHudTile>

                    <BccHudTile title="DEBUG_SIGNALS" subtitle="Internal Resonance" icon={Activity} accentColor="rgba(255,255,255,0.4)">
                        <div className="text-3xl font-mono tracking-tighter text-white/40">
                            {(stats?.debug || 0).toLocaleString()}
                        </div>
                    </BccHudTile>
                </div>

                {/* Logs Console */}
                <LogsConsole logs={logs} loading={loading} />
            </div>
        </LogsLayoutWrapper>
    );
}
