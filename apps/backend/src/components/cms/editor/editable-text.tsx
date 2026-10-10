'use client';

import React, { useState, useRef, useEffect } from 'react';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  tagName?: keyof JSX.IntrinsicElements;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Click to edit...',
  tagName: Tag = 'span',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const elementRef = useRef<HTMLElement>(null);

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

  // Handle double click to enter edit mode
  const handleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      setTimeout(() => {
        if (elementRef.current) {
          elementRef.current.focus();
        }
      }, 0);
    }
  };

  return (
    <Tag
      ref={elementRef}
      contentEditable={isEditing}
      suppressContentEditableWarning
      className={`outline-none focus:outline focus:outline-blue-300 ${className} ${
        !localValue && !isEditing ? 'text-gray-400 italic' : ''
      } ${isEditing ? 'bg-yellow-50 border border-yellow-200 rounded px-1' : 'cursor-pointer hover:bg-gray-50'}`}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onDoubleClick={handleDoubleClick}
    >
      {localValue || placeholder}
    </Tag>
  );
};

export default EditableText;