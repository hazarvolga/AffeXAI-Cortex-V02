import { ComponentFactory } from '../component-factory';
import { ComponentType } from '@affexai/shared-types';

describe('CMS component factory contract', () => {
  it('creates a typed component with entity dates and editable overrides', () => {
    const component = ComponentFactory.createTextComponent('Welcome', { align: 'center' });
    expect(component.type).toBe(ComponentType.TEXT);
    expect(component.props).toMatchObject({ content: 'Welcome', align: 'center', variant: 'body' });
    expect(component.createdAt).toBeInstanceOf(Date);
    expect(component.updatedAt).toBeInstanceOf(Date);
    expect(component.deletedAt).toBeNull();
  });

  it('clones without changing the source identity', () => {
    const original = ComponentFactory.createImageComponent('/logo.png', 'Logo');
    const copy = ComponentFactory.cloneComponent(original);
    expect(copy.id).not.toBe(original.id);
    expect(copy.props).toEqual(original.props);
    expect(copy.createdAt).toBeInstanceOf(Date);
  });
});
