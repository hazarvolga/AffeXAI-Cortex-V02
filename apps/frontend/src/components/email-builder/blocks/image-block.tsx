import { Img } from '@react-email/components';
import React from 'react';

interface ImageBlockProps {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
  align?: 'left' | 'center' | 'right';
  borderRadius?: string;
}

export function ImageBlock({
  src = 'https://via.placeholder.com/600x400',
  alt = 'Image',
  width = '600',
  height,
  align = 'center',
  borderRadius = '0',
}: ImageBlockProps) {
  return (
    <div
      style={{
        textAlign: align,
        margin: '16px 0',
      }}
    >
      <Img
        src={src}
        alt={alt}
        width={width}
        height={height}
        style={{
          borderRadius,
          maxWidth: '100%',
          display: 'inline-block',
        }}
      />
    </div>
  );
}
