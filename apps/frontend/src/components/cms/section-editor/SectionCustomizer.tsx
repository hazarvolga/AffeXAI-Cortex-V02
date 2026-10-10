'use client';

/**
 * Section Customizer
 * Simple props editor for selected section template
 */

import React, { useState, useEffect } from 'react';
import { SectionTemplate } from './SectionTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/sheet';
import { Check, X, Palette, Type, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionCustomizerProps {
    template: SectionTemplate;
    initialProps?: Record<string, any>;
    isOpen: boolean;
    onClose: () => void;
    onSave: (props: Record<string, any>) => void;
}

export function SectionCustomizer({
    template,
    initialProps,
    isOpen,
    onClose,
    onSave,
}: SectionCustomizerProps) {
    const [props, setProps] = useState<Record<string, any>>(
        initialProps || template.defaultProps
    );

    useEffect(() => {
        setProps(initialProps || template.defaultProps);
    }, [template, initialProps]);

    const handleChange = (key: string, value: any) => {
        setProps((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(props);
        onClose();
    };

    const handleCancel = () => {
        setProps(initialProps || template.defaultProps);
        onClose();
    };

    // Get field type hint
    const getFieldType = (key: string, value: any): 'text' | 'textarea' | 'color' | 'link' | 'image' | 'array' => {
        if (key.toLowerCase().includes('color') || key.toLowerCase().includes('background')) return 'color';
        if (key.toLowerCase().includes('link') || key.toLowerCase().includes('url')) return 'link';
        if (key.toLowerCase().includes('image') || key.toLowerCase().includes('src')) return 'image';
        if (key.toLowerCase().includes('description') || key.toLowerCase().includes('content') || key.toLowerCase().includes('subtitle')) return 'textarea';
        if (Array.isArray(value)) return 'array';
        return 'text';
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: template.previewColor }}
                        />
                        {template.name}
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-4 py-6">
                    {template.customizableFields.map((fieldKey) => {
                        const value = props[fieldKey];
                        const fieldType = getFieldType(fieldKey, value);
                        const label = fieldKey
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, (str) => str.toUpperCase());

                        // Skip array fields for now (complex editing)
                        if (fieldType === 'array') {
                            return (
                                <div key={fieldKey} className="space-y-2">
                                    <Label className="text-muted-foreground">{label}</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Use Advanced Editor for complex items
                                    </p>
                                </div>
                            );
                        }

                        return (
                            <div key={fieldKey} className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    {fieldType === 'color' && <Palette className="h-3 w-3" />}
                                    {fieldType === 'link' && <LinkIcon className="h-3 w-3" />}
                                    {fieldType === 'image' && <ImageIcon className="h-3 w-3" />}
                                    {fieldType === 'text' && <Type className="h-3 w-3" />}
                                    {label}
                                </Label>

                                {fieldType === 'text' && (
                                    <Input
                                        value={value || ''}
                                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                                        placeholder={`Enter ${label.toLowerCase()}`}
                                    />
                                )}

                                {fieldType === 'textarea' && (
                                    <Textarea
                                        value={value || ''}
                                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                                        placeholder={`Enter ${label.toLowerCase()}`}
                                        rows={3}
                                    />
                                )}

                                {fieldType === 'color' && (
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={value || '#000000'}
                                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                                            className="w-10 h-10 rounded cursor-pointer"
                                        />
                                        <Input
                                            value={value || ''}
                                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                                            placeholder="#000000"
                                            className="flex-1"
                                        />
                                    </div>
                                )}

                                {fieldType === 'link' && (
                                    <Input
                                        value={value || ''}
                                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                                        placeholder="/page or https://..."
                                    />
                                )}

                                {fieldType === 'image' && (
                                    <div className="space-y-2">
                                        {value && (
                                            <img
                                                src={value}
                                                alt="Preview"
                                                className="w-full h-32 object-cover rounded-md"
                                            />
                                        )}
                                        <Input
                                            value={value || ''}
                                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                                            placeholder="Image URL"
                                        />
                                        <Button variant="outline" size="sm" className="w-full">
                                            <ImageIcon className="h-4 w-4 mr-2" />
                                            Select from Media
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <SheetFooter className="flex gap-2">
                    <Button variant="outline" onClick={handleCancel} className="flex-1">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="flex-1">
                        <Check className="h-4 w-4 mr-2" />
                        Add Section
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export default SectionCustomizer;
