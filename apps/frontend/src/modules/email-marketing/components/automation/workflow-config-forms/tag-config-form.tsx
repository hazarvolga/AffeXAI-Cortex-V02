'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tag, Plus, Minus } from 'lucide-react';

export type TagConfigData = {
    label: string;
    configured?: boolean;
    action: 'ADD' | 'REMOVE';
    tags: string[];
};

interface TagConfigFormProps {
    data: TagConfigData;
    onUpdate: (data: Partial<TagConfigData>) => void;
}

export function TagConfigForm({ data, onUpdate }: TagConfigFormProps) {
    const action = data.action || 'ADD';
    const tagsString = data.tags?.join(', ') || '';

    const handleTagsChange = (val: string) => {
        const tags = val.split(',').map(t => t.trim()).filter(Boolean);
        onUpdate({ tags, configured: tags.length > 0 });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4 p-4 bg-white/[0.02] border border-white/5">
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-white/40">Action Mode</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant={action === 'ADD' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onUpdate({ action: 'ADD' })}
                            className={`rounded-none h-8 text-[9px] uppercase tracking-widest ${action === 'ADD'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'border-white/10 text-white/40 hover:text-white'
                                }`}
                        >
                            <Plus className="w-3 h-3 mr-2" />
                            Add Tags
                        </Button>
                        <Button
                            variant={action === 'REMOVE' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onUpdate({ action: 'REMOVE' })}
                            className={`rounded-none h-8 text-[9px] uppercase tracking-widest ${action === 'REMOVE'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'border-white/10 text-white/40 hover:text-white'
                                }`}
                        >
                            <Minus className="w-3 h-3 mr-2" />
                            Remove Tags
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-white/40">Target Tags</Label>
                    <Input
                        value={tagsString}
                        onChange={(e) => handleTagsChange(e.target.value)}
                        placeholder="e.g. vip, engaged, dormant"
                        className="bg-white/5 border-white/10 text-xs h-8"
                    />
                    <p className="text-[9px] text-white/30 uppercase tracking-widest">
                        Separate multiple tags with commas.
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-white/40">Node Label</Label>
                <Input
                    value={data.label || ''}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    placeholder={`e.g. ${action === 'ADD' ? 'Mark as VIP' : 'Remove Lead Tag'}`}
                    className="bg-white/5 border-white/10 text-xs h-8"
                />
            </div>
        </div>
    );
}
