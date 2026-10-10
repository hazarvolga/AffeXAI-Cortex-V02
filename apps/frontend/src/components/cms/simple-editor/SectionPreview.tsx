'use client';

/**
 * Section Preview
 * Center panel showing live preview of page sections
 * Supports inline editing when in edit mode
 */

import React from 'react';
import { blockRegistry } from '../block-registry';
import { cn } from '@/lib/utils';
import type { SimpleSection } from './SimpleEditorContent';

interface SectionPreviewProps {
    sections: SimpleSection[];
    selectedSectionId: string | null;
    onSelectSection: (id: string) => void;
    onSectionPropsChange?: (sectionId: string, props: Record<string, any>) => void;
    className?: string;
}

export function SectionPreview({
    sections,
    selectedSectionId,
    onSelectSection,
    onSectionPropsChange,
    className,
}: SectionPreviewProps) {
    const sortedSections = [...sections].sort((a, b) => a.orderIndex - b.orderIndex);

    // Handle inline prop changes
    const handlePropChange = (sectionId: string, section: SimpleSection) => (key: string, value: any) => {
        if (onSectionPropsChange) {
            const newProps = { ...section.props, [key]: value };
            onSectionPropsChange(sectionId, newProps);
        }
    };

    return (
        <div className={cn('min-h-full', className)}>
            {sortedSections.map((section) => {
                // Get the block component from registry
                const BlockComponent = blockRegistry[section.blockType as keyof typeof blockRegistry];
                const isSelected = selectedSectionId === section.id;

                if (!BlockComponent) {
                    return (
                        <div
                            key={section.id}
                            onClick={() => onSelectSection(section.id)}
                            className={cn(
                                'p-8 border-2 border-dashed border-red-300 bg-red-50 text-center',
                                'cursor-pointer transition-all',
                                isSelected && 'ring-2 ring-primary ring-offset-2'
                            )}
                        >
                            <p className="text-red-600 font-medium">Unknown block: {section.blockType}</p>
                            <p className="text-sm text-red-500 mt-1">This block type is not registered</p>
                        </div>
                    );
                }

                return (
                    <div
                        key={section.id}
                        onClick={(e) => {
                            // Don't select when clicking inside editable content
                            if ((e.target as HTMLElement).contentEditable === 'true') {
                                return;
                            }
                            onSelectSection(section.id);
                        }}
                        className={cn(
                            'relative cursor-pointer transition-all',
                            isSelected && 'ring-2 ring-primary ring-offset-2'
                        )}
                    >
                        {/* Selection Indicator */}
                        {isSelected && (
                            <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium shadow-lg">
                                ✏️ Editing
                            </div>
                        )}

                        {/* Render the actual block with inline editing support */}
                        <BlockComponent
                            {...section.props}
                            isEditing={isSelected}
                            onPropChange={handlePropChange(section.id, section)}
                        />

                        {/* Hover Overlay - only show when not selected */}
                        {!isSelected && (
                            <div className={cn(
                                'absolute inset-0 bg-primary/5 opacity-0 hover:opacity-100 transition-opacity',
                                'pointer-events-none'
                            )} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default SectionPreview;
