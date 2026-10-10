import { memo } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { GitFork, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type BranchNodeData = { label?: string; type?: 'CONDITION' | 'RANDOM_SPLIT'; configured?: boolean };

export const BranchNode = memo(({ data, selected }: NodeProps<Node<BranchNodeData>>) => {
    return (
        <div
            className={cn(
                "relative flex flex-col items-center justify-center w-[180px] p-3 rounded-lg border bg-[#0a0a0a] transition-all duration-200",
                selected ? "border-[#9df425] shadow-[0_0_15px_rgba(157,244,37,0.3)]" : "border-white/10 hover:border-white/30"
            )}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-white/20 border-2 border-[#0a0a0a] top-[-6px]"
            />

            <div className="flex items-center gap-3 w-full">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400">
                    <GitFork className="w-4 h-4" />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
                        {data.type === 'RANDOM_SPLIT' ? 'A/B SPLIT' : 'CONDITION'}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                        {data.label || 'Configure Logic'}
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

            {/* Dual Handles for Branching */}
            <div className="absolute -bottom-6 flex justify-between w-full px-4 text-[9px] font-mono font-bold tracking-widest uppercase">
                <span className="text-[#9df425]">TRUE / A</span>
                <span className="text-[#ff8c00]">FALSE / B</span>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                id="a"
                className="w-3 h-3 bg-[#9df425] border-2 border-[#0a0a0a] left-[25%] bottom-[-6px]"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="b"
                className="w-3 h-3 bg-[#ff8c00] border-2 border-[#0a0a0a] left-[75%] bottom-[-6px]"
            />
        </div>
    );
});

BranchNode.displayName = 'BranchNode';
