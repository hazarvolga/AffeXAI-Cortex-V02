/**
 * Quick Edit System
 * Layer 1 of 3-Layer CMS Architecture
 * 
 * Provides inline editing capabilities for CMS pages:
 * - Hover to show edit button
 * - Click to edit text/images inline
 * - Auto-save pending changes
 */

export { QuickEditProvider, useQuickEdit, useIsEditMode } from './QuickEditProvider';
export { QuickEditOverlay, QuickEditToolbar } from './QuickEditOverlay';
export { InlineTextEditor, SimpleTextEditor } from './InlineTextEditor';
export { ImageReplacer } from './ImageReplacer';
