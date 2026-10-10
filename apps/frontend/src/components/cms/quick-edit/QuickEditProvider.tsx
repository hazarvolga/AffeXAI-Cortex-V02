'use client';

/**
 * Quick Edit Provider
 * Context for managing inline edit mode across CMS pages
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface EditableElement {
    id: string;
    componentId: string;
    propKey: string;
    type: 'text' | 'image' | 'link';
    currentValue: any;
}

interface QuickEditContextType {
    // Edit mode state
    isEditMode: boolean;
    toggleEditMode: () => void;
    enableEditMode: () => void;
    disableEditMode: () => void;

    // Currently editing element
    activeElement: EditableElement | null;
    setActiveElement: (element: EditableElement | null) => void;

    // Pending changes (before save)
    pendingChanges: Map<string, any>;
    setPendingChange: (componentId: string, propKey: string, value: any) => void;
    clearPendingChanges: () => void;

    // Save functionality
    isSaving: boolean;
    saveChanges: () => Promise<void>;
    hasUnsavedChanges: boolean;

    // Page context
    pageId: string | null;
    setPageId: (id: string) => void;
}

const QuickEditContext = createContext<QuickEditContextType | null>(null);

interface QuickEditProviderProps {
    children: ReactNode;
    onSave?: (changes: Record<string, any>) => Promise<void>;
}

export function QuickEditProvider({ children, onSave }: QuickEditProviderProps) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [activeElement, setActiveElement] = useState<EditableElement | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Map<string, any>>(new Map());
    const [isSaving, setIsSaving] = useState(false);
    const [pageId, setPageId] = useState<string | null>(null);

    const toggleEditMode = useCallback(() => {
        setIsEditMode((prev) => !prev);
        if (isEditMode) {
            setActiveElement(null);
        }
    }, [isEditMode]);

    const enableEditMode = useCallback(() => {
        setIsEditMode(true);
    }, []);

    const disableEditMode = useCallback(() => {
        setIsEditMode(false);
        setActiveElement(null);
    }, []);

    const setPendingChange = useCallback((componentId: string, propKey: string, value: any) => {
        setPendingChanges((prev) => {
            const next = new Map(prev);
            const key = `${componentId}.${propKey}`;
            next.set(key, { componentId, propKey, value });
            return next;
        });
    }, []);

    const clearPendingChanges = useCallback(() => {
        setPendingChanges(new Map());
    }, []);

    const saveChanges = useCallback(async () => {
        if (pendingChanges.size === 0) return;

        setIsSaving(true);
        try {
            // Group changes by component
            const changesByComponent: Record<string, Record<string, any>> = {};
            pendingChanges.forEach(({ componentId, propKey, value }) => {
                if (!changesByComponent[componentId]) {
                    changesByComponent[componentId] = {};
                }
                changesByComponent[componentId][propKey] = value;
            });

            // Call onSave callback if provided
            if (onSave) {
                await onSave(changesByComponent);
            }

            clearPendingChanges();
        } catch (error) {
            console.error('Failed to save changes:', error);
            throw error;
        } finally {
            setIsSaving(false);
        }
    }, [pendingChanges, onSave, clearPendingChanges]);

    const value: QuickEditContextType = {
        isEditMode,
        toggleEditMode,
        enableEditMode,
        disableEditMode,
        activeElement,
        setActiveElement,
        pendingChanges,
        setPendingChange,
        clearPendingChanges,
        isSaving,
        saveChanges,
        hasUnsavedChanges: pendingChanges.size > 0,
        pageId,
        setPageId,
    };

    return (
        <QuickEditContext.Provider value={value}>
            {children}
        </QuickEditContext.Provider>
    );
}

export function useQuickEdit() {
    const context = useContext(QuickEditContext);
    if (!context) {
        throw new Error('useQuickEdit must be used within QuickEditProvider');
    }
    return context;
}

export function useIsEditMode() {
    const context = useContext(QuickEditContext);
    return context?.isEditMode ?? false;
}
