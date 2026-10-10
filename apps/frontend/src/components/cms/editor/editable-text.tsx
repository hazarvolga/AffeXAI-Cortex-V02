'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  tagName?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'li' | 'strong' | 'em' | 'label' | 'figcaption';
  htmlMode?: boolean; // If true, supports HTML formatting
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Click to edit...',
  tagName: Tag = 'span',
  htmlMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const elementRef = useRef<HTMLElement | null>(null);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleFocus = () => {
    setIsEditing(true);
    // Select all text when focusing
    setTimeout(() => {
      if (elementRef.current) {
        const range = document.createRange();
        range.selectNodeContents(elementRef.current);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const newValue = e.currentTarget.textContent || '';
    setLocalValue(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    // Exit editing mode on Enter (but allow Shift+Enter for line breaks)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      elementRef.current?.blur();
    }
    
    // Exit editing mode on Escape
    if (e.key === 'Escape') {
      setLocalValue(value); // Revert to original value
      elementRef.current?.blur();
    }
  };

  // Simple text mode - no Tiptap editor to avoid plugin conflicts
  return (
    <Tag
      ref={(element: HTMLElement | null) => { elementRef.current = element; }}
      contentEditable
      suppressContentEditableWarning
      className={cn(
        'outline-none focus:outline focus:outline-blue-300',
        className,
        !localValue && !isEditing && 'text-gray-400 italic'
      )}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
    >
      {localValue || placeholder}
    </Tag>
  );
};

export default EditableText;
