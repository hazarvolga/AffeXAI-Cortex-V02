import React from 'react';
import { TextComponent } from './text-component';
import { ButtonComponent } from './button-component';
import { ImageComponent } from './image-component';
import { ContainerComponent } from './container-component';
import { CardComponent } from './card-component';
import { GridComponent } from './grid-component';
import { PreviewProvider } from './preview-context';
import { blockRegistry } from './block-registry';
import { mergeComponentClasses } from '@/lib/cms/style-utils';

// Define the structure of a CMS component
interface CmsComponent {
  id: string;
  type: 'text' | 'button' | 'image' | 'container' | 'card' | 'grid' | 'block';
  props: any;
  children?: CmsComponent[];
  orderIndex?: number;
  blockId?: string; // Block ID from backend (new field)
  blockType?: string; // Block type from backend
  blockCategory?: string; // Block category from backend
}

interface PageRendererProps {
  components: CmsComponent[];
}

export const PageRenderer: React.FC<PageRendererProps> = ({ components }) => {
  const renderComponent = (component: CmsComponent): React.ReactNode => {
    // Handle block-based components (from visual editor)
    // Support both component.blockId (from backend) and component.props.blockId (legacy)
    const blockId = component.blockId || component.props?.blockId;
    
    if (component.type === 'block' && blockId) {
      const BlockComponent = blockRegistry[blockId as keyof typeof blockRegistry];

      if (BlockComponent) {
        // Extract Advanced tab properties
        const { marginTop, marginBottom, marginLeft, marginRight, paddingTop, paddingBottom,
                paddingLeft, paddingRight, display, maxWidth, minHeight, shadow, opacity,
                width, height, ...otherProps } = component.props;

        // Build advancedProps object
        const advancedProps = {
          marginTop, marginBottom, marginLeft, marginRight,
          paddingTop, paddingBottom, paddingLeft, paddingRight,
          display, maxWidth, minHeight, shadow, opacity, width, height
        };

        // Merge component classes with Advanced properties
        const mergedClassName = mergeComponentClasses(
          component.props.className || '',
          advancedProps,
          component.props.cssClasses || ''
        );

        return <BlockComponent key={component.id} {...otherProps} className={mergedClassName} />;
      }

      // Component not found in registry - show detailed error
      console.error(`Unknown component type: ${blockId}`);
      console.error('Component props:', component.props);
      console.error('Available blocks:', Object.keys(blockRegistry));

      if (process.env.NODE_ENV === 'development') {
        return (
          <div key={component.id} className="border-2 border-red-500 bg-red-50 p-4 my-4">
            <p className="text-red-700 font-bold">Unknown component type: {blockId}</p>
            <p className="text-sm text-red-600 mt-2">This component is not registered in the component registry</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-red-600">Debug info</summary>
              <pre className="text-xs mt-2 overflow-auto">{JSON.stringify({ blockId, availableBlocks: Object.keys(blockRegistry) }, null, 2)}</pre>
            </details>
          </div>
        );
      }

      return null;
    }

    // Handle legacy component types
    switch (component.type) {
      case 'text':
        return <TextComponent key={component.id} {...component.props} />;

      case 'button':
        return <ButtonComponent key={component.id} {...component.props} />;

      case 'image':
        return <ImageComponent key={component.id} {...component.props} />;

      case 'container':
        return (
          <ContainerComponent key={component.id} {...component.props}>
            {component.children?.map(renderComponent)}
          </ContainerComponent>
        );

      case 'card':
        return (
          <CardComponent key={component.id} {...component.props}>
            {component.children?.map(renderComponent)}
          </CardComponent>
        );

      case 'grid':
        return (
          <GridComponent key={component.id} {...component.props}>
            {component.children?.map(renderComponent)}
          </GridComponent>
        );

      default:
        console.warn(`Unknown component type: ${component.type}`);
        return null;
    }
  };

  // Sort components by orderIndex to ensure correct rendering order
  const sortedComponents = [...components].sort((a, b) => {
    const orderA = a.orderIndex ?? 999;
    const orderB = b.orderIndex ?? 999;
    return orderA - orderB;
  });

  // Group consecutive special-feature-card-single components into grids
  const groupedComponents: (CmsComponent | CmsComponent[])[] = [];
  let currentCardGroup: CmsComponent[] = [];

  sortedComponents.forEach((component, index) => {
    const componentBlockId = (component as any).blockId || component.props?.blockId;
    const isCardSingle = component.type === 'block' && componentBlockId === 'special-feature-card-single';

    if (isCardSingle) {
      currentCardGroup.push(component);
    } else {
      // If we have accumulated cards, push them as a group
      if (currentCardGroup.length > 0) {
        groupedComponents.push([...currentCardGroup]);
        currentCardGroup = [];
      }
      // Push the non-card component
      groupedComponents.push(component);
    }
  });

  // Don't forget the last group if it exists
  if (currentCardGroup.length > 0) {
    groupedComponents.push([...currentCardGroup]);
  }

  return (
    <PreviewProvider initialMode="public">
      <div className="cms-page">
        {groupedComponents.map((item, groupIndex) => {
          // If it's an array, it's a group of cards - wrap in grid
          if (Array.isArray(item)) {
            return (
              <div key={`card-group-${groupIndex}`} className="container mx-auto py-16 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {item.map(renderComponent)}
                </div>
              </div>
            );
          }
          // Otherwise, it's a single component
          return renderComponent(item);
        })}
      </div>
    </PreviewProvider>
  );
};

export default PageRenderer;
