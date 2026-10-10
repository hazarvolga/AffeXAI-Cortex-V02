// Component Factory
// Factory pattern for creating new CMS components

import { v4 as uuidv4 } from 'uuid';
import { ComponentType } from '@affexai/shared-types';
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
    const defaultProps = defaultComponentProps[type];

    // Merge default props with custom props
    const props = { ...defaultProps, ...customProps };

    // Create the component object
    const component: Component = {
      id,
      pageId: '',
      parentId: null,
      deletedAt: null,
      type,
      props,
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return component;
  }

  static createBlockComponent(blockId: string, customProps: Record<string, any> = {}): Component {
    return this.createComponent(ComponentType.BLOCK, {
      blockId,
      ...customProps
    });
  }

  static createTextComponent(content: string, customProps: Record<string, any> = {}): Component {
    return this.createComponent(ComponentType.TEXT, {
      content,
      ...customProps
    });
  }

  static createButtonComponent(text: string, customProps: Record<string, any> = {}): Component {
    return this.createComponent(ComponentType.BUTTON, {
      text,
      ...customProps
    });
  }

  static createImageComponent(src: string, alt: string, customProps: Record<string, any> = {}): Component {
    return this.createComponent(ComponentType.IMAGE, {
      src,
      alt,
      ...customProps
    });
  }

  static createContainerComponent(customProps: Record<string, any> = {}): Component {
    return this.createComponent(ComponentType.CONTAINER, customProps);
  }

  static createCardComponent(customProps: Record<string, any> = {}): Component {
    return this.createComponent(ComponentType.CARD, customProps);
  }

  static createGridComponent(columns: number, customProps: Record<string, any> = {}): Component {
    return this.createComponent(ComponentType.GRID, {
      columns,
      ...customProps
    });
  }

  // Clone an existing component with a new ID
  static cloneComponent(component: Component): Component {
    const clonedComponent = { ...component };
    clonedComponent.id = `comp-${uuidv4()}`;
    clonedComponent.createdAt = new Date();
    clonedComponent.updatedAt = new Date();
    return clonedComponent;
  }

  // Create a component from a template
  static createFromTemplate(template: Partial<Component>): Component {
    const component = {
      id: `comp-${uuidv4()}`,
      pageId: '',
      parentId: null,
      deletedAt: null,
      type: ComponentType.TEXT,
      props: {},
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...template
    };

    // Ensure required fields are present
    if (!component.type) component.type = ComponentType.TEXT;
    if (!component.props) component.props = {};

    return component as Component;
  }
}

export default ComponentFactory;