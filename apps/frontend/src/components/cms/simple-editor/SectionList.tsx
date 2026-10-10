'use client';

/**
 * Section List
 * Left panel showing list of page sections with drag-to-reorder
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    GripVertical,
    Trash2,
    Copy,
    ChevronUp,
    ChevronDown,
    Eye,
    EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimpleSection } from './SimpleEditorContent';

interface SectionListProps {
    sections: SimpleSection[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onRemove: (id: string) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onDuplicate: (id: string) => void;
    className?: string;
}

export function SectionList({
    sections,
    selectedId,
    onSelect,
    onRemove,
    onReorder,
    onDuplicate,
    className,
}: SectionListProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragEnd = () => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            onReorder(draggedIndex, dragOverIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleMoveUp = (index: number) => {
        if (index > 0) {
            onReorder(index, index - 1);
        }
    };

    const handleMoveDown = (index: number) => {
        if (index < sections.length - 1) {
            onReorder(index, index + 1);
        }
    };

    // Get readable name from block type
    const getBlockName = (blockType: string) => {
        return blockType
            .replace(/^v2-/, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className={cn('p-2 space-y-1', className)}>
            {sections
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((section, index) => (
                    <div
                        key={section.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onSelect(section.id)}
                        className={cn(
                            'group relative flex items-center gap-2 p-2 rounded-md cursor-pointer',
                            'border bg-card hover:bg-accent transition-colors',
                            selectedId === section.id && 'ring-2 ring-primary bg-accent',
                            draggedIndex === index && 'opacity-50',
                            dragOverIndex === index && 'border-primary border-2'
                        )}
                    >
                        {/* Drag Handle */}
                        <div className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>

                        {/* Section Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {getBlockName(section.blockType)}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {section.props.title || section.props.heading || `Section ${index + 1}`}
                            </p>
                        </div>

                        {/* Quick Actions (on hover) */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                                disabled={index === 0}
                            >
                                <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                                disabled={index === sections.length - 1}
                            >
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); onDuplicate(section.id); }}
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); onRemove(section.id); }}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                ))}

            {/* Empty State */}
            {sections.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No sections added yet</p>
                </div>
            )}
        </div>
    );
}

export default SectionList;
