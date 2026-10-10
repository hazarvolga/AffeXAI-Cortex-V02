'use client';

import { Card } from '@/components/ui/card';
import { Type, AlignLeft, CheckSquare, List, MousePointerClick, Hash, Heading, Layout } from 'lucide-react';

const FORM_BLOCKS = [
    {
        category: 'FOUNDATION_FIELDS',
        items: [
            { type: 'input', label: 'STRING_INPUT', icon: Type, description: 'Short responses' },
            { type: 'textarea', label: 'BLOCK_TEXT', icon: AlignLeft, description: 'Long descriptions' },
            { type: 'heading', label: 'HEADER_TAG', icon: Heading, description: 'Section title' },
            { type: 'text', label: 'DESC_LABEL', icon: AlignLeft, description: 'Helper text' },
        ]
    },
    {
        category: 'SELECTION_NODES',
        items: [
            { type: 'checkbox', label: 'TRUTH_VAL', icon: CheckSquare, description: 'Single validation' },
            { type: 'select', label: 'DROPDOWN_OP', icon: List, description: 'Selection list' },
            { type: 'radio', label: 'RADIO_GROUP', icon: MousePointerClick, description: 'Group choice' },
        ]
    },
    {
        category: 'ACTION_TRIGGERS',
        items: [
            { type: 'button', label: 'EXEC_BUTT', icon: MousePointerClick, description: 'Push Data' },
        ]
    }
];

export function FormBlockSidebar() {
    const handleDragStart = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="w-80 border-r border-white/5 bg-[#080808] h-full overflow-y-auto p-6 flex-shrink-0 relative">
            {/* AMBIENT SIGNAL */}
            <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>

            <div className="space-y-8 relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-2 rounded-full bg-[#ff8c00] animate-pulse"></div>
                    <div>
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Component_Library</h2>
                        <p className="text-[9px] text-white/30 font-mono uppercase tracking-widest">v1.2 // Neural Engine</p>
                    </div>
                </div>

                {FORM_BLOCKS.map((category) => (
                    <div key={category.category}>
                        <h3 className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <Layout className="w-3 h-3" />
                            {category.category}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {category.items.map((block) => (
                                <div
                                    key={block.type}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, block.type)}
                                    className="group relative flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl cursor-grab hover:border-[#ff8c00]/40 transition-all active:scale-95 active:cursor-grabbing overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#ff8c00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <block.icon className="w-5 h-5 text-white/40 group-hover:text-[#ff8c00] mb-2 transition-colors relative z-10" />
                                    <span className="text-[9px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider relative z-10">{block.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
