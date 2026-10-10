import ComponentFactory from '../component-factory';

describe('ComponentFactory', () => {
  it('creates a text component with correct default props', () => {
    const component = ComponentFactory.createComponent('text');
    
    expect(component).toHaveProperty('id');
    expect(component).toHaveProperty('type', 'text');
    expect(component).toHaveProperty('props');
    expect(component.props).toHaveProperty('content', 'New text component');
    expect(component.props).toHaveProperty('variant', 'body');
  });

  it('creates a button component with correct default props', () => {
    const component = ComponentFactory.createComponent('button');
    
    expect(component).toHaveProperty('id');
    expect(component).toHaveProperty('type', 'button');
    expect(component).toHaveProperty('props');
    expect(component.props).toHaveProperty('text', 'Click me');
    expect(component.props).toHaveProperty('variant', 'default');
  });

  it('creates an image component with correct default props', () => {
    const component = ComponentFactory.createComponent('image');
    
    expect(component).toHaveProperty('id');
    expect(component).toHaveProperty('type', 'image');
    expect(component).toHaveProperty('props');
    expect(component.props).toHaveProperty('src', '/placeholder-image.jpg');
    expect(component.props).toHaveProperty('alt', 'Placeholder image');
  });

  it('creates a container component with correct default props', () => {
    const component = ComponentFactory.createComponent('container');
    
    expect(component).toHaveProperty('id');
    expect(component).toHaveProperty('type', 'container');
    expect(component).toHaveProperty('props');
    expect(component.props).toHaveProperty('padding', 'md');
    expect(component.props).toHaveProperty('background', 'none');
  });

  it('creates a block component with specified blockId', () => {
    const component = ComponentFactory.createBlockComponent('hero-1');
    
    expect(component).toHaveProperty('id');
    expect(component).toHaveProperty('type', 'block');
    expect(component.props).toHaveProperty('blockId', 'hero-1');
  });

  it('creates a text component with custom content', () => {
    const component = ComponentFactory.createTextComponent('Custom content');
    
    expect(component).toHaveProperty('type', 'text');
    expect(component.props).toHaveProperty('content', 'Custom content');
  });

  it('creates a button component with custom text', () => {
    const component = ComponentFactory.createButtonComponent('Custom button');
    
    expect(component).toHaveProperty('type', 'button');
    expect(component.props).toHaveProperty('text', 'Custom button');
  });

  it('creates an image component with custom src and alt', () => {
    const component = ComponentFactory.createImageComponent('https://example.com/image.jpg', 'Custom alt');
    
    expect(component).toHaveProperty('type', 'image');
    expect(component.props).toHaveProperty('src', 'https://example.com/image.jpg');
    expect(component.props).toHaveProperty('alt', 'Custom alt');
  });

  it('clones a component with a new ID', () => {
    const originalComponent = ComponentFactory.createComponent('text');
    const clonedComponent = ComponentFactory.cloneComponent(originalComponent);
    
    expect(clonedComponent).toHaveProperty('id');
    expect(clonedComponent.id).not.toBe(originalComponent.id);
    expect(clonedComponent.type).toBe(originalComponent.type);
    expect(clonedComponent.props).toEqual(originalComponent.props);
  });

  it('merges custom props with default props', () => {
    const component = ComponentFactory.createComponent('text', { 
      content: 'Custom content',
      color: 'primary'
    });
    
    expect(component.props).toHaveProperty('content', 'Custom content');
    expect(component.props).toHaveProperty('color', 'primary');
    expect(component.props).toHaveProperty('variant', 'body'); // default prop preserved
  });

  it('creates components with unique IDs', () => {
    const component1 = ComponentFactory.createComponent('text');
    const component2 = ComponentFactory.createComponent('text');
    
    expect(component1.id).not.toBe(component2.id);
  });
});