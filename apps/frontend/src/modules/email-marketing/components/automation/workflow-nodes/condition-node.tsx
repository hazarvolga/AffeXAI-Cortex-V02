import { memo } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch } from 'lucide-react';

export type ConditionNodeData = {
  label: string;
  condition?: string;
  field?: string;
  operator?: string;
  value?: string;
  configured?: boolean;
};

function ConditionNode({ data, selected }: NodeProps<Node<ConditionNodeData>>) {
  return (
    <>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded">
                <GitBranch className="w-4 h-4 text-purple-600" />
              </div>
              <span className="font-semibold text-sm">Condition</span>
            </div>
            {!data.configured && (
              <Badge variant="destructive" className="text-xs">
                Setup Required
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="text-sm text-muted-foreground">
            {data.condition || data.label}
          </div>

          {/* Condition details */}
          {data.field && data.operator && (
            <Badge variant="outline" className="text-xs">
              {data.field} {data.operator} {data.value}
            </Badge>
          )}
        </div>
      </Card>

      {/* Output Handles - True/False paths */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ left: '70%' }}
      />
    </>
  );
}

export default memo(ConditionNode);
