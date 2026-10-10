'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { FormBlock, LogicConfig, VisibilityRule } from './FormBuilderCanvas';
import { Trash2, Plus, Settings2, Zap, Layout, Sliders, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormPropertiesSidebarProps {
    selectedBlock: FormBlock | null;
    onUpdateBlock: (updatedBlock: FormBlock) => void;
    allBlocks: FormBlock[];
    logicConfig?: LogicConfig;
    onUpdateLogic: (newConfig: LogicConfig) => void;
}

export function FormPropertiesSidebar({
    selectedBlock,
    onUpdateBlock,
    allBlocks,
    logicConfig,
    onUpdateLogic
}: FormPropertiesSidebarProps) {
    if (!selectedBlock) {
        return (
            <div className="w-80 border-l border-white/5 bg-[#080808] h-full p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#ff8c00]/5 to-transparent pointer-events-none opacity-20"></div>
                <div className="bg-white/5 p-6 rounded-full mb-6 relative">
                    <Settings2 className="w-10 h-10 text-white/10" />
                </div>
                <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em]">Node_Not_Selected</h2>
                <p className="text-[9px] text-white/20 mt-2 font-mono uppercase tracking-widest">
                    Select_Component_To_View<br />Telemetry_Config
                </p>
            </div>
        );
    }

    const handleChange = (key: string, value: any) => {
        onUpdateBlock({
            ...selectedBlock,
            properties: {
                ...selectedBlock.properties,
                [key]: value,
            },
        });
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...(selectedBlock.properties.options || [])];
        newOptions[index] = value;
        handleChange('options', newOptions);
    };

    const addOption = () => {
        const newOptions = [...(selectedBlock.properties.options || []), `Option ${(selectedBlock.properties.options?.length || 0) + 1}`];
        handleChange('options', newOptions);
    };

    const removeOption = (index: number) => {
        const newOptions = selectedBlock.properties.options.filter((_: any, i: number) => i !== index);
        handleChange('options', newOptions);
    };

    return (
        <div className="w-80 border-l border-white/5 bg-[#080808] h-full overflow-y-auto flex-shrink-0 relative group">
            {/* AMBIENT SIGNAL */}
            <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>

            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white flex items-center gap-3">
                    <Sliders className="w-3.5 h-3.5 text-[#ff8c00]" />
                    Node_Configuration
                </h2>
                <p className="text-[9px] text-white/30 font-mono mt-1">ID: {selectedBlock.id.split('-').pop()}</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b border-white/5 bg-transparent px-6 h-12 gap-6">
                    <TabsTrigger value="general" className="data-[state=active]:text-[#ff8c00] data-[state=active]:border-b-2 data-[state=active]:border-[#ff8c00] rounded-none bg-transparent text-[10px] uppercase font-bold tracking-widest px-0 transition-all">Common</TabsTrigger>
                    <TabsTrigger value="logic" className="data-[state=active]:text-[#ff8c00] data-[state=active]:border-b-2 data-[state=active]:border-[#ff8c00] rounded-none bg-transparent text-[10px] uppercase font-bold tracking-widest px-0 transition-all">Neural_Logic</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="p-6 focus-visible:ring-0">
                    <div className="space-y-8">
                        {/* Common Properties */}
                        <div className="space-y-5">
                            {selectedBlock.properties.label !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-white/40">ENTRY_LABEL</Label>
                                    <Input
                                        value={selectedBlock.properties.label}
                                        onChange={(e) => handleChange('label', e.target.value)}
                                        className="bg-white/[0.03] border-white/5 text-white h-10 placeholder:text-white/5 rounded-xl font-mono text-[11px]"
                                        placeholder="Label text..."
                                    />
                                </div>
                            )}

                            {selectedBlock.properties.text !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-white/40">OUTPUT_TEXT</Label>
                                    <Input
                                        value={selectedBlock.properties.text}
                                        onChange={(e) => handleChange('text', e.target.value)}
                                        className="bg-white/[0.03] border-white/5 text-white h-10 placeholder:text-white/5 rounded-xl font-mono text-[11px]"
                                    />
                                </div>
                            )}

                            {selectedBlock.properties.placeholder !== undefined && (
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-white/40">INPUT_PROMPT</Label>
                                    <Input
                                        value={selectedBlock.properties.placeholder}
                                        onChange={(e) => handleChange('placeholder', e.target.value)}
                                        className="bg-white/[0.03] border-white/5 text-white h-10 placeholder:text-white/5 rounded-xl font-mono text-[11px]"
                                        placeholder="Ex: ENTER_DATA..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* Validation/Logic Area */}
                        <div className="pt-6 border-t border-white/5 space-y-5">
                            {selectedBlock.properties.required !== undefined && (
                                <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                                    <div className="space-y-0.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/60">Strict_Mode</Label>
                                        <p className="text-[8px] text-white/20 font-mono uppercase">Node_Validation_Required</p>
                                    </div>
                                    <Switch
                                        checked={selectedBlock.properties.required}
                                        onCheckedChange={(val) => handleChange('required', val)}
                                        className="data-[state=checked]:bg-[#ff8c00]"
                                    />
                                </div>
                            )}

                            {selectedBlock.type === 'textarea' && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Buffer_Depth (Rows)</Label>
                                    <Input
                                        type="number"
                                        value={selectedBlock.properties.rows || 4}
                                        onChange={(e) => handleChange('rows', parseInt(e.target.value))}
                                        className="bg-white/[0.03] border-white/5 text-white h-10 rounded-xl font-mono text-[11px]"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Options (for Select / Radio) */}
                        {(selectedBlock.type === 'select' || selectedBlock.type === 'radio') && (
                            <div className="pt-6 border-t border-white/5 space-y-5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Option_Registry</Label>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-[#ff8c00] hover:bg-[#ff8c00]/10 rounded-lg" onClick={addOption}>
                                        <Plus className="h-3.5 h-3.5" />
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {selectedBlock.properties.options?.map((option: string, index: number) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                value={option}
                                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                                className="h-9 bg-white/[0.02] border-white/5 text-white text-[11px] font-mono rounded-xl px-4"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 rounded-xl flex-shrink-0"
                                                onClick={() => removeOption(index)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="logic" className="focus-visible:ring-0">
                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-3 text-[10px] font-bold text-[#ff8c00] uppercase tracking-[0.2em]">
                            <Zap className="w-3.5 h-3.5 fill-[#ff8c00]/20" />
                            Signal_Gate_Conditions
                        </div>
                        <p className="text-[9px] text-white/30 font-mono uppercase tracking-widest leading-relaxed">Define_Ecosystem_Resonance_Triggers<br />For_Node_Visibility</p>

                        {/* Logic Editor */}
                        {(() => {
                            const blockRule = logicConfig?.rules?.find(r => r.blockId === selectedBlock.id);

                            const updateRule = (updates: Partial<LogicConfig['rules'][0]>) => {
                                const currentRules = logicConfig?.rules || [];
                                const ruleIndex = currentRules.findIndex(r => r.blockId === selectedBlock.id);

                                let newRules = [...currentRules];
                                if (ruleIndex >= 0) {
                                    newRules[ruleIndex] = { ...newRules[ruleIndex], ...updates };
                                } else {
                                    newRules.push({
                                        blockId: selectedBlock.id,
                                        conditions: [],
                                        action: 'show',
                                        ...updates
                                    });
                                }
                                onUpdateLogic({ ...logicConfig, rules: newRules });
                            };

                            const removeRule = () => {
                                const newRules = (logicConfig?.rules || []).filter(r => r.blockId !== selectedBlock.id);
                                onUpdateLogic({ ...logicConfig, rules: newRules });
                            };

                            return (
                                <div className="space-y-4">
                                    {!blockRule ? (
                                        <Button
                                            variant="outline"
                                            className="w-full border-dashed border-white/10 bg-white/[0.01] text-white/30 hover:text-[#ff8c00] hover:border-[#ff8c00]/30 hover:bg-[#ff8c00]/5 text-[10px] uppercase font-bold tracking-widest py-10 rounded-2xl transition-all"
                                            onClick={() => updateRule({})}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Initialize_Logic_Chain
                                        </Button>
                                    ) : (
                                        <div className="space-y-5 p-5 border border-white/5 rounded-2xl bg-white/[0.01]">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Select
                                                        value={blockRule.action}
                                                        onValueChange={(val: 'show' | 'hide') => updateRule({ action: val })}
                                                    >
                                                        <SelectTrigger className="h-8 w-24 bg-white/5 border-white/10 text-[9px] font-bold uppercase tracking-wider rounded-lg">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[#0c0c0c] border-white/10">
                                                            <SelectItem value="show" className="text-[10px] uppercase font-bold text-white tracking-widest">ACTIVATE</SelectItem>
                                                            <SelectItem value="hide" className="text-[10px] uppercase font-bold text-white tracking-widest">SUSPEND</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <span className="text-[9px] font-mono text-white/20 uppercase">IF_RESONANCE:</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/60 hover:text-red-500" onClick={removeRule}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>

                                            {/* Conditions List */}
                                            <div className="space-y-4 pt-3 border-t border-white/5">
                                                {blockRule.conditions.map((cond, idx) => (
                                                    <div key={idx} className="space-y-3 pb-3 border-b border-white/5 last:border-0 relative">
                                                        <Select
                                                            value={cond.fieldId}
                                                            onValueChange={(val) => {
                                                                const newConds = [...blockRule.conditions];
                                                                newConds[idx] = { ...newConds[idx], fieldId: val };
                                                                updateRule({ conditions: newConds });
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-9 bg-white/[0.03] border-white/5 text-[9px] font-mono uppercase tracking-widest rounded-xl">
                                                                <SelectValue placeholder="SOURCE_NODE..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#0c0c0c] border-white/10">
                                                                {allBlocks
                                                                    .filter(b => b.id !== selectedBlock.id)
                                                                    .map(b => (
                                                                        <SelectItem key={b.id} value={b.id} className="text-[10px] uppercase font-mono">
                                                                            {b.properties.label || b.type} [{b.id.split('-').pop()}]
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>

                                                        <div className="flex gap-2">
                                                            <Select
                                                                value={cond.operator}
                                                                onValueChange={(val: any) => {
                                                                    const newConds = [...blockRule.conditions];
                                                                    newConds[idx] = { ...newConds[idx], operator: val };
                                                                    updateRule({ conditions: newConds });
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8 bg-white/[0.03] border-white/5 text-[9px] font-bold uppercase tracking-tighter flex-1 rounded-lg">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-[#0c0c0c] border-white/10">
                                                                    <SelectItem value="equals" className="text-[9px] uppercase font-bold tracking-widest">EQUALS ==</SelectItem>
                                                                    <SelectItem value="not_equals" className="text-[9px] uppercase font-bold tracking-widest">NOT_EQUALS !=</SelectItem>
                                                                    <SelectItem value="contains" className="text-[9px] uppercase font-bold tracking-widest">CONTAINS &</SelectItem>
                                                                    <SelectItem value="not_empty" className="text-[9px] uppercase font-bold tracking-widest">EXISTS ?</SelectItem>
                                                                </SelectContent>
                                                            </Select>

                                                            <Input
                                                                className="h-8 bg-white/[0.02] border-white/5 text-white text-[10px] font-mono tracking-widest flex-1 rounded-lg px-3"
                                                                value={cond.value}
                                                                onChange={(e) => {
                                                                    const newConds = [...blockRule.conditions];
                                                                    newConds[idx] = { ...newConds[idx], value: e.target.value };
                                                                    updateRule({ conditions: newConds });
                                                                }}
                                                                placeholder="VAL_MATCH..."
                                                            />
                                                        </div>
                                                    </div>
                                                ))}

                                                <Button
                                                    variant="secondary"
                                                    className="w-full h-9 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all text-[9px] font-bold uppercase tracking-widest rounded-xl border border-white/5"
                                                    onClick={() => {
                                                        const newConds = [...blockRule.conditions, { fieldId: '', operator: 'equals' as const, value: '' }];
                                                        updateRule({ conditions: newConds });
                                                    }}
                                                >
                                                    <Plus className="w-3.5 h-3.5 mr-2" />
                                                    Add_Logical_Anchor
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </TabsContent>
            </Tabs>

            {/* PANEL FOOTER SIGNAL */}
            <div className="absolute bottom-4 left-0 w-full px-6 opacity-20 group-hover:opacity-40 transition-opacity">
                <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-2.5 h-2.5 text-[#ff8c00]" />
                    <span className="text-[8px] font-mono uppercase tracking-[0.2em]">Signal_Sync_Active</span>
                </div>
                <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#ff8c00] w-1/3 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}
