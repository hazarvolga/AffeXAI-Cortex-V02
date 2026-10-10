// Component Factory
// Factory pattern for creating new CMS components

import { v4 as uuidv4 } from 'uuid';
import { Component } from '@/lib/cms/cms-service';

// Default props for each component type
const defaultComponentProps = {
  text: {
    content: 'New text component',
    variant: 'body',
    align: 'left',
  },
  button: {
    text: 'Click me',
    variant: 'default',
    size: 'default',
  },
  image: {
    src: '/placeholder-image.jpg',
    alt: 'Placeholder image',
  },
  container: {
    padding: 'md',
    background: 'none',
  },
  card: {
    padding: 'md',
    rounded: 'lg',
  },
  grid: {
    columns: 3,
    gap: 'md',
  },
  block: {
    blockId: '',
    className: 'w-full',
  }
};

// Factory class for creating components
export class ComponentFactory {
  static createComponent(type: Component['type'], customProps: Record<string, any> = {}): Component {
    // Generate a unique ID for the component
    const id = `comp-${uuidv4()}`;
    
    // Get default props for the component type
    const defaultProps = defaultComponentProps[type] || {};
    
    // Merge default props with custom props
    const props = { ...defaultProps, ...customProps };
    
    // Create the component object
    const component: Component = {
      id,
      pageId: '',
      parentId: null,
      type,
      props,
      orderIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return component;
  }
  
  static createBlockComponent(blockId: string, customProps: Record<string, any> = {}): Component {
    return this.createComponent('block', {
      blockId,
      ...customProps
    });
  }
  
  static createTextComponent(content: string, customProps: Record<string, any> = {}): Component {
    return this.createComponent('text', {
      content,
      ...customProps
    });
  }
  
  static createButtonComponent(text: string, customProps: Record<string, any> = {}): Component {
    return this.createComponent('button', {
      text,
      ...customProps
    });
  }
  
  static createImageComponent(src: string, alt: string, customProps: Record<string, any> = {}): Component {
    return this.createComponent('image', {
      src,
      alt,
      ...customProps
    });
  }
  
  static createContainerComponent(customProps: Record<string, any> = {}): Component {
    return this.createComponent('container', customProps);
  }
  
  static createCardComponent(customProps: Record<string, any> = {}): Component {
    return this.createComponent('card', customProps);
  }
  
  static createGridComponent(columns: number, customProps: Record<string, any> = {}): Component {
    return this.createComponent('grid', {
      columns,
      ...customProps
    });
  }
  
  // Clone an existing component with a new ID
  static cloneComponent(component: Component): Component {
    const clonedComponent = { ...component };
    clonedComponent.id = `comp-${uuidv4()}`;
    clonedComponent.createdAt = new Date().toISOString();
    clonedComponent.updatedAt = new Date().toISOString();
    return clonedComponent;
  }
  
  // Create a component from a template
  static createFromTemplate(template: Partial<Component>): Component {
    const component = {
      id: `comp-${uuidv4()}`,
      pageId: '',
      parentId: null,
      type: 'text' as Component['type'],
      props: {},
      orderIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...template
    };
    
    // Ensure required fields are present
    if (!component.type) component.type = 'text';
    if (!component.props) component.props = {};
    
    return component as Component;
  }
}

export default ComponentFactory;