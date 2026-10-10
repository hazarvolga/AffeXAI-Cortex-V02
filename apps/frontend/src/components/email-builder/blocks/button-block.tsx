import { Button } from '@react-email/components';
import React from 'react';

interface ButtonBlockProps {
  text?: string;
  href?: string;
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  borderRadius?: string;
  paddingX?: string;
  paddingY?: string;
  align?: 'left' | 'center' | 'right';
}

export function ButtonBlock({
  text = 'Click Here',
  href = '#',
  backgroundColor = '#007bff',
  color = '#ffffff',
  fontSize = '16px',
  fontWeight = '600',
  borderRadius = '4px',
  paddingX = '32px',
  paddingY = '12px',
  align = 'center',
}: ButtonBlockProps) {
  return (
    <div
      style={{
        textAlign: align,
        margin: '16px 0',
      }}
    >
      <Button
        href={href}
        style={{
          backgroundColor,
          color,
          fontSize,
          fontWeight,
          borderRadius,
          padding: `${paddingY} ${paddingX}`,
          textDecoration: 'none',
          display: 'inline-block',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {text}
      </Button>
    </div>
  );
}
