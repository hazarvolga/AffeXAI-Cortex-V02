'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Trash2, Copy, Activity, Zap, Cpu, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSignalEmitter, SignalSource, SignalType } from '@/hooks/useSignalEmitter';
import type { FormBlockType } from '@affexai/shared-types';

export interface FormBlock {
    id: string;
    type: FormBlockType;
    label?: string;
    properties: Record<string, any>;
    styles: Record<string, any>;
}

export interface FormColumn {
    id: string;
    width: string;
    blocks: FormBlock[];
}

export interface FormRow {
    id: string;
    type: 'section';
    columns: FormColumn[];
    settings: Record<string, any>;
}

export interface VisibilityRule {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'empty' | 'not_empty';
    value: any;
}

export interface LogicConfig {
    rules: {
        blockId: string;
        conditions: VisibilityRule[];
        action: 'show' | 'hide';
    }[];
}

export interface FormStructure {
    rows: FormRow[];
    settings: {
        theme?: string;
        submitButtonText?: string;
        width?: string;
    };
    logicConfig?: LogicConfig;
}

export function FormBuilderCanvas({
    structure,
    onStructureChange,
    selectedBlock,
    onBlockSelect,
    previewMode,
}: {
    structure: FormStructure;
    onStructureChange: (structure: FormStructure) => void;
    selectedBlock: any;
    onBlockSelect: (block: any) => void;
    previewMode: 'desktop' | 'mobile';
}) {
    const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null);
    const [mockFormValues, setMockFormValues] = useState<Record<string, any>>({});
    const { emitInteraction, emitSignal } = useSignalEmitter();

    const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Default props generator
    const getDefaultProperties = (type: string) => {
        switch (type) {
            case 'input': return { label: 'TEXT_INPUT', placeholder: 'TYPE_HERE...', required: false };
            case 'textarea': return { label: 'BLOCK_CONTENT', placeholder: 'DESCRIBE_DETAILS...', rows: 4, required: false };
            case 'select': return { label: 'PICK_OPTION', options: ['Alpha', 'Beta'] };
            case 'checkbox': return { label: 'CONFIRM_DATA', required: true };
            case 'radio': return { label: 'SELECT_NODE', options: ['Active', 'Static'], required: false };
            case 'heading': return { text: 'SECTION_HEADER', level: 'h2' };
            default: return {};
        }
    };

    const handleDrop = (e: React.DragEvent, rowIndex?: number) => {
        e.preventDefault();
        setDragOverRowIndex(null);

        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        const blockData = JSON.parse(data);

        // Create new row with block
        const newRow: FormRow = {
            id: generateId(),
            type: 'section',
            columns: [
                {
                    id: generateId(),
                    width: '100%',
                    blocks: [
                        {
                            id: generateId(),
                            type: blockData.type,
                            properties: getDefaultProperties(blockData.type),
                            styles: { padding: '10px' },
                        },
                    ],
                },
            ],
            settings: {},
        };

        const newRows = [...structure.rows];
        if (rowIndex !== undefined) {
            newRows.splice(rowIndex + 1, 0, newRow);
        } else {
            newRows.push(newRow);
        }

        onStructureChange({
            ...structure,
            rows: newRows,
        });
    };

    const handleDeleteRow = (rowIndex: number) => {
        const newRows = structure.rows.filter((_, i) => i !== rowIndex);
        onStructureChange({
            ...structure,
            rows: newRows,
        });
    };

    const handleDuplicateRow = (rowIndex: number) => {
        const rowToDuplicate = structure.rows[rowIndex];
        const duplicatedRow = JSON.parse(JSON.stringify(rowToDuplicate));
        duplicatedRow.id = generateId();
        duplicatedRow.columns = duplicatedRow.columns.map((col: FormColumn) => ({
            ...col,
            id: generateId(),
            blocks: col.blocks.map((block: FormBlock) => ({
                ...block,
                id: generateId(),
            })),
        }));

        const newRows = [...structure.rows];
        newRows.splice(rowIndex + 1, 0, duplicatedRow);
        onStructureChange({
            ...structure,
            rows: newRows,
        });
    };

    // --- Logic Engine Evaluation ---
    const checkVisibility = (blockId: string, logicConfig?: LogicConfig): boolean => {
        if (!logicConfig || !logicConfig.rules) return true;

        const rule = logicConfig.rules.find(r => r.blockId === blockId);
        if (!rule) return true;

        const allConditionsMet = rule.conditions.every(condition => {
            const currentValue = mockFormValues[condition.fieldId];

            switch (condition.operator) {
                case 'equals': return currentValue === condition.value;
                case 'not_equals': return currentValue !== condition.value;
                case 'contains': return Array.isArray(currentValue) ? currentValue.includes(condition.value) : String(currentValue).includes(condition.value);
                case 'empty': return !currentValue;
                case 'not_empty': return !!currentValue;
                default: return true;
            }
        });

        return rule.action === 'show' ? allConditionsMet : !allConditionsMet;
    };

    const canvasWidth = previewMode === 'mobile' ? '375px' : structure.settings.width || '600px';

    return (
        <div className="w-full h-full pb-20 flex justify-center bg-[#050505]">
            <div
                className="transition-all duration-300 relative group/canvas"
                style={{ width: canvasWidth, maxWidth: '100%' }}
            >
                {/* CANVAS GLOW EFFECT */}
                <div className="absolute -inset-20 bg-[#ff8c00]/5 blur-[120px] rounded-full opacity-50 pointer-events-none"></div>

                <Card className="bg-[#0c0c0c] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 min-h-[700px] flex flex-col relative z-10 overflow-hidden">
                    {/* CANVAS HEADER DECORATION */}
                    <div className="h-12 border-b border-white/5 bg-white/[0.02] flex items-center px-6 justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-white/10"></div>
                                <div className="w-2 h-2 rounded-full bg-white/10"></div>
                                <div className="w-2 h-2 rounded-full bg-white/10"></div>
                            </div>
                        </div>
                        <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Canvas // Sandbox_Mode</div>
                    </div>

                    {/* Form Container */}
                    <div
                        onDrop={(e) => handleDrop(e)}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverRowIndex(null);
                        }}
                        className="p-12 space-y-8 flex-1 scrollbar-hide"
                    >
                        {structure.rows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01] group/empty hover:border-[#ff8c00]/20 transition-all duration-500">
                                <div className="bg-white/5 p-6 rounded-full mb-6 relative group-hover/empty:scale-110 transition-transform">
                                    <Plus className="w-10 h-10 text-white/10 group-hover/empty:text-[#ff8c00] transition-colors" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">
                                        Orchestration_Standby
                                    </p>
                                    <p className="text-[10px] text-white/10 font-mono uppercase tracking-widest leading-relaxed">
                                        Drag_Components_From_Portal<br />To_Initialize_Nodes
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {structure.rows.map((row, rowIndex) => (
                                    <div key={row.id} className="relative group/row">
                                        {/* Drop Zone Before Row */}
                                        <div
                                            className={cn(
                                                'absolute -top-4 left-0 w-full h-8 flex items-center justify-center transition-opacity z-10 opacity-0 px-4',
                                                dragOverRowIndex === rowIndex && 'opacity-100'
                                            )}
                                            onDrop={(e) => {
                                                e.stopPropagation();
                                                handleDrop(e, rowIndex - 1);
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDragOverRowIndex(rowIndex);
                                            }}
                                            onDragLeave={() => setDragOverRowIndex(null)}
                                        >
                                            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#ff8c00]/40 to-transparent relative">
                                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#ff8c00] w-1.5 h-1.5 rounded-full shadow-[0_0_10px_#ff8c00]"></div>
                                            </div>
                                        </div>

                                        {/* Row Content */}
                                        <div className={cn(
                                            "relative p-4 rounded-3xl border border-transparent hover:border-white/5 group-hover/row:bg-white/[0.01] transition-all duration-300",
                                            selectedBlock?.id === row.id && "border-[#ff8c00]/20 bg-[#ff8c00]/5"
                                        )}>
                                            {/* Controls */}
                                            <div className="absolute -right-14 top-0 opacity-0 group-hover/row:opacity-100 transition-all flex flex-col gap-2 p-2 bg-[#121212] border border-white/5 rounded-2xl shadow-xl z-20 translate-x-4 group-hover/row:translate-x-0">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all" onClick={() => handleDuplicateRow(rowIndex)}>
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all" onClick={() => handleDeleteRow(rowIndex)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>

                                            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${row.columns.length}, 1fr)` }}>
                                                {row.columns.map((column) => (
                                                    <div key={column.id} className="min-h-[40px]">
                                                        {column.blocks.map((block) => {
                                                            // Logic Engine Implementation
                                                            const isVisible = checkVisibility(block.id, structure.logicConfig);

                                                            return (
                                                                <div
                                                                    key={block.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onBlockSelect(block);
                                                                        emitInteraction(SignalSource.FORM, `Block Selected: ${block.type}`, { blockId: block.id });
                                                                    }}
                                                                    className={cn(
                                                                        "relative cursor-pointer transition-all duration-500 group/block",
                                                                        selectedBlock?.id === block.id && "ring-1 ring-[#ff8c00]/40 bg-[#ff8c00]/[0.02] rounded-2xl",
                                                                        !isVisible && "opacity-20 blur-[1px] grayscale border-dashed border border-white/10 rounded-2xl"
                                                                    )}
                                                                >
                                                                    {selectedBlock?.id === block.id && (
                                                                        <div className="absolute -top-2 left-6 px-2 py-0.5 bg-[#ff8c00] text-[8px] font-bold text-black uppercase tracking-widest rounded-sm z-20">
                                                                            Active_Node
                                                                        </div>
                                                                    )}

                                                                    {!isVisible && (
                                                                        <div className="absolute top-2 right-4 flex items-center px-1.5 py-0.5 bg-white/5 border border-white/5 rounded font-mono text-[8px] text-white/40 z-10">
                                                                            <Zap className="w-2.5 h-2.5 mr-1" /> HIDDEN_LOGIC
                                                                        </div>
                                                                    )}
                                                                    <div className="p-4 border border-transparent group-hover/block:border-white/5 rounded-2xl transition-all">
                                                                        <FormBlockRenderer block={block} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* AMBIENT SIGNAL LINES */}
                <div className="absolute -left-12 top-1/4 w-px h-64 bg-gradient-to-b from-transparent via-[#ff8c00]/20 to-transparent"></div>
                <div className="absolute -right-12 top-2/3 w-px h-32 bg-gradient-to-b from-transparent via-[#9df425]/20 to-transparent"></div>
            </div>
        </div>
    );
}

function FormBlockRenderer({ block }: { block: FormBlock }) {
    const { label, placeholder, required, options, text, level } = block.properties;

    switch (block.type) {
        case 'heading':
            const Tag = (level || 'h2') as any;
            return (
                <div className="group/header mb-6">
                    <Tag className="font-bold text-white uppercase tracking-tighter text-xl border-b border-white/5 pb-3">
                        <span className="text-[#ff8c00] mr-2 opacity-50">#</span>
                        {text}
                    </Tag>
                </div>
            );

        case 'text':
            return (
                <div className="mb-6">
                    <p className="text-white/40 text-[11px] font-medium leading-relaxed uppercase tracking-wide">
                        {text}
                    </p>
                </div>
            );

        case 'input':
            return (
                <div className="mb-6 space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] flex items-center gap-2">
                        <Cpu className="w-3 h-3 text-[#ff8c00] opacity-40" />
                        {label} {required && <span className="text-[#ff8c00]">*</span>}
                    </label>
                    <div className="relative group/input">
                        <div className="absolute inset-0 bg-[#ff8c00]/5 rounded-xl opacity-0 group-hover/input:opacity-100 transition-opacity"></div>
                        <input
                            type="text"
                            disabled
                            placeholder={placeholder}
                            className="w-full h-11 px-4 bg-white/[0.02] border border-white/5 rounded-xl text-white placeholder:text-white/10 text-xs font-mono tracking-widest relative z-10 transition-all focus:border-[#ff8c00]/30"
                        />
                    </div>
                </div>
            );

        case 'textarea':
            return (
                <div className="mb-6 space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] flex items-center gap-2">
                        <Activity className="w-3 h-3 text-[#ff8c00] opacity-40" />
                        {label} {required && <span className="text-[#ff8c00]">*</span>}
                    </label>
                    <textarea
                        disabled
                        rows={block.properties.rows || 3}
                        placeholder={placeholder}
                        className="w-full p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-white placeholder:text-white/10 text-xs font-mono tracking-widest transition-all"
                    />
                </div>
            );

        case 'select':
            return (
                <div className="mb-6 space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] flex items-center gap-2">
                        <GripVertical className="w-3 h-3 text-[#ff8c00] opacity-40 rotate-90" />
                        {label} {required && <span className="text-[#ff8c00]">*</span>}
                    </label>
                    <div className="relative">
                        <select disabled className="w-full h-11 px-4 bg-white/[0.02] border border-white/5 rounded-xl text-white/40 appearance-none text-xs font-mono tracking-widest">
                            <option>{placeholder || 'SELECT_NODE_DATA...'}</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Plus className="w-3 h-3 text-white/20 rotate-45" />
                        </div>
                    </div>
                </div>
            );

        case 'checkbox':
            return (
                <div className="mb-6 flex items-center gap-3 group/check bg-white/[0.01] p-3 rounded-xl border border-transparent hover:border-white/5 transition-all">
                    <div className="w-5 h-5 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center transition-colors group-hover/check:border-[#ff8c00]/30">
                        {required && <div className="w-2 h-2 rounded-sm bg-[#ff8c00]/40"></div>}
                    </div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest cursor-pointer group-hover:text-white/60 transition-colors">
                        {label}
                    </label>
                </div>
            );

        case 'radio':
            return (
                <div className="mb-6 space-y-4 bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">
                        {label}
                    </label>
                    <div className="space-y-2">
                        {options?.map((opt: string) => (
                            <div key={opt} className="flex items-center gap-3 group/radio p-1.5 rounded-lg hover:bg-white/[0.02] transition-all">
                                <div className="w-4 h-4 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center group-hover/radio:border-[#ff8c00]/40 transition-all">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/5"></div>
                                </div>
                                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{opt}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'button':
            return (
                <div className="mt-10">
                    <Button className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] shadow-[0_0_30px_rgba(255,255,255,0.05)] active:scale-95 transition-all">
                        <MousePointer2 className="w-4 h-4 mr-2" />
                        {block.properties.text || 'EXECUTE_SIGNAL'}
                    </Button>
                </div>
            );

        default:
            return <div className="p-4 border border-dashed border-white/5 rounded-2xl text-[9px] font-mono text-white/20 uppercase tracking-widest">ERR: UNIDENTIFIED_NODE_TYPE_{block.type}</div>;
    }
}
