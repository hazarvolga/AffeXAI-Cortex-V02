'use client';

import React, { useMemo } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Orchestrator' }, type: 'input', style: { border: '1px solid #9df425', background: '#000', color: '#fff', borderRadius: '8px' } },
    { id: '2', position: { x: -100, y: 100 }, data: { label: 'Frontend-Specialist' }, style: { border: '1px solid #333', background: '#111', color: '#aaa', borderRadius: '8px' } },
    { id: '3', position: { x: 100, y: 100 }, data: { label: 'Backend-Specialist' }, style: { border: '1px solid #333', background: '#111', color: '#aaa', borderRadius: '8px' } },
    { id: '4', position: { x: 0, y: 200 }, data: { label: 'Test-Engineer' }, style: { border: '1px solid #333', background: '#111', color: '#aaa', borderRadius: '8px' } },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#9df425' } },
    { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#9df425' } },
    { id: 'e2-4', source: '2', target: '4', animated: false, style: { stroke: '#333' } },
    { id: 'e3-4', source: '3', target: '4', animated: false, style: { stroke: '#333' } },
];

export function AgentOrchestratorGraph() {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    // Note: In a real implementation, we would poll an API to update these nodes/edges based on active agents.

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
            >
                <Background color="#222" gap={20} variant={BackgroundVariant.Dots} />
                <Controls className="bg-black/50 border-white/10 text-white fill-white" />
            </ReactFlow>
        </div>
    );
}
