'use client';

/**
 * Quick Edit Overlay
 * Shows edit button on hover over editable elements
 */

import React, { useState, useRef, useEffect } from 'react';
import { useQuickEdit, useIsEditMode } from './QuickEditProvider';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X, Save, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickEditOverlayProps {
    componentId: string;
    children: React.ReactNode;
    editableProps?: {
        key: string;
        type: 'text' | 'image' | 'link';
        label?: string;
    }[];
    className?: string;
}

export function QuickEditOverlay({
    componentId,
    children,
    editableProps = [],
    className,
}: QuickEditOverlayProps) {
    const { isEditMode, setActiveElement, activeElement } = useQuickEdit();
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isActive = activeElement?.componentId === componentId;

    if (!isEditMode) {
        return <>{children}</>;
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative group',
                isEditMode && 'outline-2 outline-dashed outline-transparent hover:outline-primary/30 transition-all',
                isActive && 'outline-primary',
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}

            {/* Hover Actions */}
            <AnimatePresence>
                {isHovered && !isActive && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute top-2 right-2 z-50"
                    >
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 px-3 shadow-lg bg-background/95 backdrop-blur"
                            onClick={() => {
                                if (editableProps.length > 0) {
                                    setActiveElement({
                                        id: `${componentId}-${editableProps[0].key}`,
                                        componentId,
                                        propKey: editableProps[0].key,
                                        type: editableProps[0].type,
                                        currentValue: null,
                                    });
                                }
                            }}
                        >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active Edit Indicator */}
            {isActive && (
                <div className="absolute inset-0 pointer-events-none border-2 border-primary rounded-md" />
            )}
        </div>
    );
}

/**
 * Quick Edit Toolbar
 * Floating toolbar showing edit mode controls
 */
interface QuickEditToolbarProps {
    className?: string;
}

export function QuickEditToolbar({ className }: QuickEditToolbarProps) {
    const {
        isEditMode,
        toggleEditMode,
        hasUnsavedChanges,
        saveChanges,
        isSaving,
        clearPendingChanges,
    } = useQuickEdit();

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn(
                'fixed top-4 right-4 z-50 flex items-center gap-2 p-2 rounded-lg shadow-lg',
                'bg-background/95 backdrop-blur border',
                className
            )}
        >
            {/* Edit Mode Toggle */}
            <Button
                size="sm"
                variant={isEditMode ? 'default' : 'outline'}
                onClick={toggleEditMode}
                className="h-8"
            >
                {isEditMode ? (
                    <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Exit Edit
                    </>
                ) : (
                    <>
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit Page
                    </>
                )}
            </Button>

            {/* Save/Cancel when editing */}
            {isEditMode && hasUnsavedChanges && (
                <>
                    <div className="w-px h-6 bg-border" />
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearPendingChanges}
                        className="h-8"
                    >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={saveChanges}
                        disabled={isSaving}
                        className="h-8"
                    >
                        {isSaving ? (
                            <span className="animate-spin mr-1">⏳</span>
                        ) : (
                            <Save className="h-3 w-3 mr-1" />
                        )}
                        Save
                    </Button>
                </>
            )}

            {/* Unsaved indicator */}
            {hasUnsavedChanges && (
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            )}
        </motion.div>
    );
}
