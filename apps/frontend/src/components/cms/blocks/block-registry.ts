/**
 * Block Registry
 * Central registry for all CMS blocks
 * 
 * V2 System: Clean 12-block architecture
 */

import { TextComponent } from '../text-component';
import { ButtonComponent } from '../button-component';
import { ImageComponent } from '../image-component';
import { ContainerComponent } from '../container-component';
import { CardComponent } from '../card-component';
import { GridComponent } from '../grid-component';

// Import V2 blocks
import {
  V2HeroSimple,
  V2HeroWithImage,
  V2CtaBanner,
  V2FeatureGrid,
  V2ContentText,
  V2ContentSplit,
  V2StatsGrid,
  V2Testimonials,
  V2Pricing,
  V2Faq,
  V2Gallery,
  V2Footer,
} from './v2';

export const blockRegistry = {
  // Basic components
  text: TextComponent,
  button: ButtonComponent,
  image: ImageComponent,
  container: ContainerComponent,
  card: CardComponent,
  grid: GridComponent,

  // V2 blocks (schema-validated)
  'v2-hero-simple': V2HeroSimple,
  'v2-hero-with-image': V2HeroWithImage,
  'v2-cta-banner': V2CtaBanner,
  'v2-feature-grid': V2FeatureGrid,
  'v2-content-text': V2ContentText,
  'v2-content-split': V2ContentSplit,
  'v2-stats-grid': V2StatsGrid,
  'v2-testimonials': V2Testimonials,
  'v2-pricing': V2Pricing,
  'v2-faq': V2Faq,
  'v2-gallery': V2Gallery,
  'v2-footer': V2Footer,
} as const;

export type BlockType = keyof typeof blockRegistry;
export type BlockComponent = typeof blockRegistry[BlockType];

// Type guard to check if a type is a valid block type
export function isBlockType(type: string): type is BlockType {
  return type in blockRegistry;
}
