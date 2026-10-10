'use client';

import { useCallback, useState, useRef, useEffect, DragEvent } from 'react';
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
  NodeTypes,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';


import { StepLibrarySidebar } from './step-library-sidebar';
import { ConfigurationPanel } from './configuration-panel';
import {
  StartNode,
  SendEmailNode,
  DelayNode,
  ConditionNode,
  ExitNode,
  BranchNode,
  TagNode,
} from './workflow-nodes';

// Node type definitions for React Flow
const nodeTypes: NodeTypes = {
  startNode: StartNode as any,
  sendEmailNode: SendEmailNode as any,
  delayNode: DelayNode as any,
  conditionNode: ConditionNode as any,
  exitNode: ExitNode as any,
  branchNode: BranchNode as any,
  tagNode: TagNode as any,
};

// Initial setup with start node
const initialNodes: Node[] = [
  {
    id: 'start-1',
    type: 'startNode',
    data: {
      label: 'Workflow starts here',
      triggerType: 'Event'
    },
    position: { x: 250, y: 50 },
  },
];

const initialEdges: Edge[] = [];

let nodeId = 1;

interface WorkflowBuilderProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onChange?: (data: { nodes: Node[]; edges: Edge[] }) => void;
  tenant?: string;
}


export function WorkflowBuilder({
  initialNodes: propInitialNodes,
  initialEdges: propInitialEdges,
  onChange,
  tenant,
  readOnly = false,
}: WorkflowBuilderProps & { readOnly?: boolean } = {}) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(propInitialNodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(propInitialEdges || initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Notify parent of changes
  useEffect(() => {
    if (onChange && !readOnly) {
      onChange({ nodes, edges });
    }
  }, [nodes, edges, onChange, readOnly]);

  // Handle node click - open configuration panel
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (!readOnly) {
      setSelectedNode(node);
    }
  }, [readOnly]);

  // Handle node update from configuration panel
  const handleNodeUpdate = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    );
  }, [setNodes]);

  // Handle connection creation
  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return;
      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        style: { stroke: '#ff8c00', strokeWidth: 2 }
      }, eds));
    },
    [setEdges, readOnly]
  );

  // Handle drag over canvas (for drop zone)
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop - create new node
  const onDrop = useCallback(
    (event: DragEvent) => {
      if (readOnly) return;
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (!type || !reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      nodeId++;
      const newNodeId = `${type}-${nodeId}`;

      // Create node data based on type
      let nodeData: any = {};
      let nodeType = '';

      switch (type) {
        case 'sendEmail':
          nodeType = 'sendEmailNode';
          nodeData = {
            label: 'CONFIGURE_TRANSMISSION',
            configured: false,
          };
          break;
        case 'delay':
          nodeType = 'delayNode';
          nodeData = {
            label: 'TEMPORAL_BUFFER',
            configured: false,
          };
          break;
        case 'condition':
          nodeType = 'conditionNode';
          nodeData = {
            label: 'LOGIC_GATEWAY',
            configured: false,
          };
          break;
        case 'exit':
          nodeType = 'exitNode';
          nodeData = {
            label: 'PROCESS_TERMINATED',
          };
          break;
        default:
          return;
      }

      const newNode: Node = {
        id: newNodeId,
        type: nodeType,
        position,
        data: nodeData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, readOnly]
  );

  // Close configuration panel
  const handleCloseConfig = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Handle pane click - deselect node
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="flex h-full bg-[#050505] border border-white/5 backdrop-blur-3xl relative overflow-hidden">
      {/* Left Sidebar - Step Library */}
      {!readOnly && (
        <div className="w-64 border-r border-white/5 bg-white/[0.02] backdrop-blur-xl z-10 transition-all duration-500">
          <StepLibrarySidebar />
        </div>
      )}

      {/* Center - Canvas */}
      <div
        ref={reactFlowWrapper}
        className="flex-1 relative"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
          fitView
          attributionPosition="bottom-left"
          className="bg-transparent"
        >
          <Background
            variant={BackgroundVariant.Lines}
            gap={24}
            size={1}
            color="#ffffff05"
          />
          <Controls
            className="bg-[#0a0a0a] border border-white/5 rounded-none p-1 fill-white shadow-2xl"
          />
          <MiniMap
            className="bg-[#0a0a0a] border border-white/5 rounded-none"
            nodeColor={(node) => {
              switch (node.type) {
                case 'startNode':
                  return '#9df425';
                case 'sendEmailNode':
                  return '#3b82f6';
                case 'delayNode':
                  return '#ff8c00';
                case 'conditionNode':
                  return '#8b5cf6';
                case 'exitNode':
                  return '#9df425';
                default:
                  return '#ffffff22';
              }
            }}
            maskColor="rgb(0, 0, 0, 0.7)"
          />
        </ReactFlow>

        {readOnly && (
          <div className="absolute top-4 right-4 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a]/80 border border-[#9df425]/30 rounded-none backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-[#9df425] animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#9df425] uppercase">MONITOR_MODE_ACTIVE</span>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Panel (Conditional) */}
      {selectedNode && !readOnly && (
        <div className="w-80 border-l border-white/5 bg-[#0a0a0a]/90 backdrop-blur-2xl z-10 animate-in slide-in-from-right duration-300">
          <ConfigurationPanel
            selectedNode={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={handleNodeUpdate}
          />
        </div>
      )}
    </div>
  );
}
