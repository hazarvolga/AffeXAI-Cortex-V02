import { Text } from '@react-email/components';
import React from 'react';

interface TextBlockProps {
  content?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: string;
}

export function TextBlock({
  content = 'Enter your text here',
  color = '#333333',
  fontSize = '16px',
  fontWeight = 'normal',
  textAlign = 'left',
  lineHeight = '1.5',
}: TextBlockProps) {
  return (
    <Text
      style={{
        color,
        fontSize,
        fontWeight,
        textAlign,
        lineHeight,
        margin: '0 0 16px 0',
      }}
    >
      {content}
    </Text>
  );
}
