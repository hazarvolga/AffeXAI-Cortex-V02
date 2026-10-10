import { Heading } from '@react-email/components';
import React from 'react';

interface HeadingBlockProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  content?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  marginTop?: string;
  marginBottom?: string;
}

export function HeadingBlock({
  level = 2,
  content = 'Heading',
  color = '#000000',
  fontSize,
  fontWeight = 'bold',
  textAlign = 'left',
  marginTop = '24px',
  marginBottom = '16px',
}: HeadingBlockProps) {
  const defaultFontSizes = {
    1: '32px',
    2: '28px',
    3: '24px',
    4: '20px',
    5: '18px',
    6: '16px',
  };

  const as = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  return (
    <Heading
      as={as}
      style={{
        color,
        fontSize: fontSize || defaultFontSizes[level],
        fontWeight,
        textAlign,
        margin: `${marginTop} 0 ${marginBottom} 0`,
        lineHeight: '1.2',
      }}
    >
      {content}
    </Heading>
  );
}
