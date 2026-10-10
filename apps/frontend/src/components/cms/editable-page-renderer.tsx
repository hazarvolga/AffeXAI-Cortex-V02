'use client';

/**
 * Editable Page Renderer
 * Wraps PageRenderer with Quick Edit capabilities for Layer 1
 */

import React from 'react';
import { PageRenderer } from './page-renderer';
import { QuickEditProvider, QuickEditToolbar } from './quick-edit';
import { cmsService } from '@/lib/cms/cms-service';

interface EditablePageRendererProps {
    pageId: string;
    components: any[];
    isEditable?: boolean;
}

export function EditablePageRenderer({
    pageId,
    components,
    isEditable = false,
}: EditablePageRendererProps) {
    // Save handler for Quick Edit changes
    const handleSave = async (changesByComponent: Record<string, Record<string, any>>) => {
        try {
            // Update each component with its changed props
            for (const [componentId, propChanges] of Object.entries(changesByComponent)) {
                await cmsService.updateComponent(componentId, {
                    props: propChanges,
                });
            }

            // Optionally trigger a page refresh or optimistic update
            window.location.reload();
        } catch (error) {
            console.error('Failed to save Quick Edit changes:', error);
            throw error;
        }
    };

    // If not editable, render without Quick Edit
    if (!isEditable) {
        return <PageRenderer components={components} />;
    }

    // Wrap with Quick Edit provider
    return (
        <QuickEditProvider onSave={handleSave}>
            <QuickEditToolbar />
            <PageRenderer components={components} />
        </QuickEditProvider>
    );
}

export default EditablePageRenderer;
