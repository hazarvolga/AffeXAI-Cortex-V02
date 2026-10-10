'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitFork, Shuffle } from 'lucide-react';

export type BranchConfigData = {
    label: string;
    configured?: boolean;
    type: 'CONDITION' | 'RANDOM_SPLIT';
    condition?: {
        field: string;
        operator: string;
        value: string;
    };
    splitRatio?: number[];
};

interface BranchConfigFormProps {
    data: BranchConfigData;
    onUpdate: (data: Partial<BranchConfigData>) => void;
}

export function BranchConfigForm({ data, onUpdate }: BranchConfigFormProps) {
    const mode = data.type || 'CONDITION';
    const ratio = data.splitRatio?.[0] || 50;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-white/40">Logic Mode</Label>
                <Tabs
                    value={mode}
                    onValueChange={(val) => {
                        if (val === 'CONDITION' || val === 'RANDOM_SPLIT') {
                            onUpdate({ type: val, configured: true });
                        }
                    }}
                    className="w-full"
                >
                    <TabsList className="w-full grid grid-cols-2 bg-white/5 border border-white/10 rounded-none p-0 h-8">
                        <TabsTrigger
                            value="CONDITION"
                            className="text-[9px] uppercase tracking-widest data-[state=active]:bg-[#8b5cf6] data-[state=active]:text-white rounded-none h-full"
                        >
                            <GitFork className="w-3 h-3 mr-2" />
                            Conditional
                        </TabsTrigger>
                        <TabsTrigger
                            value="RANDOM_SPLIT"
                            className="text-[9px] uppercase tracking-widest data-[state=active]:bg-[#8b5cf6] data-[state=active]:text-white rounded-none h-full"
                        >
                            <Shuffle className="w-3 h-3 mr-2" />
                            A/B Split
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-white/40">Node Label</Label>
                <Input
                    value={data.label || ''}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    placeholder="e.g. Check Purchase History"
                    className="bg-white/5 border-white/10 text-xs h-8"
                />
            </div>

            {mode === 'RANDOM_SPLIT' ? (
                <div className="space-y-4 p-4 bg-white/[0.02] border border-white/5">
                    <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#9df425]">Path A: {ratio}%</span>
                        <span className="text-[#ff8c00]">Path B: {100 - ratio}%</span>
                    </div>
                    <Slider
                        value={[ratio]}
                        min={0}
                        max={100}
                        step={10}
                        onValueChange={(vals) => onUpdate({ splitRatio: [vals[0], 100 - vals[0]] })}
                        className="py-4"
                    />
                    <p className="text-[9px] text-white/30 uppercase tracking-widest leading-relaxed">
                        Traffic will be randomly distributed based on the defined ratio.
                    </p>
                </div>
            ) : (
                <div className="space-y-4 p-4 bg-white/[0.02] border border-white/5">
                    <div className="space-y-2">
                        <Label className="text-[9px] uppercase tracking-widest text-white/40">Field</Label>
                        <Select
                            value={data.condition?.field}
                            onValueChange={(val) => onUpdate({ condition: { ...data.condition!, field: val } })}
                        >
                            <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10">
                                <SelectValue placeholder="Select Field" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tags">Tags</SelectItem>
                                <SelectItem value="email_open_rate">Open Rate</SelectItem>
                                <SelectItem value="purchase_count">Purchase Count</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[9px] uppercase tracking-widest text-white/40">Operator</Label>
                            <Select
                                value={data.condition?.operator}
                                onValueChange={(val) => onUpdate({ condition: { ...data.condition!, operator: val } })}
                            >
                                <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10">
                                    <SelectValue placeholder="Op" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="eq">Equals</SelectItem>
                                    <SelectItem value="contains">Contains</SelectItem>
                                    <SelectItem value="gt">Greater Than</SelectItem>
                                    <SelectItem value="lt">Less Than</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[9px] uppercase tracking-widest text-white/40">Value</Label>
                            <Input
                                value={data.condition?.value || ''}
                                onChange={(e) => onUpdate({ condition: { ...data.condition!, value: e.target.value } })}
                                placeholder="Value..."
                                className="bg-white/5 border-white/10 text-xs h-8"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
