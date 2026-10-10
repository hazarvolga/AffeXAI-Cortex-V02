'use client';

/**
 * Simple Editor Content
 * Minimal 3-panel layout for page editing
 * 
 * Layout:
 * - Left: Section list (add/remove/reorder)
 * - Center: Live preview with inline editing
 * - Right: Section customizer (props editor)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { SectionList } from './SectionList';
import { SectionPreview } from './SectionPreview';
import { SectionCustomizer } from '../section-editor/SectionCustomizer';
import { SectionPicker, getTemplateById, type SectionTemplate } from '../section-editor';
import { SchemaPropertiesPanel } from '../editor/schema-properties-panel';
import { getBlockSchema, hasSchema, initializeBlockSchemas } from '../schemas';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

// Initialize schemas on module load
initializeBlockSchemas();

export interface SimpleSection {
    id: string;
    blockType: string;
    templateId?: string;
    props: Record<string, any>;
    orderIndex: number;
}

interface SimpleEditorContentProps {
    sections: SimpleSection[];
    onSectionsChange: (sections: SimpleSection[]) => void;
    className?: string;
}

export function SimpleEditorContent({
    sections,
    onSectionsChange,
    className,
}: SimpleEditorContentProps) {
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    // Get selected section
    const selectedSection = sections.find(s => s.id === selectedSectionId);

    // Add section from template
    const handleAddSection = useCallback((template: SectionTemplate) => {
        const newSection: SimpleSection = {
            id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            blockType: template.blockType,
            templateId: template.id,
            props: { ...template.defaultProps },
            orderIndex: sections.length,
        };

        onSectionsChange([...sections, newSection]);
        setSelectedSectionId(newSection.id);
        setIsPickerOpen(false);
    }, [sections, onSectionsChange]);

    // Remove section
    const handleRemoveSection = useCallback((sectionId: string) => {
        const filtered = sections.filter(s => s.id !== sectionId);
        // Recalculate order indices
        const reordered = filtered.map((s, i) => ({ ...s, orderIndex: i }));
        onSectionsChange(reordered);

        if (selectedSectionId === sectionId) {
            setSelectedSectionId(null);
        }
    }, [sections, onSectionsChange, selectedSectionId]);

    // Reorder sections
    const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
        const newSections = [...sections];
        const [moved] = newSections.splice(fromIndex, 1);
        newSections.splice(toIndex, 0, moved);

        // Update order indices
        const reordered = newSections.map((s, i) => ({ ...s, orderIndex: i }));
        onSectionsChange(reordered);
    }, [sections, onSectionsChange]);

    // Update section props
    const handlePropsChange = useCallback((sectionId: string, newProps: Record<string, any>) => {
        const updated = sections.map(s =>
            s.id === sectionId ? { ...s, props: newProps } : s
        );
        onSectionsChange(updated);
    }, [sections, onSectionsChange]);

    // Duplicate section
    const handleDuplicate = useCallback((sectionId: string) => {
        const source = sections.find(s => s.id === sectionId);
        if (!source) return;

        const newSection: SimpleSection = {
            ...source,
            id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            orderIndex: sections.length,
        };

        onSectionsChange([...sections, newSection]);
        setSelectedSectionId(newSection.id);
    }, [sections, onSectionsChange]);

    return (
        <div className={cn('flex h-full', className)}>
            {/* Left Panel: Section List */}
            <div className="w-64 flex-shrink-0 border-r bg-muted/30 flex flex-col">
                <div className="p-3 border-b flex items-center justify-between">
                    <h3 className="font-medium text-sm">Sections</h3>
                    <SectionPicker
                        onSelect={handleAddSection}
                        trigger={
                            <Button size="sm" variant="outline" className="h-7">
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                            </Button>
                        }
                    />
                </div>

                <SectionList
                    sections={sections}
                    selectedId={selectedSectionId}
                    onSelect={setSelectedSectionId}
                    onRemove={handleRemoveSection}
                    onReorder={handleReorder}
                    onDuplicate={handleDuplicate}
                    className="flex-1 overflow-y-auto"
                />
            </div>

            {/* Center Panel: Live Preview */}
            <div className="flex-1 overflow-auto bg-background">
                <SectionPreview
                    sections={sections}
                    selectedSectionId={selectedSectionId}
                    onSelectSection={setSelectedSectionId}
                    onSectionPropsChange={handlePropsChange}
                />

                {/* Empty State */}
                {sections.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-2">No sections yet</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            Start building your page by adding sections from the template library.
                        </p>
                        <SectionPicker
                            onSelect={handleAddSection}
                            trigger={
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add First Section
                                </Button>
                            }
                        />
                    </div>
                )}
            </div>

            {/* Right Panel: Section Customizer */}
            <div className="w-80 flex-shrink-0 border-l bg-muted/30 overflow-y-auto">
                {selectedSection ? (
                    <div className="p-4">
                        <h3 className="font-medium text-sm mb-4">Customize Section</h3>

                        {/* Use SchemaPropertiesPanel for v2 blocks */}
                        {hasSchema(selectedSection.blockType) ? (
                            <SchemaPropertiesPanel
                                blockType={selectedSection.blockType}
                                props={selectedSection.props}
                                onChange={(newProps) => handlePropsChange(selectedSection.id, newProps)}
                            />
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                <p>This section uses legacy properties.</p>
                                <p className="mt-2">Future: inline prop editing</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <p className="text-sm text-muted-foreground">
                            Select a section to customize its properties
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SimpleEditorContent;
