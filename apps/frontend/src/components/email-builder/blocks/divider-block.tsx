import { Hr } from '@react-email/components';
import React from 'react';

interface DividerBlockProps {
  color?: string;
  height?: string;
  marginTop?: string;
  marginBottom?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
}

export function DividerBlock({
  color = '#e0e0e0',
  height = '1px',
  marginTop = '16px',
  marginBottom = '16px',
  borderStyle = 'solid',
}: DividerBlockProps) {
  return (
    <Hr
      style={{
        borderColor: color,
        borderWidth: height,
        borderStyle,
        margin: `${marginTop} 0 ${marginBottom} 0`,
        width: '100%',
      }}
    />
  );
}
