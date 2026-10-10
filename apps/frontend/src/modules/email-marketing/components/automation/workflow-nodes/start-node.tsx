import { memo } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

export type StartNodeData = {
  label: string;
  triggerType?: string;
};

function StartNode({ data, selected }: NodeProps<Node<StartNodeData>>) {
  return (
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
            <Zap className="w-4 h-4 text-green-600" />
          </div>
          <span className="font-semibold text-sm">Trigger Start</span>
        </div>

        {/* Content */}
        <div className="text-sm text-muted-foreground">
          {data.label}
        </div>

        {/* Badge */}
        {data.triggerType && (
          <Badge variant="outline" className="text-xs">
            {data.triggerType}
          </Badge>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </Card>
  );
}

export default memo(StartNode);
