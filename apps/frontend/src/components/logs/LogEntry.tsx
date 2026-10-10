'use client';

import { cn } from '@/lib/utils';
import { Info, AlertTriangle, XCircle, Activity } from 'lucide-react';

interface LogEntryProps {
    log: {
        id: string;
        timestamp: Date | string;
        level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
        context: string;
        message: string;
        metadata?: Record<string, any>;
    };
}

const getLevelColor = (level: string) => {
    switch (level) {
        case 'INFO':
            return '#9df425';
        case 'WARN':
            return '#ff8c00';
        case 'ERROR':
            return '#ff0000';
        case 'DEBUG':
            return 'rgba(255,255,255,0.3)';
        default:
            return '#ffffff';
    }
};

const getLevelIcon = (level: string) => {
    switch (level) {
        case 'INFO':
            return <Info className="w-3 h-3" />;
        case 'WARN':
            return <AlertTriangle className="w-3 h-3" />;
        case 'ERROR':
            return <XCircle className="w-3 h-3" />;
        case 'DEBUG':
            return <Activity className="w-3 h-3" />;
        default:
            return null;
    }
};

export function LogEntry({ log }: LogEntryProps) {
    const color = getLevelColor(log.level);
    const icon = getLevelIcon(log.level);

    // Backend provides ISO string, frontend mock might provide Date
    const timestamp = typeof log.timestamp === 'string'
        ? new Date(log.timestamp)
        : log.timestamp;

    const formattedTime = timestamp instanceof Date && !isNaN(timestamp.getTime())
        ? timestamp.toISOString().replace('T', ' ').slice(0, 19)
        : 'INVALID_DATE';

    return (
        <div className="group hover:bg-white/[0.04] transition-all duration-300 border-b border-white/5 last:border-0 px-6 py-2.5 relative">
            {/* Intensity Hover Marker */}
            <div className="absolute left-0 top-0 w-[2px] h-full bg-[#9df425] scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" style={{ backgroundColor: color }}></div>

            <div className="flex items-center gap-6 font-mono">
                {/* Timestamp */}
                <div className="text-[10px] text-white/20 tracking-tighter min-w-[150px] tabular-nums">
                    [{formattedTime}]
                </div>

                {/* Level Badge */}
                <div
                    className={cn(
                        'flex items-center gap-2 px-2.5 py-0.5 rounded-none border-l-2 min-w-[90px] justify-center',
                        'text-[8px] uppercase tracking-[0.25em] font-bold'
                    )}
                    style={{
                        color: color,
                        borderColor: color,
                        backgroundColor: `${color}08`,
                    }}
                >
                    <span className="opacity-60">{icon}</span>
                    {log.level}
                </div>

                {/* Module */}
                <div className="text-[9px] text-[#ff8c00]/60 uppercase tracking-[0.3em] font-bold min-w-[100px]">
                    :: {log.context}_CORE
                </div>

                {/* Message */}
                <div className="flex-1 text-[11px] text-white/70 leading-none truncate group-hover:text-white transition-colors">
                    {log.message}
                </div>

                {/* Action Indicator */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono cursor-pointer hover:text-white flex items-center gap-1">
                        VIEW_NODES <span className="text-[10px]">→</span>
                    </span>
                </div>
            </div>

            {/* Metadata (if present) */}
            {log.metadata && (
                <div className="mt-2 ml-[246px] text-[9px] text-white/30 font-mono bg-white/[0.02] p-2 border-l border-white/10 hidden group-hover:block animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="text-white/20 font-bold tracking-widest">PAYLOAD_JSON:</span>{' '}
                    {JSON.stringify(log.metadata, null, 2)}
                </div>
            )}
        </div>
    );
}

