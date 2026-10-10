import { memo } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export type ExitNodeData = {
  label: string;
  reason?: string;
};

function ExitNode({ data, selected }: NodeProps<Node<ExitNodeData>>) {
  return (
    <>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />

      <Card 
        className={`min-w-[200px] transition-all ${
          selected 
            ? 'ring-2 ring-primary shadow-lg' 
            : 'hover:shadow-md'
        }`}
      >
        <div className="p-4 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <span className="font-semibold text-sm">Exit</span>
          </div>

          {/* Content */}
          <div className="text-sm text-muted-foreground">
            {data.label}
          </div>

          {/* Reason if provided */}
          {data.reason && (
            <div className="text-xs text-muted-foreground italic">
              {data.reason}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

export default memo(ExitNode);
