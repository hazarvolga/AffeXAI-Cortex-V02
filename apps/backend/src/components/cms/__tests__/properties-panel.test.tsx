import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertiesPanel } from '../editor/properties-panel';

describe('PropertiesPanel', () => {
  const defaultProps = {
    componentType: '',
    componentProps: {},
    onPropsChange: jest.fn(),
  };

  it('renders empty state when no component is selected', () => {
    render(<PropertiesPanel {...defaultProps} />);
    
    expect(screen.getByText('Select a component to edit its properties')).toBeInTheDocument();
  });

  it('renders text component properties', () => {
    const props = {
      ...defaultProps,
      componentType: 'text',
      componentProps: {
        content: 'Test content',
        variant: 'heading1',
        align: 'center',
      },
    };
    
    render(<PropertiesPanel {...props} />);
    
    expect(screen.getByText('Text Properties')).toBeInTheDocument();
    expect(screen.getByLabelText('Content')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test content')).toBeInTheDocument();
  });

  it('renders button component properties', () => {
    const props = {
      ...defaultProps,
      componentType: 'button',
      componentProps: {
        text: 'Click me',
        variant: 'default',
        size: 'lg',
      },
    };
    
    render(<PropertiesPanel {...props} />);
    
    expect(screen.getByText('Button Properties')).toBeInTheDocument();
    expect(screen.getByLabelText('Button Text')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Click me')).toBeInTheDocument();
  });

  it('renders image component properties', () => {
    const props = {
      ...defaultProps,
      componentType: 'image',
      componentProps: {
        src: 'https://example.com/image.jpg',
        alt: 'Test image',
        caption: 'Test caption',
      },
    };
    
    render(<PropertiesPanel {...props} />);
    
    expect(screen.getByText('Image Properties')).toBeInTheDocument();
    expect(screen.getByLabelText('Image URL')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/image.jpg')).toBeInTheDocument();
  });

  it('renders container component properties', () => {
    const props = {
      ...defaultProps,
      componentType: 'container',
      componentProps: {
        padding: 'lg',
        background: 'primary',
      },
    };
    
    render(<PropertiesPanel {...props} />);
    
    expect(screen.getByText('Container Properties')).toBeInTheDocument();
    expect(screen.getByLabelText('Padding')).toBeInTheDocument();
  });

  it('renders block component properties', () => {
    const props = {
      ...defaultProps,
      componentType: 'block',
      componentProps: {
        blockId: 'hero-1',
      },
    };
    
    render(<PropertiesPanel {...props} />);
    
    expect(screen.getByText('Block Properties')).toBeInTheDocument();
    expect(screen.getByLabelText('Block ID')).toBeInTheDocument();
    expect(screen.getByDisplayValue('hero-1')).toBeInTheDocument();
  });

  it('handles property changes', () => {
    const onPropsChange = jest.fn();
    const props = {
      ...defaultProps,
      componentType: 'text',
      componentProps: {
        content: 'Test content',
      },
      onPropsChange,
    };
    
    render(<PropertiesPanel {...props} />);
    
    const textarea = screen.getByLabelText('Content');
    fireEvent.change(textarea, { target: { value: 'New content' } });
    
    expect(onPropsChange).toHaveBeenCalledWith({ content: 'New content' });
  });

  it('shows locked state when component is locked', () => {
    const props = {
      ...defaultProps,
      componentType: 'text',
      componentProps: {
        content: 'Test content',
      },
      isLocked: true,
    };
    
    render(<PropertiesPanel {...props} />);
    
    expect(screen.getByText('This component is locked. Unlock it to make changes.')).toBeInTheDocument();
  });

  it('renders move buttons when callbacks are provided', () => {
    const props = {
      ...defaultProps,
      componentType: 'text',
      componentProps: {
        content: 'Test content',
      },
      onMoveUp: jest.fn(),
      onMoveDown: jest.fn(),
    };
    
    render(<PropertiesPanel {...props} />);
    
    expect(screen.getByText('Move Up')).toBeInTheDocument();
    expect(screen.getByText('Move Down')).toBeInTheDocument();
  });
});