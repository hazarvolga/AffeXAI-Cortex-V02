'use client';

import { List, type RowComponentProps } from 'react-window';
import { LogEntry } from './LogEntry';
import { Loader2 } from 'lucide-react';

interface LogsConsoleProps {
    logs: Array<{
        id: string;
        timestamp: Date | string;
        level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
        context: string;
        message: string;
        metadata?: Record<string, any>;
    }>;
    loading?: boolean;
}

function LogRow({ index, style, ariaAttributes, logs }: RowComponentProps<{ logs: LogsConsoleProps['logs'] }>) {
    return (
        <div style={style} {...ariaAttributes}>
            <LogEntry log={logs[index]} />
        </div>
    );
}

export function LogsConsole({ logs, loading }: LogsConsoleProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[600px] bcc-glass border-none">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 blur-xl opacity-20 bg-[#9df425] animate-pulse"></div>
                        <Loader2 className="w-10 h-10 animate-spin text-[#9df425] relative z-10" />
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-[#9df425] font-mono animate-pulse">
                        SYNCHRONIZING_EVENT_STREAM...
                    </div>
                </div>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="flex items-center justify-center h-[600px] bcc-glass border-none">
                <div className="text-center">
                    <div className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-mono">
                        FREQUENCY_QUIESCENCE_REACHED
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.2em] text-[#9df425]/40 font-mono mt-4">
                        [ NEURAL GRID CLEAR ]
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[600px] bcc-glass border-none overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-px opacity-10 bg-[#9df425]"></div>
            <List
                rowComponent={LogRow}
                rowProps={{ logs }}
                rowCount={logs.length}
                rowHeight={36}
                defaultHeight={600}
                style={{ height: '100%', width: '100%' }}
                className="scrollbar-hide"
            />
        </div>
    );
}
