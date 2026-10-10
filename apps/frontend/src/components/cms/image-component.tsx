'use client';

import React, { useEffect, useState } from 'react';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { usePreview } from '@/components/cms/preview-context';
import { EditableText } from '@/components/cms/editor/editable-text';

interface ImageComponentProps {
  id: string;
  src?: string;
  mediaId?: string | null;
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
  src: initialSrc,
  mediaId,
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
  
  // Helper: Check if a string looks like a UUID (mediaId)
  const isUUID = (str: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  };
  
  // Don't use initialSrc if it looks like a UUID (it's a mediaId, not a URL)
  const validInitialSrc = initialSrc && !isUUID(initialSrc) ? initialSrc : '';
  
  const [src, setSrc] = useState<string>(validInitialSrc);
  const [loading, setLoading] = useState<boolean>(!!mediaId);

  // Fetch media URL from mediaId
  useEffect(() => {
    const fetchMediaUrl = async () => {
      if (mediaId) {
        try {
          setLoading(true);
          // Call media API to get URL
          const response = await fetch(`/api/media/${mediaId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.url) {
              setSrc(data.url);
            } else {
              setSrc(validInitialSrc);
            }
          } else {
            setSrc(validInitialSrc);
          }
        } catch (error) {
          console.error('Error fetching media URL:', error);
          setSrc(validInitialSrc);
        } finally {
          setLoading(false);
        }
      } else {
        setSrc(validInitialSrc);
        setLoading(false);
      }
    };

    fetchMediaUrl();
  }, [mediaId, validInitialSrc]);

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

  // Don't render the image if src is empty or still loading
  if (loading) {
    return (
      <figure id={id} className="relative">
        <div className={cn("bg-gray-100 border rounded-xl w-full h-48 flex items-center justify-center animate-pulse", className)}>
          <span className="text-gray-400">Loading image...</span>
        </div>
      </figure>
    );
  }

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
      <NextImage
        src={src}
        alt={alt}
        className={imageClasses}
        width={typeof width === 'number' ? width : parseInt(width as string) || 800}
        height={typeof height === 'number' ? height : parseInt(height as string) || 600}
        loading={lazy ? 'lazy' : 'eager'}
      />
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