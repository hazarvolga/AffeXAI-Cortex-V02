import React from 'react';
import { cn } from '@/lib/utils';
import { EditableText } from '@/components/cms/editor/editable-text';
import { usePreview } from '@/components/cms/preview-context';

interface TextComponentProps {
  id: string;
  content: string;
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

  const getTag = () => {
    switch (variant) {
      case 'heading1': return 'h1';
      case 'heading2': return 'h2';
      case 'heading3': return 'h3';
      default: return 'p';
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

  if (isEditMode) {
    return (
      <EditableText
        value={content}
        onChange={handleContentChange}
        tagName={Tag}
        className={cn(
          getVariantClasses(),
          getColorClasses(),
          getWeightClasses(),
          getAlignmentClasses(),
          getTextDecorationClasses(),
          className
        )}
      />
    );
  }

  return (
    <Tag
      id={id}
      className={cn(
        getVariantClasses(),
        getColorClasses(),
        getWeightClasses(),
        getAlignmentClasses(),
        getTextDecorationClasses(),
        className
      )}
    >
      {content}
    </Tag>
  );
};

export default TextComponent;