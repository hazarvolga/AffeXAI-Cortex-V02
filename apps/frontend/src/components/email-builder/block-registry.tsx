import React from 'react';
import {
  TextBlock,
  HeadingBlock,
  ButtonBlock,
  ImageBlock,
  DividerBlock,
} from './blocks';

/**
 * Block Registry - Maps block types to React Email components
 * Used for server-side rendering of email templates
 */

export interface Block {
  id: string;
  type: string;
  properties: Record<string, any>;
  styles: Record<string, any>;
}

interface BlockComponentProps {
  block: Block;
}

export const BlockRegistry: Record<string, React.ComponentType<BlockComponentProps>> = {
  text: ({ block }) => (
    <TextBlock
      content={block.properties.content}
      color={block.styles.color}
      fontSize={block.styles.fontSize}
      fontWeight={block.styles.fontWeight}
      textAlign={block.styles.textAlign}
      lineHeight={block.styles.lineHeight}
    />
  ),

  heading: ({ block }) => (
    <HeadingBlock
      level={block.properties.level}
      content={block.properties.content}
      color={block.styles.color}
      fontSize={block.styles.fontSize}
      fontWeight={block.styles.fontWeight}
      textAlign={block.styles.textAlign}
      marginTop={block.styles.marginTop}
      marginBottom={block.styles.marginBottom}
    />
  ),

  button: ({ block }) => (
    <ButtonBlock
      text={block.properties.text}
      href={block.properties.url}
      backgroundColor={block.styles.backgroundColor}
      color={block.styles.color}
      fontSize={block.styles.fontSize}
      fontWeight={block.styles.fontWeight}
      borderRadius={block.styles.borderRadius}
      paddingX={block.styles.paddingX}
      paddingY={block.styles.paddingY}
      align={block.styles.align}
    />
  ),

  image: ({ block }) => (
    <ImageBlock
      src={block.properties.src}
      alt={block.properties.alt}
      width={block.properties.width}
      height={block.properties.height}
      align={block.styles.align}
      borderRadius={block.styles.borderRadius}
    />
  ),

  divider: ({ block }) => (
    <DividerBlock
      color={block.styles.color}
      height={block.styles.height}
      marginTop={block.styles.marginTop}
      marginBottom={block.styles.marginBottom}
      borderStyle={block.styles.borderStyle}
    />
  ),
};

/**
 * Get block component by type
 */
export function getBlockComponent(blockType: string): React.ComponentType<BlockComponentProps> | null {
  return BlockRegistry[blockType] || null;
}

/**
 * Check if block type is supported
 */
export function isBlockSupported(blockType: string): boolean {
  return blockType in BlockRegistry;
}

/**
 * Get all supported block types
 */
export function getSupportedBlockTypes(): string[] {
  return Object.keys(BlockRegistry);
}
