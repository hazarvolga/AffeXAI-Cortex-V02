'use client';

import { useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Mail, 
  Clock, 
  GitBranch, 
  XCircle,
  Info 
} from 'lucide-react';

// Test için basit node'lar
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: '🎯 Start (Trigger)' },
    position: { x: 250, y: 0 },
    style: {
      background: '#10b981',
      color: 'white',
      border: '2px solid #059669',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '14px',
      fontWeight: 600,
    },
  },
  {
    id: '2',
    data: { label: '📧 Send Welcome Email', type: 'email' },
    position: { x: 250, y: 100 },
    style: {
      background: 'white',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '14px',
    },
  },
  {
    id: '3',
    data: { label: '⏰ Wait 2 Days', type: 'delay' },
    position: { x: 250, y: 200 },
    style: {
      background: 'white',
      border: '2px solid #f59e0b',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '14px',
    },
  },
  {
    id: '4',
    data: { label: '❓ Did User Open Email?', type: 'condition' },
    position: { x: 250, y: 300 },
    style: {
      background: 'white',
      border: '2px solid #8b5cf6',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '14px',
    },
  },
  {
    id: '5',
    data: { label: '📧 Send Follow-up', type: 'email' },
    position: { x: 100, y: 420 },
    style: {
      background: 'white',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
    },
  },
  {
    id: '6',
    type: 'output',
    data: { label: '✓ End (Success)' },
    position: { x: 400, y: 420 },
    style: {
      background: '#10b981',
      color: 'white',
      border: '2px solid #059669',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '14px',
    },
  },
];

const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 }
  },
  { 
    id: 'e2-3', 
    source: '2', 
    target: '3',
    style: { stroke: '#3b82f6', strokeWidth: 2 }
  },
  { 
    id: 'e3-4', 
    source: '3', 
    target: '4',
    style: { stroke: '#f59e0b', strokeWidth: 2 }
  },
  { 
    id: 'e4-5', 
    source: '4', 
    target: '5',
    label: 'No',
    style: { stroke: '#8b5cf6', strokeWidth: 2 }
  },
  { 
    id: 'e4-6', 
    source: '4', 
    target: '6',
    label: 'Yes',
    style: { stroke: '#8b5cf6', strokeWidth: 2 }
  },
];

export function WorkflowBuilderTest() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        style: { strokeWidth: 2 }
      }, eds));
    },
    [setEdges]
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflow Builder - Test</h1>
          <p className="text-muted-foreground mt-1">
            React Flow minimal test - Drag nodes, connect them, zoom/pan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50">
            <Zap className="w-3 h-3 mr-1" />
            React Flow Active
          </Badge>
        </div>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Test Instructions</h3>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>✅ <strong>Drag nodes</strong> around the canvas</li>
              <li>✅ <strong>Scroll to zoom</strong> in/out</li>
              <li>✅ <strong>Pan</strong> by dragging the background</li>
              <li>✅ <strong>Connect</strong> nodes by dragging from handles</li>
              <li>✅ <strong>Select</strong> nodes and edges by clicking</li>
              <li>✅ Use <strong>minimap</strong> for navigation (bottom right)</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Step Legend */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Step Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-green-600" />
            <span>Trigger/Start</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Send Email</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Delay</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <GitBranch className="w-4 h-4 text-purple-600" />
            <span>Condition</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="w-4 h-4 text-green-600" />
            <span>Exit/End</span>
          </div>
        </div>
      </Card>

      {/* React Flow Canvas */}
      <Card className="overflow-hidden" style={{ height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={12} 
            size={1} 
          />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              if (node.type === 'input') return '#10b981';
              if (node.type === 'output') return '#10b981';
              return '#ffffff';
            }}
            maskColor="rgb(240, 240, 240, 0.6)"
          />
        </ReactFlow>
      </Card>

      {/* Status */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Nodes: <strong>{nodes.length}</strong> | 
          Edges: <strong className="ml-1">{edges.length}</strong>
        </div>
        <div className="text-green-600 font-medium">
          ✓ React Flow working correctly
        </div>
      </div>
    </div>
  );
}
