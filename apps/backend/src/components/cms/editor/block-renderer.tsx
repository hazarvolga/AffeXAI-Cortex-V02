'use client';

import React from 'react';
import { navigationBlocks } from '@/components/cms/blocks/navigation-blocks';
import { heroBlocks } from '@/components/cms/blocks/hero-blocks';
import { contentBlocks } from '@/components/cms/blocks/content-blocks';
import { footerBlocks } from '@/components/cms/blocks/footer-blocks';
import { elementBlocks } from '@/components/cms/blocks/element-blocks';
import { contentVariantBlocks } from '@/components/cms/blocks/content-variants-blocks';
import { specialBlocks } from '@/components/cms/blocks/special-blocks';
import { ecommerceBlocks } from '@/components/cms/blocks/ecommerce-blocks';
import { galleryBlocks } from '@/components/cms/blocks/gallery-blocks';
import { blogRssBlocks } from '@/components/cms/blocks/blog-rss-blocks';
import { socialSharingBlocks } from '@/components/cms/blocks/social-sharing-blocks';
import { testimonialsBlocks } from '@/components/cms/blocks/testimonials-blocks';
import { featuresBlocks } from '@/components/cms/blocks/features-blocks';
import { statsBlocks } from '@/components/cms/blocks/stats-blocks';
import { pricingBlocks } from '@/components/cms/blocks/pricing-blocks';
import { ratingBlocks } from '@/components/cms/blocks/rating-blocks';
import { progressBlocks } from '@/components/cms/blocks/progress-blocks';
import { normalizeComponentId } from '@/lib/cms/components-registry';
import { EditorProvider } from './editor-context'; // Import EditorProvider

interface BlockRendererProps {
  blockId: string;
  props?: any; // Pass props to the block component
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ blockId, props }) => {
  // Normalize legacy IDs
  const normalizedBlockId = normalizeComponentId(blockId);
  
  // Create a map of all blocks by their ID
  const allBlocks = [
    ...navigationBlocks,
    ...heroBlocks,
    ...contentBlocks,
    ...footerBlocks,
    ...elementBlocks,
    ...contentVariantBlocks,
    ...specialBlocks,
    ...ecommerceBlocks,
    ...galleryBlocks,
    ...blogRssBlocks,
    ...socialSharingBlocks,
    ...testimonialsBlocks,
    ...featuresBlocks,
    ...statsBlocks,
    ...pricingBlocks,
    ...ratingBlocks,
    ...progressBlocks,
  ];

  const blockMap = allBlocks.reduce((acc, block) => {
    acc[block.id] = block;
    return acc;
  }, {} as Record<string, typeof allBlocks[0]>);

  const block = blockMap[normalizedBlockId];
  
  if (!block) {
    return (
      <div className="p-4 text-center text-red-500 border-2 border-red-300 border-dashed rounded bg-red-50">
        <p className="font-semibold">Unknown component type: {blockId}</p>
        {blockId !== normalizedBlockId && (
          <p className="text-sm mt-1">Normalized to: {normalizedBlockId}</p>
        )}
        <p className="text-xs mt-2 text-muted-foreground">
          This component is not registered in the component registry
        </p>
      </div>
    );
  }

  // Render the actual block component with props
  const BlockComponent = block.component;
  // Wrap the block component with EditorProvider
  return (
    <EditorProvider onComponentUpdate={() => {}}>
      <BlockComponent props={props} />
    </EditorProvider>
  );
};

export default BlockRenderer;