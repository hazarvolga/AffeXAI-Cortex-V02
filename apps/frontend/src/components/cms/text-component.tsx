'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { EditableText } from '@/components/cms/editor/editable-text';
import { usePreview } from '@/components/cms/preview-context';
import DOMPurify from 'dompurify';

interface TextComponentProps {
  id: string;
  content: string;
  htmlContent?: string; // NEW: Support for HTML content
  className?: string;
  variant?: 'heading1' | 'heading2' | 'heading3' | 'body' | 'caption';
  align?: 'left' | 'center' | 'right' | 'justify';
  color?: 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

export const TextComponent: React.FC<TextComponentProps> = ({
  id,
  content,
  htmlContent,
  className,
  variant = 'body',
  align = 'left',
  color = 'primary',
  weight = 'normal',
  italic = false,
  underline = false,
  strikethrough = false,
}) => {
  // Use preview context instead of editor context
  const previewContext = usePreview();
  const isEditMode = previewContext?.isEditMode || false;
  // In live mode, we don't need to update component props
  const updateComponentProps = () => {};

  // Determine if we're using HTML content
  const hasHtmlContent = !!htmlContent;
  const displayContent = htmlContent || content;

  const getTag = () => {
    switch (variant) {
      case 'heading1': return 'h1';
      case 'heading2': return 'h2';
      case 'heading3': return 'h3';
      default: return 'div'; // Changed to div for HTML content support
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'heading1':
        return 'text-4xl font-bold';
      case 'heading2':
        return 'text-3xl font-bold';
      case 'heading3':
        return 'text-2xl font-semibold';
      case 'body':
        return 'text-base';
      case 'caption':
        return 'text-sm';
      default:
        return '';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'primary': return 'text-foreground';
      case 'secondary': return 'text-muted-foreground';
      case 'muted': return 'text-muted';
      case 'success': return 'text-success-500';
      case 'warning': return 'text-warning-500';
      case 'error': return 'text-destructive';
      default: return '';
    }
  };

  const getWeightClasses = () => {
    switch (weight) {
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      default: return '';
    }
  };

  const getAlignmentClasses = () => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      case 'justify': return 'text-justify';
      default: return 'text-left';
    }
  };

  const getTextDecorationClasses = () => {
    return cn(
      italic && 'italic',
      underline && 'underline',
      strikethrough && 'line-through'
    );
  };

  const Tag = getTag();

  const handleContentChange = (newContent: string) => {
    updateComponentProps();
  };

  const combinedClasses = cn(
    getVariantClasses(),
    getColorClasses(),
    getWeightClasses(),
    getAlignmentClasses(),
    getTextDecorationClasses(),
    className
  );

  if (isEditMode) {
    // For edit mode with HTML content, render as editable div
    if (hasHtmlContent) {
      return (
        <Tag
          id={id}
          className={cn(combinedClasses, 'prose prose-sm max-w-none cursor-pointer hover:outline hover:outline-1 hover:outline-blue-200')}
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
        />
      );
    }
    // For plain text, use EditableText
    return (
      <EditableText
        value={displayContent}
        onChange={handleContentChange}
        tagName={Tag}
        htmlMode={false}
        className={combinedClasses}
      />
    );
  }

  // Render with HTML content (sanitized)
  if (hasHtmlContent) {
    return (
      <Tag
        id={id}
        className={cn(combinedClasses, 'prose prose-sm max-w-none')}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
      />
    );
  }

  // Render plain text
  return (
    <Tag
      id={id}
      className={combinedClasses}
    >
      {content}
    </Tag>
  );
};

export default TextComponent;
