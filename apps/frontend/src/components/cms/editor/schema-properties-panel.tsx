'use client';

/**
 * Schema Properties Panel
 * Auto-generates properties UI from block schema
 * Replaces hardcoded 77KB properties-panel.tsx for v2 blocks
 */

import React from 'react';
import { getBlockSchema, PropField, hasSchema, validateBlockProps } from '../schemas';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchemaPropertiesPanelProps {
    blockType: string;
    props: Record<string, any>;
    onChange: (props: Record<string, any>) => void;
    className?: string;
}

export function SchemaPropertiesPanel({
    blockType,
    props,
    onChange,
    className,
}: SchemaPropertiesPanelProps) {
    const schema = getBlockSchema(blockType);

    // If no schema, show legacy message
    if (!schema || !hasSchema(blockType)) {
        return (
            <div className={cn('p-4 text-muted-foreground text-sm', className)}>
                <p>Legacy block - use original properties panel</p>
            </div>
        );
    }

    // Validate current props
    const errors = validateBlockProps(blockType, props);
    const errorMap = new Map(errors.map(e => [e.field, e.message]));

    // Group fields by group
    const groupedFields = new Map<string, PropField[]>();
    for (const field of schema.propSchema) {
        const group = field.group || 'General';
        if (!groupedFields.has(group)) {
            groupedFields.set(group, []);
        }
        groupedFields.get(group)!.push(field);
    }

    const handleChange = (key: string, value: any) => {
        onChange({ ...props, [key]: value });
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Block Info Header */}
            <div className="pb-2 border-b">
                <h3 className="font-semibold text-sm">{schema.label}</h3>
                {schema.description && (
                    <p className="text-xs text-muted-foreground mt-1">{schema.description}</p>
                )}
            </div>

            {/* Grouped Fields */}
            {Array.from(groupedFields.entries()).map(([group, fields]) => (
                <Card key={group} className="border-none shadow-none bg-muted/30">
                    <CardHeader className="py-2 px-3">
                        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {group}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-3 pb-3">
                        {fields.map((field) => (
                            <FieldRenderer
                                key={field.key}
                                field={field}
                                value={props[field.key]}
                                error={errorMap.get(field.key)}
                                onChange={(val) => handleChange(field.key, val)}
                            />
                        ))}
                    </CardContent>
                </Card>
            ))}

            {/* Validation Errors Summary */}
            {errors.length > 0 && (
                <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                    <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.length} validation error(s)</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============ FIELD RENDERER ============

interface FieldRendererProps {
    field: PropField;
    value: any;
    error?: string;
    onChange: (value: any) => void;
}

function FieldRenderer({ field, value, error, onChange }: FieldRendererProps) {
    const id = `field-${field.key}`;

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-xs flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
            </Label>

            {/* Render based on type */}
            {field.type === 'text' && (
                <Input
                    id={id}
                    value={value || ''}
                    placeholder={field.placeholder}
                    maxLength={(field as any).maxLength}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn('h-8 text-sm', error && 'border-destructive')}
                />
            )}

            {field.type === 'textarea' && (
                <Textarea
                    id={id}
                    value={value || ''}
                    placeholder={field.placeholder}
                    rows={(field as any).rows || 3}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn('text-sm resize-none', error && 'border-destructive')}
                />
            )}

            {field.type === 'number' && (
                <div className="flex items-center gap-2">
                    <Slider
                        value={[value || (field as any).min || 0]}
                        min={(field as any).min || 0}
                        max={(field as any).max || 100}
                        step={(field as any).step || 1}
                        onValueChange={([v]) => onChange(v)}
                        className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-12 text-right">
                        {value}{(field as any).unit || ''}
                    </span>
                </div>
            )}

            {field.type === 'boolean' && (
                <div className="flex items-center gap-2">
                    <Switch
                        id={id}
                        checked={value || false}
                        onCheckedChange={onChange}
                    />
                    <Label htmlFor={id} className="text-xs text-muted-foreground">
                        {value ? 'Enabled' : 'Disabled'}
                    </Label>
                </div>
            )}

            {field.type === 'select' && (
                <Select value={value || ''} onValueChange={onChange}>
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        {(field as any).options?.map((opt: any) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {field.type === 'color' && (
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        id={id}
                        value={value || '#000000'}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                    />
                    <Input
                        value={value || ''}
                        placeholder="#000000"
                        onChange={(e) => onChange(e.target.value)}
                        className="h-8 text-sm flex-1"
                    />
                </div>
            )}

            {field.type === 'link' && (
                <Input
                    id={id}
                    value={value || ''}
                    placeholder={field.placeholder || '/page or https://...'}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn('h-8 text-sm', error && 'border-destructive')}
                />
            )}

            {field.type === 'image' && (
                <div className="space-y-2">
                    {value && (
                        <img src={value} alt="Preview" className="h-20 object-cover rounded" />
                    )}
                    <Button variant="outline" size="sm" className="w-full">
                        Select Image
                    </Button>
                </div>
            )}

            {field.type === 'array' && (
                <ArrayFieldEditor
                    field={field as any}
                    value={value || []}
                    onChange={onChange}
                />
            )}

            {/* Error message */}
            {error && (
                <p className="text-xs text-destructive">{error}</p>
            )}

            {/* Description */}
            {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
        </div>
    );
}

// ============ ARRAY FIELD EDITOR ============

interface ArrayFieldEditorProps {
    field: { itemSchema: PropField; minItems?: number; maxItems?: number };
    value: any[];
    onChange: (value: any[]) => void;
}

function ArrayFieldEditor({ field, value, onChange }: ArrayFieldEditorProps) {
    const handleAdd = () => {
        if (field.maxItems && value.length >= field.maxItems) return;
        onChange([...value, {}]);
    };

    const handleRemove = (index: number) => {
        if (field.minItems && value.length <= field.minItems) return;
        onChange(value.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, itemValue: any) => {
        const newValue = [...value];
        newValue[index] = itemValue;
        onChange(newValue);
    };

    return (
        <div className="space-y-2">
            {value.map((item, index) => (
                <div key={index} className="p-2 border rounded-md bg-background relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 absolute top-1 right-1"
                        onClick={() => handleRemove(index)}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>

                    {field.itemSchema.type === 'object' ? (
                        <div className="space-y-2 pr-6">
                            {(field.itemSchema as any).fields?.map((f: PropField) => (
                                <FieldRenderer
                                    key={f.key}
                                    field={f}
                                    value={item[f.key]}
                                    onChange={(val) => handleItemChange(index, { ...item, [f.key]: val })}
                                />
                            ))}
                        </div>
                    ) : (
                        <FieldRenderer
                            field={field.itemSchema}
                            value={item}
                            onChange={(val) => handleItemChange(index, val)}
                        />
                    )}
                </div>
            ))}

            <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleAdd}
                disabled={field.maxItems ? value.length >= field.maxItems : false}
            >
                <Plus className="h-3 w-3 mr-1" />
                Add Item
            </Button>
        </div>
    );
}

export default SchemaPropertiesPanel;
