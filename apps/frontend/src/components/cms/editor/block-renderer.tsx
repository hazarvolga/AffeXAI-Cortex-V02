'use client';

/**
 * Block Renderer
 * Renders blocks from the V2 block registry
 */

import React from 'react';
import { blockRegistry, isBlockType } from '@/components/cms/block-registry';

interface BlockRendererProps {
  blockId: string;
  props?: any;
  isEditing?: boolean;
  onPropChange?: (key: string, value: any) => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  blockId,
  props,
  isEditing = false,
  onPropChange,
}) => {
  // Check if block exists in registry
  if (!isBlockType(blockId)) {
    return (
      <div className="p-4 text-center text-red-500 border-2 border-red-300 border-dashed rounded bg-red-50">
        <p className="font-semibold">Unknown component type: {blockId}</p>
        <p className="text-xs mt-2 text-muted-foreground">
          This component is not registered in the block registry
        </p>
      </div>
    );
  }

  const BlockComponent = blockRegistry[blockId];
  return <BlockComponent {...props} isEditing={isEditing} onPropChange={onPropChange} />;
};

export default BlockRenderer;