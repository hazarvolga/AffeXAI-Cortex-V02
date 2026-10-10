import { memo } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { Clock, CalendarClock, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';

type DelayNodeData = { label?: string; mode?: 'DURATION' | 'SPECIFIC_TIME' | 'EVENT'; configured?: boolean };

export const DelayNode = memo(({ data, selected }: NodeProps<Node<DelayNodeData>>) => {
    const getIcon = () => {
        switch (data.mode) {
            case 'SPECIFIC_TIME': return <CalendarClock className="w-4 h-4" />;
            case 'EVENT': return <MousePointerClick className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getLabelPrefix = () => {
        switch (data.mode) {
            case 'SPECIFIC_TIME': return 'WAIT UNTIL';
            case 'EVENT': return 'WAIT FOR';
            default: return 'DELAY';
        }
    };

    return (
        <div
            className={cn(
                "relative flex flex-col items-center justify-center w-[180px] p-3 rounded-lg border bg-[#0a0a0a] transition-all duration-200",
                selected ? "border-[#ff8c00] shadow-[0_0_15px_rgba(255,140,0,0.3)]" : "border-white/10 hover:border-white/30"
            )}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-white/20 border-2 border-[#0a0a0a] top-[-6px]"
            />

            <div className="flex items-center gap-3 w-full">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400">
                    {getIcon()}
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
                        {getLabelPrefix()}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                        {data.label || 'Configure Delay'}
                    </span>
                </div>
            </div>

            {data.configured === false && (
                <div className="absolute -top-1 -right-1">
                    <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                </div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-[#ff8c00] border-2 border-[#0a0a0a] bottom-[-6px]"
            />
        </div>
    );
});

DelayNode.displayName = 'DelayNode';
