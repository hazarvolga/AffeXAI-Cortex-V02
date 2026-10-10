import React from 'react';
import { render, screen } from '@testing-library/react';
import { ImageComponent } from '../image-component';

// Mock the editor context
jest.mock('../editor/editor-context', () => ({
  useEditor: () => ({
    isEditMode: false,
    updateComponentProps: jest.fn(),
  }),
}));

describe('ImageComponent', () => {
  const defaultProps = {
    id: 'test-image',
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
  };

  it('renders correctly with default props', () => {
    render(<ImageComponent {...defaultProps} />);
    
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Test image');
  });

  it('applies correct classes for fit and position', () => {
    render(
      <ImageComponent 
        {...defaultProps} 
        fit="cover" 
        position="center" 
      />
    );
    
    const image = screen.getByRole('img');
    expect(image).toHaveClass('object-cover', 'object-center');
  });

  it('applies correct classes for rounded corners', () => {
    render(<ImageComponent {...defaultProps} rounded="lg" />);
    
    const image = screen.getByRole('img');
    expect(image).toHaveClass('rounded-lg');
  });

  it('applies correct classes for shadow', () => {
    render(<ImageComponent {...defaultProps} shadow="md" />);
    
    const image = screen.getByRole('img');
    expect(image).toHaveClass('shadow');
  });

  it('shows caption when provided', () => {
    render(<ImageComponent {...defaultProps} caption="Test caption" />);
    
    expect(screen.getByText('Test caption')).toBeInTheDocument();
  });

  it('shows placeholder when src is empty', () => {
    render(<ImageComponent {...defaultProps} src="" />);
    
    expect(screen.getByText('No image selected')).toBeInTheDocument();
  });

  it('applies border classes when border is enabled', () => {
    render(<ImageComponent {...defaultProps} border={true} borderColor="primary" />);
    
    const image = screen.getByRole('img');
    expect(image).toHaveClass('border', 'border-primary');
  });

  it('sets loading attribute based on lazy prop', () => {
    const { rerender } = render(<ImageComponent {...defaultProps} lazy={true} />);
    
    let image = screen.getByRole('img');
    expect(image).toHaveAttribute('loading', 'lazy');
    
    rerender(<ImageComponent {...defaultProps} lazy={false} />);
    image = screen.getByRole('img');
    expect(image).toHaveAttribute('loading', 'eager');
  });
});