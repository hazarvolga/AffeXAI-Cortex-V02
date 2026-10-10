'use client';

/**
 * Inline Text Editor
 * Minimal TipTap editor for inline text editing
 */

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useQuickEdit } from './QuickEditProvider';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Link as LinkIcon, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface InlineTextEditorProps {
    componentId: string;
    propKey: string;
    initialValue: string;
    placeholder?: string;
    variant?: 'heading' | 'paragraph' | 'simple';
    className?: string;
    onSave?: (value: string) => void;
}

export function InlineTextEditor({
    componentId,
    propKey,
    initialValue,
    placeholder = 'Enter text...',
    variant = 'paragraph',
    className,
    onSave,
}: InlineTextEditorProps) {
    const { isEditMode, setPendingChange, activeElement, setActiveElement } = useQuickEdit();
    const [isEditing, setIsEditing] = useState(false);

    const isActive =
        activeElement?.componentId === componentId && activeElement?.propKey === propKey;

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: variant === 'heading' ? { levels: [1, 2, 3] } : false,
                bulletList: variant !== 'simple' ? {} : false,
                orderedList: variant !== 'simple' ? {} : false,
            }),
        ],
        content: initialValue,
        editable: isEditMode && isEditing,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            setPendingChange(componentId, propKey, html);
        },
    });

    // Activate editing when this element becomes active
    useEffect(() => {
        if (isActive && !isEditing) {
            setIsEditing(true);
            editor?.commands.focus('end');
        }
    }, [isActive, isEditing, editor]);

    // Handle click to start editing
    const handleClick = () => {
        if (!isEditMode) return;

        setActiveElement({
            id: `${componentId}-${propKey}`,
            componentId,
            propKey,
            type: 'text',
            currentValue: initialValue,
        });
        setIsEditing(true);
    };

    const handleDone = () => {
        setIsEditing(false);
        setActiveElement(null);
        if (onSave) {
            onSave(editor?.getHTML() || initialValue);
        }
    };

    const handleCancel = () => {
        editor?.commands.setContent(initialValue);
        setIsEditing(false);
        setActiveElement(null);
    };

    if (!isEditMode) {
        return (
            <div
                className={className}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(initialValue) }}
            />
        );
    }

    return (
        <div
            className={cn(
                'relative',
                isEditing && 'ring-2 ring-primary ring-offset-2 rounded',
                className
            )}
        >
            {/* Editor */}
            <div
                onClick={handleClick}
                className={cn(
                    'cursor-pointer transition-colors',
                    !isEditing && 'hover:bg-primary/5',
                    isEditing && 'cursor-text'
                )}
            >
                <EditorContent editor={editor} className="outline-none" />
            </div>

            {/* Mini Toolbar */}
            {isEditing && (
                <div className="absolute -top-10 left-0 flex items-center gap-1 p-1 bg-background border rounded-md shadow-lg z-50">
                    {variant !== 'simple' && (
                        <>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => editor?.chain().focus().toggleBold().run()}
                                data-active={editor?.isActive('bold')}
                            >
                                <Bold className="h-3 w-3" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => editor?.chain().focus().toggleItalic().run()}
                                data-active={editor?.isActive('italic')}
                            >
                                <Italic className="h-3 w-3" />
                            </Button>
                            <div className="w-px h-4 bg-border mx-1" />
                        </>
                    )}
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={handleCancel}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-600"
                        onClick={handleDone}
                    >
                        <Check className="h-3 w-3" />
                    </Button>
                </div>
            )}
        </div>
    );
}

/**
 * Simple Text Input for non-rich text
 */
interface SimpleTextEditorProps {
    componentId: string;
    propKey: string;
    initialValue: string;
    placeholder?: string;
    className?: string;
}

export function SimpleTextEditor({
    componentId,
    propKey,
    initialValue,
    placeholder,
    className,
}: SimpleTextEditorProps) {
    const { isEditMode, setPendingChange } = useQuickEdit();
    const [value, setValue] = useState(initialValue);
    const [isEditing, setIsEditing] = useState(false);

    if (!isEditMode) {
        return <span className={className}>{value}</span>;
    }

    return (
        <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => {
                setValue(e.target.value);
                setPendingChange(componentId, propKey, e.target.value);
            }}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            className={cn(
                'bg-transparent border-none outline-none w-full',
                'focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1',
                isEditing && 'bg-background',
                className
            )}
        />
    );
}
