'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
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

// Create a registry of all components
const componentRegistry: Record<string, React.ComponentType<any>> = {
  text: TextComponent,
  button: ButtonComponent,
  image: ImageComponent,
  container: ContainerComponent,
  card: CardComponent,
  grid: GridComponent,
};

// Create a registry of all block components
const blockRegistry: Record<string, React.ComponentType<any>> = {
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
const motionPresets = {
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

interface PageBuilderRendererProps {
  components: any[];
  layoutOptions?: {
    showHeader?: boolean;
    showFooter?: boolean;
    fullWidth?: boolean;
    backgroundColor?: string;
    showTitle?: boolean;
  };
  className?: string;
  pageTitle?: string;
}

export const PageBuilderRenderer: React.FC<PageBuilderRendererProps> = ({ 
  components = [], 
  layoutOptions = {},
  className = '',
  pageTitle = ''
}) => {
  const {
    showHeader = true,
    showFooter = true,
    fullWidth = false,
    backgroundColor = 'bg-background',
    showTitle = true
  } = layoutOptions;

  // Render a single component
  const renderComponent = (component: any): React.ReactNode => {
    if (!component) return null;

    const { id, type, props = {}, children = [] } = component;
    
    // Handle block components
    if (type === 'block' && props.blockId) {
      const BlockComponent = blockRegistry[props.blockId];
      if (!BlockComponent) {
        // SSR-friendly fallback
        if (typeof window === 'undefined') {
          return <div key={id} data-block-id={props.blockId}>Block component placeholder</div>;
        }
        
        return (
          <div key={id} className="p-4 text-center text-muted-foreground border border-dashed rounded">
            Block component not found: {props.blockId}
          </div>
        );
      }
      
      // Apply motion presets if available and we're on the client
      const motionPreset = props.motionPreset && typeof window !== 'undefined' 
        ? motionPresets[props.motionPreset as keyof typeof motionPresets] 
        : undefined;
      
      // Apply Tailwind transition classes if provided
      const transitionClasses = props.transitionClasses || '';
      
      // Handle container structure
      const containerType = props.containerType || 'default';
      const containerClasses = getContainerClasses(containerType, props.containerWidth);
      
      if (motionPreset) {
        return (
          <motion.div
            key={id}
            {...motionPreset}
            className={`${transitionClasses} ${containerClasses}`}
          >
            <BlockComponent {...props} />
          </motion.div>
        );
      }
      
      return (
        <div key={id} className={`${transitionClasses} ${containerClasses}`}>
          <BlockComponent {...props} />
        </div>
      );
    }
    
    // Handle basic components
    const Component = componentRegistry[type];
    if (!Component) {
      // SSR-friendly fallback
      if (typeof window === 'undefined') {
        return <div key={id} data-component-type={type}>Component placeholder</div>;
      }
      
      return (
        <div key={id} className="p-4 text-center text-muted-foreground border border-dashed rounded">
          Unknown component type: {type}
        </div>
      );
    }
    
    // Render children recursively for container components
    const childComponents = children?.map(renderComponent) || [];
    
    // Apply motion presets if available and we're on the client
    const motionPreset = props.motionPreset && typeof window !== 'undefined' 
      ? motionPresets[props.motionPreset as keyof typeof motionPresets] 
      : undefined;
    
    // Apply Tailwind transition classes if provided
    const transitionClasses = props.transitionClasses || '';
    
    // Handle container structure for basic components
    const containerType = props.containerType || 'default';
    const containerClasses = getContainerClasses(containerType, props.containerWidth);
    
    if (motionPreset) {
      return (
        <motion.div
          key={id}
          {...motionPreset}
          className={`${transitionClasses} ${containerClasses}`}
        >
          <Component {...props}>
            {childComponents}
          </Component>
        </motion.div>
      );
    }
    
    return (
      <div key={id} className={`${transitionClasses} ${containerClasses}`}>
        <Component {...props}>
          {childComponents}
        </Component>
      </div>
    );
  };

  // Helper function to get container classes based on type and width
  const getContainerClasses = (containerType: string, containerWidth?: string) => {
    switch (containerType) {
      case 'full':
        return 'w-full';
      case 'constrained':
        return 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
      case 'narrow':
        return 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8';
      default:
        // Use custom width if provided, otherwise default to constrained
        return containerWidth ? containerWidth : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
    }
  };

  // Render all components
  const renderedComponents = useMemo(() => {
    return components.map(renderComponent);
  }, [components]);

  // Determine container classes based on layout options
  const containerClasses = [
    backgroundColor,
    fullWidth ? 'w-full' : 'cms-container-responsive',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {showTitle && pageTitle && (
        <div className="cms-responsive-padding">
          <h1 className="text-4xl font-bold mb-4 cms-animate-fade-in">{pageTitle}</h1>
        </div>
      )}
      
      {showHeader && (
        <header className="cms-responsive-padding border-b cms-animate-slide-up">
          <nav className="flex justify-between items-center">
            <div className="text-xl font-bold">Logo</div>
            <ul className="flex space-x-6">
              <li><a href="#" className="hover:underline cms-transition">Home</a></li>
              <li><a href="#" className="hover:underline cms-transition">About</a></li>
              <li><a href="#" className="hover:underline cms-transition">Services</a></li>
              <li><a href="#" className="hover:underline cms-transition">Contact</a></li>
            </ul>
          </nav>
        </header>
      )}
      
      <main className={showHeader || showFooter ? 'cms-responsive-padding' : ''}>
        {renderedComponents}
      </main>
      
      {showFooter && (
        <footer className="cms-responsive-padding border-t mt-8 cms-animate-slide-up">
          <div className="text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

// Server-side compatible version
export const PageBuilderRendererSSR: React.FC<PageBuilderRendererProps> = ({ 
  components = [], 
  layoutOptions = {},
  className = '',
  pageTitle = ''
}) => {
  const {
    showHeader = true,
    showFooter = true,
    fullWidth = false,
    backgroundColor = 'bg-background',
    showTitle = true
  } = layoutOptions;

  // SSR-friendly component rendering
  const renderComponentSSR = (component: any): React.ReactNode => {
    if (!component) return null;

    const { id, type, props = {}, children = [] } = component;
    
    // Handle block components
    if (type === 'block' && props.blockId) {
      return <div key={id} data-block-id={props.blockId}>Block component placeholder</div>;
    }
    
    // Handle basic components
    return <div key={id} data-component-type={type}>Component placeholder</div>;
  };

  // Render all components for SSR
  const renderedComponents = components.map(renderComponentSSR);

  // Determine container classes based on layout options
  const containerClasses = [
    backgroundColor,
    fullWidth ? 'w-full' : 'cms-container-responsive',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {showTitle && pageTitle && (
        <div className="cms-responsive-padding">
          <h1 className="text-4xl font-bold mb-4">{pageTitle}</h1>
        </div>
      )}
      
      {showHeader && (
        <header className="cms-responsive-padding border-b">
          <nav className="flex justify-between items-center">
            <div className="text-xl font-bold">Logo</div>
            <ul className="flex space-x-6">
              <li><a href="#">Home</a></li>
              <li><a href="#">About</a></li>
              <li><a href="#">Services</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </nav>
        </header>
      )}
      
      <main className={showHeader || showFooter ? 'cms-responsive-padding' : ''}>
        {renderedComponents}
      </main>
      
      {showFooter && (
        <footer className="cms-responsive-padding border-t mt-8">
          <div className="text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default PageBuilderRenderer;