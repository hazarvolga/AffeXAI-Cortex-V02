import React from 'react';
import { cn } from '@/lib/utils';
import { usePreview } from '@/components/cms/preview-context';
import { EditableText } from '@/components/cms/editor/editable-text';
import { MediaReplacer } from '@/components/cms/editor/media-replacer';
import { Media } from '@/lib/media/types';

interface ImageComponentProps {
  id: string;
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  fit?: 'cover' | 'contain' | 'fill' | 'none';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  caption?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  borderColor?: 'default' | 'primary' | 'secondary';
  lazy?: boolean;
}

export const ImageComponent: React.FC<ImageComponentProps> = ({
  id,
  src,
  alt,
  className,
  width,
  height,
  fit = 'cover',
  position = 'center',
  caption,
  rounded = 'none',
  shadow = 'none',
  border = false,
  borderColor = 'default',
  lazy = true,
}) => {
  // Use preview context instead of editor context
  const previewContext = usePreview();
  const isEditMode = previewContext?.isEditMode || false;
  // In live mode, we don't need to update component props
  const updateComponentProps = () => {};

  const getRoundedClass = () => {
    switch (rounded) {
      case 'sm': return 'rounded-sm';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'full': return 'rounded-full';
      default: return '';
    }
  };

  const getShadowClass = () => {
    switch (shadow) {
      case 'sm': return 'shadow-sm';
      case 'md': return 'shadow';
      case 'lg': return 'shadow-lg';
      default: return '';
    }
  };

  const getBorderColorClass = () => {
    switch (borderColor) {
      case 'primary': return 'border-primary';
      case 'secondary': return 'border-secondary';
      default: return 'border-border';
    }
  };

  const handleCaptionChange = (newCaption: string) => {
    updateComponentProps();
  };

  const handleMediaReplace = (media: Media) => {
    updateComponentProps();
  };

  const imageClasses = cn(
    'block',
    getRoundedClass(),
    getShadowClass(),
    fit === 'cover' && 'object-cover',
    fit === 'contain' && 'object-contain',
    fit === 'fill' && 'object-fill',
    fit === 'none' && 'object-none',
    position === 'center' && 'object-center',
    position === 'top' && 'object-top',
    position === 'bottom' && 'object-bottom',
    position === 'left' && 'object-left',
    position === 'right' && 'object-right',
    border && ['border', getBorderColorClass()],
    className
  );

  // Don't render the image if src is empty
  if (!src) {
    return (
      <figure id={id} className="relative">
        <div className={cn("bg-gray-200 border-2 border-dashed rounded-xl w-full h-48 flex items-center justify-center", className)}>
          <span className="text-gray-500">No image selected</span>
        </div>
        {caption !== undefined && (
          isEditMode ? (
            <EditableText
              value={caption}
              onChange={handleCaptionChange}
              tagName="figcaption"
              className="text-center text-sm text-muted-foreground mt-2 outline-none focus:outline focus:outline-blue-300"
              placeholder="Enter caption..."
            />
          ) : (
            <figcaption className="text-center text-sm text-muted-foreground mt-2">
              {caption}
            </figcaption>
          )
        )}
      </figure>
    );
  }

  return (
    <figure id={id} className="relative">
      <img
        src={src}
        alt={alt}
        className={imageClasses}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
      />
      {isEditMode && (
        <div className="absolute top-2 right-2">
          <MediaReplacer 
            currentSrc={src}
            onMediaSelect={handleMediaReplace}
          />
        </div>
      )}
      {caption !== undefined && (
        isEditMode ? (
          <EditableText
            value={caption}
            onChange={handleCaptionChange}
            tagName="figcaption"
            className="text-center text-sm text-muted-foreground mt-2 outline-none focus:outline focus:outline-blue-300"
            placeholder="Enter caption..."
          />
        ) : (
          <figcaption className="text-center text-sm text-muted-foreground mt-2">
            {caption}
          </figcaption>
        )
      )}
    </figure>
  );
};

export default ImageComponent;