import { Node, Edge } from '@xyflow/react';
import { TriggerType } from '@/types/automation';

export interface StrategicTemplate {
    id: string;
    name: string;
    description: string;
    category: 'ONBOARDING' | 'RETENTION' | 'NURTURE' | 'VIP';
    triggerType: TriggerType;
    nodes: Node[];
    edges: Edge[];
}

export const STRATEGIC_TEMPLATES: StrategicTemplate[] = [
    {
        id: 'WELCOME_RESONANCE',
        name: 'WELCOME_RESONANCE',
        description: 'Establish brand alignment with new nodes immediately upon entry.',
        category: 'ONBOARDING',
        triggerType: TriggerType.EVENT,
        nodes: [
            { id: '1', type: 'startNode', position: { x: 250, y: 50 }, data: { label: 'SIGNAL_DETECTED: NEW_SUBSCRIBER' } },
            { id: '2', type: 'delayNode', position: { x: 250, y: 150 }, data: { label: 'WAIT: 5_MINUTES', duration: 300 } },
            { id: '3', type: 'sendEmailNode', position: { x: 250, y: 250 }, data: { label: 'TRANSMISSION: VISION_ALIGNMENT' } },
            { id: '4', type: 'delayNode', position: { x: 250, y: 350 }, data: { label: 'WAIT: 48_HOURS', duration: 172800 } },
            { id: '5', type: 'conditionNode', position: { x: 250, y: 450 }, data: { label: 'CHECK: RESONANCE_SCORE > 50' } },
            { id: '6', type: 'sendEmailNode', position: { x: 100, y: 550 }, data: { label: 'VIP_RD: FOUNDER_NOTE' } },
            { id: '7', type: 'sendEmailNode', position: { x: 400, y: 550 }, data: { label: 'STANDARD_RD: VALUE_PROP' } },
        ],
        edges: [
            { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#9df425' } },
            { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#9df425' } },
            { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#9df425' } },
            { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#9df425' } },
            { id: 'e5-6', source: '5', target: '6', label: 'HIGH_RESONANCE', animated: true, style: { stroke: '#9df425' } },
            { id: 'e5-7', source: '5', target: '7', label: 'LOW_RESONANCE', animated: true, style: { stroke: '#ffffff40' } },
        ]
    },
    {
        id: 'LEAD_VELOCITY',
        name: 'LEAD_VELOCITY',
        description: 'Accelerate potential leads through authority-building transmissions.',
        category: 'NURTURE',
        triggerType: TriggerType.ATTRIBUTE,
        nodes: [
            { id: '1', type: 'startNode', position: { x: 250, y: 50 }, data: { label: 'SEGMENT_ENTRY: LEAD' } },
            { id: '2', type: 'sendEmailNode', position: { x: 250, y: 150 }, data: { label: 'TRANSMISSION: AUTHORITY_PIECE_1' } },
            { id: '3', type: 'delayNode', position: { x: 250, y: 250 }, data: { label: 'WAIT: 24_HOURS', duration: 86400 } },
            { id: '4', type: 'sendEmailNode', position: { x: 250, y: 350 }, data: { label: 'TRANSMISSION: CASE_STUDY_DEEP_DIVE' } },
            { id: '5', type: 'conditionNode', position: { x: 250, y: 450 }, data: { label: 'CHECK: LINK_CLICKED?' } },
            { id: '6', type: 'exitNode', position: { x: 250, y: 600 }, data: { label: 'ALERT_SALES_TEAM' } },
        ],
        edges: [
            { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#ff8c00' } },
            { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#ff8c00' } },
            { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#ff8c00' } },
            { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#ff8c00' } },
            { id: 'e5-6', source: '5', target: '6', label: 'SIGNAL_RECEIVED', animated: true, style: { stroke: '#9df425' } },
        ]
    }
];
