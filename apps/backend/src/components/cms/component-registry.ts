// Component Registry
// Centralized configuration for all CMS components and blocks

import { TextComponent } from './text-component';
import { ButtonComponent } from './button-component';
import { ImageComponent } from './image-component';
import { ContainerComponent } from './container-component';
import { CardComponent } from './card-component';
import { GridComponent } from './grid-component';

// Import all block components
import { navigationBlocks } from './blocks/navigation-blocks';
import { heroBlocks } from './blocks/hero-blocks';
import { contentBlocks } from './blocks/content-blocks';
import { footerBlocks } from './blocks/footer-blocks';
import { elementBlocks } from './blocks/element-blocks';
import { contentVariantBlocks } from './blocks/content-variants-blocks';
import { specialBlocks } from './blocks/special-blocks';
import { ecommerceBlocks } from './blocks/ecommerce-blocks';
import { galleryBlocks } from './blocks/gallery-blocks';
import { blogRssBlocks } from './blocks/blog-rss-blocks';
import { socialSharingBlocks } from './blocks/social-sharing-blocks';

// Basic component registry
export const componentRegistry = {
  text: TextComponent,
  button: ButtonComponent,
  image: ImageComponent,
  container: ContainerComponent,
  card: CardComponent,
  grid: GridComponent,
};

// Block registry
export const blockRegistry = {
  ...navigationBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block.component }), {}),
  ...heroBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block.component }), {}),
  ...contentBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block.component }), {}),
  ...footerBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block.component }), {}),
  ...elementBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block.component }), {}),
  ...contentVariantBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block.component }), {}),
  ...specialBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block.component }), {}),
  ...ecommerceBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block.component }), {}),
  ...galleryBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block.component }), {}),
  ...blogRssBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block.component }), {}),
  ...socialSharingBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block.component }), {}),
};

// Motion presets for animations
export const motionPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  },
  slideInLeft: {
    initial: { x: -50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.3 }
  },
  slideInRight: {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.3 }
  },
  slideInUp: {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.3 }
  },
  slideInDown: {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.3 }
  },
  scaleIn: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.3 }
  },
  bounce: {
    initial: { y: 0 },
    animate: { y: [-10, 0, -5, 0] },
    transition: { duration: 0.5 }
  }
};

// Theme configuration
export const themeConfig = {
  colors: {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    background: 'bg-white',
    foreground: 'text-gray-900',
    muted: 'text-gray-500',
  },
  spacing: {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    '2xl': 'p-10',
  },
  borderRadius: {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  },
  shadows: {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  }
};

// Export all block configs for easy access
export const allBlockConfigs = {
  ...navigationBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block }), {}),
  ...heroBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block }), {}),
  ...contentBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block }), {}),
  ...footerBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block }), {}),
  ...elementBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block }), {}),
  ...contentVariantBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block }), {}),
  ...specialBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block }), {}),
  ...ecommerceBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block }), {}),
  ...galleryBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block }), {}),
  ...blogRssBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block }), {}),
  ...socialSharingBlocks.reduce((acc, block) => ({ ...acc, [block.id]: block }), {}),
};

export default {
  componentRegistry,
  blockRegistry,
  motionPresets,
  themeConfig,
  allBlockConfigs
};