import { memo } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';

export type SendEmailNodeData = {
  label: string;
  templateId?: string;
  subject?: string;
  configured?: boolean;
};

function SendEmailNode({ data, selected }: NodeProps<Node<SendEmailNodeData>>) {
  return (
    <>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
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
              <div className="p-1.5 bg-blue-100 rounded">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-semibold text-sm">Send Email</span>
            </div>
            {!data.configured && (
              <Badge variant="destructive" className="text-xs">
                Setup Required
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="text-sm text-muted-foreground">
            {data.subject || data.label}
          </div>

          {/* Template badge */}
          {data.templateId && (
            <Badge variant="outline" className="text-xs">
              Template: {data.templateId}
            </Badge>
          )}
        </div>
      </Card>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </>
  );
}

export default memo(SendEmailNode);
