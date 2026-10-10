import { memo } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { Tag, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type TagNodeData = { label?: string; action?: 'ADD' | 'REMOVE'; tags?: string[]; configured?: boolean };

export const TagNode = memo(({ data, selected }: NodeProps<Node<TagNodeData>>) => {
    return (
        <div
            className={cn(
                "relative flex flex-col items-center justify-center w-[180px] p-3 rounded-lg border bg-[#0a0a0a] transition-all duration-200",
                selected ? "border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "border-white/10 hover:border-white/30"
            )}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-white/20 border-2 border-[#0a0a0a] top-[-6px]"
            />

            <div className="flex items-center gap-3 w-full">
                <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border",
                    data.action === 'REMOVE'
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                )}>
                    {data.action === 'REMOVE' ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
                        {data.action === 'REMOVE' ? 'REMOVE TAG' : 'ADD TAG'}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                        {data.tags?.join(', ') || 'Select Tags'}
                    </span>
                </div>
            </div>

            <div className="absolute top-2 right-2 opacity-20">
                <Tag className="w-4 h-4" />
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-[#3b82f6] border-2 border-[#0a0a0a] bottom-[-6px]"
            />
        </div>
    );
});

TagNode.displayName = 'TagNode';
